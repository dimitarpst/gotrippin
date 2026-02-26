"use server";

import {
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, AVATARS_BUCKET, getR2PublicUrl } from "@/lib/r2";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type PresignedResult =
  | { success: true; uploadUrl: string; key: string }
  | { success: false; error: string };

type UploadResult =
  | { success: true; url: string; key: string }
  | { success: false; error: string };

type ListResult =
  | { success: true; files: { url: string; key: string }[] }
  | { success: false; error: string };

type DeleteResult =
  | { success: true }
  | { success: false; error: string };

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_UPLOADED_AVATARS = 3;

/**
 * Get a presigned URL for direct browser-to-R2 upload.
 * No outbound HTTPS from Node — avoids TLS issues on Windows.
 */
export async function getPresignedAvatarUploadUrlAction(
  contentType: string,
  fileExtension: string
): Promise<PresignedResult> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  if (!ALLOWED_TYPES.includes(contentType)) {
    return { success: false, error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." };
  }

  const key = `avatars/${userId}/${userId}-${Date.now()}.${fileExtension}`;

  try {
    const command = new PutObjectCommand({
      Bucket: AVATARS_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
    return { success: true, uploadUrl, key };
  } catch (err) {
    console.error("Presign error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to get upload URL",
    };
  }
}

/**
 * Upload avatar: server gets presigned URL then uploads via native fetch (undici).
 * Avoids both browser CORS and S3 client TLS issues on Windows.
 */
export async function uploadAvatarAction(formData: FormData): Promise<UploadResult> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "File size must be less than 5MB" };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const presigned = await getPresignedAvatarUploadUrlAction(file.type, ext);

  if (!presigned.success) {
    return presigned;
  }

  try {
    const body = await file.arrayBuffer();
    const res = await fetch(presigned.uploadUrl, {
      method: "PUT",
      body,
      headers: { "Content-Type": file.type },
    });

    if (!res.ok) {
      return {
        success: false,
        error: `Upload failed: ${res.status} ${res.statusText}`,
      };
    }

    return {
      success: true,
      url: getR2PublicUrl(presigned.key),
      key: presigned.key,
    };
  } catch (err) {
    console.error("R2 upload (fetch) error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Upload failed",
    };
  }
}

export async function listAvatarsAction(): Promise<ListResult> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  const prefix = `avatars/${userId}/`;

  try {
    const allContents: { Key: string; Size?: number; LastModified?: Date }[] = [];
    let continuationToken: string | undefined;

    do {
      const result = await r2Client.send(
        new ListObjectsV2Command({
          Bucket: AVATARS_BUCKET,
          Prefix: prefix,
          MaxKeys: 100,
          ContinuationToken: continuationToken,
        })
      );

      const contents = result.Contents ?? [];
      const withKey = contents.filter((c): c is { Key: string; Size?: number; LastModified?: Date } => typeof c.Key === "string");
      allContents.push(...withKey);

      continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
    } while (continuationToken);

    const files = allContents
      .filter((obj): obj is { Key: string; Size?: number; LastModified?: Date } => Boolean(obj.Key))
      .filter((obj) => !obj.Size || obj.Size > 0)
      .sort((a, b) => {
        const aTime = a.LastModified?.getTime() ?? 0;
        const bTime = b.LastModified?.getTime() ?? 0;
        return bTime - aTime;
      })
      .slice(0, MAX_UPLOADED_AVATARS)
      .map((obj) => ({
        url: getR2PublicUrl(obj.Key!),
        key: obj.Key!,
      }));

    return { success: true, files };
  } catch (err) {
    console.error("R2 list error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to list avatars",
    };
  }
}

export async function deleteAvatarAction(key: string): Promise<DeleteResult> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  if (!key.startsWith(`avatars/${userId}/`)) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: AVATARS_BUCKET,
        Key: key,
      })
    );

    return { success: true };
  } catch (err) {
    console.error("R2 delete error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Delete failed",
    };
  }
}
