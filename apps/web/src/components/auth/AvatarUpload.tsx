"use client";

import { useState, useRef, useEffect } from "react";

function shouldRetryAvatarFetch(errorMessage: string, retryCount: number, maxRetries: number): boolean {
  const isTimeout = errorMessage.includes("timeout");
  const isRetriable = errorMessage.includes("network") || errorMessage.includes("fetch");
  return retryCount < maxRetries && !isTimeout && isRetriable;
}

function getUploadErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : "Upload failed";
  if (msg.includes("storage") || msg.includes("bucket")) {
    return "Storage error. Please check your permissions and try again.";
  }
  if (msg.includes("size")) {
    return "File is too large. Please choose a smaller image.";
  }
  return `Upload failed: ${msg}`;
}
import { motion } from "framer-motion";
import { Upload, Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const MAX_UPLOADED_AVATARS = 3;
import { useTranslation } from "react-i18next";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  /** Avatar URL from the profile (before edit). Never delete this file from storage when pruning. */
  profileAvatarUrl?: string | null;
  googleAvatarUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: string) => void;
  isEditing?: boolean;
  editSessionId: number;
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  profileAvatarUrl,
  googleAvatarUrl,
  onUploadSuccess,
  onUploadError,
  isEditing = false,
  editSessionId,
}: AvatarUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatarUrl || null);
  const [userAvatarFiles, setUserAvatarFiles] = useState<{ url: string; path: string }[]>([]);
  const [isLoadingAvatars, setIsLoadingAvatars] = useState(false);

  // Max loading time – stop skeleton after this to avoid indefinite loading for users with no avatars
  const MAX_LOADING_MS = 6000;

  // Update selected avatar when currentAvatarUrl changes
  useEffect(() => {
    setSelectedAvatar(currentAvatarUrl || null);
  }, [currentAvatarUrl]);

  const lastFetchedSession = useRef<number | null>(null);
  const knownUrlsRef = useRef<Set<string>>(new Set());

  // Fetch all user avatars from storage when an edit session starts
  useEffect(() => {
    if (!userId || !isEditing) return;
    if (lastFetchedSession.current === editSessionId) {
      return;
    }
    lastFetchedSession.current = editSessionId;
    knownUrlsRef.current = new Set();

    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 2;

    const forceStopLoadingTimer = setTimeout(() => {
      if (isMounted) setIsLoadingAvatars(false);
    }, MAX_LOADING_MS);

    const fetchUserAvatars = async () => {
      setIsLoadingAvatars(true);

      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Storage listing timeout')), 5000)
        );

        const listPromise = supabase.storage
          .from('avatars')
          .list(userId, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        const { data, error } = await Promise.race([listPromise, timeoutPromise]) as { data: any, error: any };

        if (error) {
          console.error('Supabase storage error:', error);
          if (error.message?.includes('not found') || error.message?.includes('No such bucket')) {
            setUserAvatarFiles([]);
            if (isMounted) setIsLoadingAvatars(false);
            return;
          }
          throw error;
        }

        const raw = Array.isArray(data) ? data : (data as any)?.files ?? [];
        const files = (raw as any[])
          .filter((file: any) => file?.name && !file.name.startsWith('.') && file.id != null)
          .sort((a: any, b: any) => {
            if (a.created_at && b.created_at) {
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            return (b.name ?? '').localeCompare(a.name ?? '');
          })
          .slice(0, MAX_UPLOADED_AVATARS)
          .map((file: any) => {
            const path = `${userId}/${file.name}`;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
            return { url: publicUrl, path };
          });

        setUserAvatarFiles(files);
      } catch (error) {
        if (!isMounted) return; // Component was unmounted

        console.warn('Error fetching user avatars (attempt', retryCount + 1, '):', error);

        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        if (shouldRetryAvatarFetch(errorMessage, retryCount, maxRetries)) {
          retryCount++;
          setTimeout(() => {
            if (isMounted) fetchUserAvatars();
          }, 1000);
          return;
        }

        // For timeout or other errors, just set empty array and stop loading
        // Don't show error to user - they can still use Google avatar or upload new
        setUserAvatarFiles([]);
      } finally {
        if (isMounted) {
          setIsLoadingAvatars(false);
        }
      }
    };

    fetchUserAvatars();

    return () => {
      isMounted = false;
      clearTimeout(forceStopLoadingTimer);
    };
  }, [userId, isEditing, editSessionId, onUploadError]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      onUploadError?.("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onUploadError?.("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const combined = [{ url: publicUrl, path: filePath }, ...userAvatarFiles];
      const nextFiles = combined.slice(0, MAX_UPLOADED_AVATARS);

      // Delete oldest from storage if we exceed the limit — never delete the current profile pic
      if (combined.length > MAX_UPLOADED_AVATARS) {
        const candidatesToRemove = combined.slice(MAX_UPLOADED_AVATARS);
        const toRemove = candidatesToRemove.find((f) => !profileAvatarUrl || f.url !== profileAvatarUrl);
        if (toRemove) {
          await supabase.storage.from('avatars').remove([toRemove.path]);
        }
      }

      setUserAvatarFiles(nextFiles);
      setSelectedAvatar(publicUrl);
      onUploadSuccess(publicUrl);

    } catch (error) {
      console.error("Error uploading avatar:", error);
      onUploadError?.(getUploadErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectAvatar = (url: string) => {
    setSelectedAvatar(url);
    onUploadSuccess(url);
  };

  if (!isEditing) {
    return null;
  }

  const userAvatarUrls = userAvatarFiles.map((f) => f.url);
  const baseUrls: string[] = [
    ...(googleAvatarUrl ? [googleAvatarUrl] : []),
    ...userAvatarUrls.filter((url) => url !== googleAvatarUrl),
    ...(currentAvatarUrl && !userAvatarUrls.includes(currentAvatarUrl) && currentAvatarUrl !== googleAvatarUrl
      ? [currentAvatarUrl]
      : []),
  ];
  baseUrls.forEach((u) => knownUrlsRef.current.add(u));
  const baseSet = new Set(baseUrls);
  const extraFromKnown = Array.from(knownUrlsRef.current).filter((u) => !baseSet.has(u));
  const allAvatarUrls: string[] = [...baseUrls, ...extraFromKnown];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <p className="text-xs text-white/60 font-medium">{t("profile.avatar_section_title")}</p>

      {isLoadingAvatars && allAvatarUrls.length === 0 ? (
        <div className="flex flex-wrap gap-2">
          {/* Skeleton loaders - only show if no avatars available yet */}
          {Array.from({ length: 6 }).map((_, index) => (
            <motion.div
              key={`skeleton-${index}`}
              className="w-12 h-12 rounded-lg bg-white/5 animate-pulse shrink-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {allAvatarUrls.map((url, index) => (
            <motion.button
              key={url}
              type="button"
              onClick={() => handleSelectAvatar(url)}
              className="relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all hover:scale-105"
              style={{
                borderColor: selectedAvatar === url ? "#ff6b6b" : "rgba(255,255,255,0.1)",
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <img
                src={url}
                alt={`Avatar ${index + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0QzE0IDUuMSAxMy4xIDYgMTIgNkMxMC45IDYgMTAgNS4xIDEwIDRDMTAgMi45IDEwLjkgMiAxMiAyWk0yMSAxOVYyMEgzVjE5QzMgMTYuMzMgNS4zMyAxNCA4IDE0SDE2QzE4LjY3IDE0IDIxIDE2LjMzIDIxIDE5WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K";
                  e.currentTarget.style.opacity = "0.5";
                }}
              />
              {selectedAvatar === url && (
                <div className="absolute inset-0 bg-[#ff6b6b]/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white drop-shadow-lg" />
                </div>
              )}
            </motion.button>
          ))}

          {/* Upload New Button */}
          <motion.label
            className="relative w-12 h-12 rounded-lg bg-white/5 border border-white/8 hover:bg-white/10 cursor-pointer transition-all flex items-center justify-center hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4 text-white/60" />
            )}
          </motion.label>
        </div>
      )}

      <p className="text-xs text-white/40">
        {t("profile.avatar_section_description")}
      </p>
    </motion.div>
  );
}

