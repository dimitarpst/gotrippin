"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  googleAvatarUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: string) => void;
  isEditing?: boolean;
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  googleAvatarUrl,
  onUploadSuccess,
  onUploadError,
  isEditing = false,
}: AvatarUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatarUrl || null);

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

      setSelectedAvatar(publicUrl);
      onUploadSuccess(publicUrl);
      
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Upload failed";
      onUploadError?.(msg);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <p className="text-xs text-white/60 font-medium">Avatar Options</p>
      <div className="flex items-center gap-2">
        {/* Google Avatar Option */}
        {googleAvatarUrl && (
          <motion.button
            type="button"
            onClick={() => handleSelectAvatar(googleAvatarUrl)}
            className="relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all hover:scale-105"
            style={{
              borderColor: selectedAvatar === googleAvatarUrl ? '#ff6b6b' : 'rgba(255,255,255,0.1)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img
              src={googleAvatarUrl}
              alt="Google avatar"
              className="w-full h-full object-cover"
            />
            {selectedAvatar === googleAvatarUrl && (
              <div className="absolute inset-0 bg-[#ff6b6b]/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-white drop-shadow-lg" />
              </div>
            )}
          </motion.button>
        )}

        {/* Current Avatar (if different from Google) */}
        {currentAvatarUrl && currentAvatarUrl !== googleAvatarUrl && (
          <motion.button
            type="button"
            onClick={() => handleSelectAvatar(currentAvatarUrl)}
            className="relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all hover:scale-105"
            style={{
              borderColor: selectedAvatar === currentAvatarUrl ? '#ff6b6b' : 'rgba(255,255,255,0.1)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img
              src={currentAvatarUrl}
              alt="Current avatar"
              className="w-full h-full object-cover"
            />
            {selectedAvatar === currentAvatarUrl && (
              <div className="absolute inset-0 bg-[#ff6b6b]/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-white drop-shadow-lg" />
              </div>
            )}
          </motion.button>
        )}

        {/* Upload New Button */}
        <label className="relative w-12 h-12 rounded-lg bg-white/5 border border-white/8 hover:bg-white/10 cursor-pointer transition-all flex items-center justify-center hover:scale-105">
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
        </label>
      </div>
      <p className="text-xs text-white/40">
        {googleAvatarUrl ? "Select Google avatar or upload new" : "Upload a custom avatar"}
      </p>
    </motion.div>
  );
}

