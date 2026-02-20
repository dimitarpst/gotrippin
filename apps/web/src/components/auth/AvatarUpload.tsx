"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  uploadAvatarAction,
  listAvatarsAction,
  deleteAvatarAction,
} from "@/actions/upload";
import { resolveAvatarUrl } from "@/lib/avatar";

const MAX_UPLOADED_AVATARS = 3;
const MAX_LOADING_MS = 6000;

/** displayUrl = what <img> renders; storageValue = what gets saved to DB */
interface AvatarOption {
  displayUrl: string;
  storageValue: string;
  r2Key?: string;
}

interface AvatarUploadProps {
  userId: string;
  /** Current avatar value from DB (could be a key or full URL) */
  currentAvatarUrl?: string | null;
  /** Avatar value saved in profile before this edit session */
  profileAvatarUrl?: string | null;
  googleAvatarUrl?: string | null;
  onUploadSuccess: (storageValue: string) => void;
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
  const [selectedDisplayUrl, setSelectedDisplayUrl] = useState<string | null>(
    resolveAvatarUrl(currentAvatarUrl) || null
  );
  const [r2Avatars, setR2Avatars] = useState<AvatarOption[]>([]);
  const [isLoadingAvatars, setIsLoadingAvatars] = useState(false);

  useEffect(() => {
    setSelectedDisplayUrl(resolveAvatarUrl(currentAvatarUrl) || null);
  }, [currentAvatarUrl]);

  const lastFetchedSession = useRef<number | null>(null);
  const knownDisplayUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId || !isEditing) return;
    if (lastFetchedSession.current === editSessionId) return;
    lastFetchedSession.current = editSessionId;
    knownDisplayUrlsRef.current = new Set();

    let isMounted = true;

    const forceStopLoadingTimer = setTimeout(() => {
      if (isMounted) setIsLoadingAvatars(false);
    }, MAX_LOADING_MS);

    const fetchUserAvatars = async () => {
      setIsLoadingAvatars(true);
      try {
        const result = await listAvatarsAction();
        // Always apply successful result so Strict Mode double-mount doesn't drop the update
        if (result.success) {
          setR2Avatars(
            result.files.map((f) => ({
              displayUrl: f.url,
              storageValue: f.key,
              r2Key: f.key,
            }))
          );
        } else {
          console.warn("Failed to list avatars:", result.error);
          if (isMounted) setR2Avatars([]);
        }
      } catch (err) {
        console.warn("Error fetching avatars:", err);
        if (isMounted) setR2Avatars([]);
      } finally {
        if (isMounted) setIsLoadingAvatars(false);
      }
    };

    fetchUserAvatars();

    return () => {
      isMounted = false;
      clearTimeout(forceStopLoadingTimer);
    };
  }, [userId, isEditing, editSessionId]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onUploadError?.("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onUploadError?.("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadAvatarAction(formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      const newOption: AvatarOption = {
        displayUrl: result.url,
        storageValue: result.key,
        r2Key: result.key,
      };

      const combined = [newOption, ...r2Avatars];
      const nextAvatars = combined.slice(0, MAX_UPLOADED_AVATARS);

      if (combined.length > MAX_UPLOADED_AVATARS) {
        const profileResolved = resolveAvatarUrl(profileAvatarUrl);
        const toRemove = combined
          .slice(MAX_UPLOADED_AVATARS)
          .find((f) => !profileResolved || f.displayUrl !== profileResolved);
        if (toRemove?.r2Key) {
          deleteAvatarAction(toRemove.r2Key).catch(console.error);
        }
      }

      setR2Avatars(nextAvatars);
      setSelectedDisplayUrl(newOption.displayUrl);
      onUploadSuccess(result.key);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      const msg = error instanceof Error ? error.message : "Upload failed";
      onUploadError?.(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectAvatar = (option: AvatarOption) => {
    setSelectedDisplayUrl(option.displayUrl);
    onUploadSuccess(option.storageValue);
  };

  if (!isEditing) return null;

  // Build the combined list of avatar options for display. Show all R2 avatars first, then Google, then current/legacy.
  const allOptions: AvatarOption[] = [];
  const seenDisplayUrls = new Set<string>();

  const addOption = (opt: AvatarOption) => {
    if (!seenDisplayUrls.has(opt.displayUrl)) {
      seenDisplayUrls.add(opt.displayUrl);
      allOptions.push(opt);
    }
  };

  // 1. All R2-uploaded avatars (never dedupe — list already returns up to 3)
  for (const opt of r2Avatars) {
    allOptions.push(opt);
    seenDisplayUrls.add(opt.displayUrl);
  }

  // 2. Google avatar if not already in list
  if (googleAvatarUrl) {
    addOption({
      displayUrl: googleAvatarUrl,
      storageValue: googleAvatarUrl,
    });
  }

  // 3. Current avatar from DB (legacy Supabase URL or R2 key not in list)
  if (currentAvatarUrl) {
    const resolved = resolveAvatarUrl(currentAvatarUrl);
    if (resolved) {
      addOption({
        displayUrl: resolved,
        storageValue: currentAvatarUrl,
      });
    }
  }

  // 4. Previously seen URLs from past sessions (e.g. deleted from R2 but user had selected)
  for (const url of knownDisplayUrlsRef.current) {
    if (!seenDisplayUrls.has(url)) {
      addOption({ displayUrl: url, storageValue: url });
    }
  }
  for (const opt of allOptions) {
    knownDisplayUrlsRef.current.add(opt.displayUrl);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <p className="text-xs text-white/60 font-medium">{t("profile.avatar_section_title")}</p>

      {isLoadingAvatars && allOptions.length === 0 ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={`skeleton-${index}`}
              className="w-12 h-12 rounded-lg bg-white/5 shrink-0"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {allOptions.map((opt, index) => (
            <motion.button
              key={opt.r2Key ?? opt.storageValue ?? opt.displayUrl}
              type="button"
              onClick={() => handleSelectAvatar(opt)}
              className="relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all hover:scale-105"
              style={{
                borderColor:
                  selectedDisplayUrl === opt.displayUrl
                    ? "#ff6b6b"
                    : "rgba(255,255,255,0.1)",
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <img
                src={opt.displayUrl}
                alt={`Avatar ${index + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.warn("Avatar image failed to load:", e.currentTarget.src);
                  e.currentTarget.style.visibility = "hidden";
                }}
              />
              {selectedDisplayUrl === opt.displayUrl && (
                <div className="absolute inset-0 bg-[#ff6b6b]/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white drop-shadow-lg" />
                </div>
              )}
            </motion.button>
          ))}

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
              <Spinner className="size-4 text-white" />
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
