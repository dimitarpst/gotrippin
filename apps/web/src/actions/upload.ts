"use server";

import { randomUUID } from "node:crypto";
import {
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client } from "@/lib/r2";
import { AVATARS_BUCKET, getR2PublicUrl, TRIP_IMAGES_KEY_PREFIX } from "@/lib/r2-public";
import { ApiError, fetchTripById } from "@/lib/api/trips";
import { createServerSupabaseClient, getServerAuthToken } from "@/lib/supabase-server";

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
const MAX_TRIP_COVER_FILE_SIZE = 8 * 1024 * 1024; // 8MB — trip hero image
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_UPLOADED_AVATARS = 3;

/** User-scoped prefix; must match backend `ImagesService.registerUploadedTripCoverPhoto`. */
function tripCoverUploadKey(userId: string, fileExtension: string): string {
  return `${TRIP_IMAGES_KEY_PREFIX}uploads/${userId}/${randomUUID()}.${fileExtension}`;
}

function isUuidTripId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function normalizeGalleryFileExtension(raw: string): string {
  const e = raw.replace(/^\./, "").toLowerCase();
  if (e === "jpeg") return "jpg";
  if (e === "jpg" || e === "png" || e === "webp" || e === "gif") return e;
  return "jpg";
}

/** Must match backend `TripsService` gallery key prefix. */
function tripGalleryUploadKey(tripId: string, fileExtension: string): string {
  const ext = normalizeGalleryFileExtension(fileExtension);
  return `${TRIP_IMAGES_KEY_PREFIX}gallery/${tripId}/${randomUUID()}.${ext}`;
}

/**
 * Nest + service role — used when direct `trip_members` read fails (RLS / policy edge cases).
 */
async function assertTripMembershipViaBackend(
  tripId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = await getServerAuthToken();
  if (!token) {
    return { ok: false, error: "Authentication required" };
  }

  try {
    await fetchTripById(tripId, token);
    return { ok: true };
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.statusCode === 401) {
        return { ok: false, error: "Authentication required" };
      }
      if (e.statusCode === 403 || e.statusCode === 404) {
        return { ok: false, error: "Not a member of this trip" };
      }
    }
    console.error("Trip membership check (gallery presign, API):", e);
    return { ok: false, error: "Could not verify trip access" };
  }
}

async function assertUserIsTripMember(
  tripId: string,
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isUuidTripId(tripId)) {
    return { ok: false, error: "Invalid trip" };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("trip_members")
    .select("trip_id")
    .eq("trip_id", tripId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn(
      "Trip membership check (gallery presign): Supabase error, falling back to API:",
      error
    );
    return assertTripMembershipViaBackend(tripId);
  }

  if (!data) {
    return { ok: false, error: "Not a member of this trip" };
  }

  return { ok: true };
}

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

/**
 * Presigned PUT for a trip cover image. Key is under `trip-images/uploads/{userId}/`.
 */
export async function getPresignedTripCoverUploadUrlAction(
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

  const key = tripCoverUploadKey(userId, fileExtension);

  try {
    const command = new PutObjectCommand({
      Bucket: AVATARS_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
    return { success: true, uploadUrl, key };
  } catch (err) {
    console.error("Presign trip cover error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to get upload URL",
    };
  }
}

/**
 * Upload trip cover: server presigns then PUTs bytes to R2 (same pattern as avatar).
 */
/**
 * Presigned PUT for a trip gallery image. Key is `trip-images/gallery/{tripId}/{uuid}.ext`.
 * Caller must be a member of the trip (checked via `trip_members`).
 */
export async function getPresignedTripGalleryUploadUrlAction(
  tripId: string,
  contentType: string,
  fileExtension: string
): Promise<PresignedResult> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  const member = await assertUserIsTripMember(tripId, userId);
  if (!member.ok) {
    return { success: false, error: member.error };
  }

  if (!ALLOWED_TYPES.includes(contentType)) {
    return { success: false, error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." };
  }

  const key = tripGalleryUploadKey(tripId, fileExtension);
  const expectedPrefix = `${TRIP_IMAGES_KEY_PREFIX}gallery/${tripId}/`;
  if (!key.startsWith(expectedPrefix)) {
    return { success: false, error: "Invalid upload key" };
  }

  try {
    const command = new PutObjectCommand({
      Bucket: AVATARS_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
    return { success: true, uploadUrl, key };
  } catch (err) {
    console.error("Presign trip gallery error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to get upload URL",
    };
  }
}

export async function uploadTripCoverAction(formData: FormData): Promise<UploadResult> {
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

  if (file.size > MAX_TRIP_COVER_FILE_SIZE) {
    return { success: false, error: "File size must be less than 8MB" };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const presigned = await getPresignedTripCoverUploadUrlAction(file.type, ext);

  if (!presigned.success) {
    return presigned;
  }

  if (!presigned.key.startsWith(`${TRIP_IMAGES_KEY_PREFIX}uploads/${userId}/`)) {
    return { success: false, error: "Invalid upload key" };
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
    console.error("R2 trip cover upload error:", err);
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
