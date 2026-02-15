"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "react-i18next";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  googleAvatarUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: string) => void;
  isEditing?: boolean;
  editSessionId: number;
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
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
  const [userAvatars, setUserAvatars] = useState<string[]>([]);
  const [isLoadingAvatars, setIsLoadingAvatars] = useState(false);

  // Max loading time – stop skeleton after this to avoid indefinite loading for users with no avatars
  const MAX_LOADING_MS = 6000;

  // Update selected avatar when currentAvatarUrl changes
  useEffect(() => {
    setSelectedAvatar(currentAvatarUrl || null);
  }, [currentAvatarUrl]);

  const lastFetchedSession = useRef<number | null>(null);

  // Fetch all user avatars from storage when an edit session starts
  useEffect(() => {
    if (!userId || !isEditing) return;
    if (lastFetchedSession.current === editSessionId) {
      return;
    }
    lastFetchedSession.current = editSessionId;

    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 2;

    const forceStopLoadingTimer = setTimeout(() => {
      if (isMounted) setIsLoadingAvatars(false);
    }, MAX_LOADING_MS);

    const fetchUserAvatars = async () => {
      // Show loading state
      setIsLoadingAvatars(true);

      try {
        // Add timeout to prevent hanging forever
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Storage listing timeout')), 5000)
        );

        const listPromise = supabase.storage
          .from('avatars')
          .list(userId, {
            limit: 100,
            offset: 0
          });

        const { data, error } = await Promise.race([listPromise, timeoutPromise]) as { data: any, error: any };

        if (error) {
          console.error('Supabase storage error:', error);
          // Don't throw for "not found" errors - just use empty array
          if (error.message?.includes('not found') || error.message?.includes('No such bucket')) {
            setUserAvatars([]);
            if (isMounted) setIsLoadingAvatars(false);
            return;
          }
          throw error;
        }

        if (!isMounted) return; // Component was unmounted

        // Get public URLs for all avatars, sorted by creation date (newest first)
        const avatarUrls = (data || [])
          .filter((file: any) => file.name && !file.name.startsWith('.')) // Filter out hidden files
          .sort((a: any, b: any) => {
            // Sort by created_at if available, otherwise by name (which includes timestamp)
            if (a.created_at && b.created_at) {
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            return b.name.localeCompare(a.name);
          })
          .map((file: any) => {
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(`${userId}/${file.name}`);
            return publicUrl;
          });

        setUserAvatars(avatarUrls);
      } catch (error) {
        if (!isMounted) return; // Component was unmounted

        console.warn('Error fetching user avatars (attempt', retryCount + 1, '):', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Retry on certain errors (but not timeout)
        if (retryCount < maxRetries && !errorMessage.includes('timeout') && (
          errorMessage.includes('network') ||
          errorMessage.includes('fetch')
        )) {
          retryCount++;
          setTimeout(() => {
            if (isMounted) fetchUserAvatars();
          }, 1000);
          return;
        }

        // For timeout or other errors, just set empty array and stop loading
        // Don't show error to user - they can still use Google avatar or upload new
        setUserAvatars([]);
      } finally {
        if (isMounted) {
          setIsLoadingAvatars(false);
        }
      }
    };

    setUserAvatars([]);
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

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add new avatar to the list
      setUserAvatars(prev => [publicUrl, ...prev]);
      setSelectedAvatar(publicUrl);
      onUploadSuccess(publicUrl);

    } catch (error) {
      console.error('Error uploading avatar:', error);
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      if (errorMessage.includes('storage') || errorMessage.includes('bucket')) {
        onUploadError?.('Storage error. Please check your permissions and try again.');
      } else if (errorMessage.includes('size')) {
        onUploadError?.('File is too large. Please choose a smaller image.');
      } else {
        onUploadError?.(`Upload failed: ${errorMessage}`);
      }
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

  // Combine Google avatar and user avatars, removing duplicates
  const allAvatars = [
    ...(googleAvatarUrl ? [googleAvatarUrl] : []),
    ...userAvatars.filter(url => url !== googleAvatarUrl)
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <p className="text-xs text-white/60 font-medium">{t("profile.avatar_section_title")}</p>

      {isLoadingAvatars && allAvatars.length === 0 ? (
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
          {/* Show Google avatar immediately if available, even while loading */}
          {allAvatars.map((avatarUrl, index) => (
            <motion.button
              key={avatarUrl}
              type="button"
              onClick={() => handleSelectAvatar(avatarUrl)}
              className="relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all hover:scale-105"
              style={{
                borderColor: selectedAvatar === avatarUrl ? '#ff6b6b' : 'rgba(255,255,255,0.1)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <img
                src={avatarUrl}
                alt={`Avatar ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Replace broken images with a placeholder
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0QzE0IDUuMSAxMy4xIDYgMTIgNkMxMC45IDYgMTAgNS4xIDEwIDRDMTAgMi45IDEwLjkgMiAxMiAyWk0yMSAxOVYyMEgzVjE5QzMgMTYuMzMgNS4zMyAxNCA4IDE0SDE2QzE4LjY3IDE0IDIxIDE2LjMzIDIxIDE5WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                  e.currentTarget.style.opacity = '0.5';
                }}
              />
              {selectedAvatar === avatarUrl && (
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

