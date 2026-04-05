"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Images, Loader2, Search, Trash2, Upload, Wallpaper } from "lucide-react";
import type { CoverPhotoInput, Trip, TripGalleryImage } from "@gotrippin/core";
import { toast } from "sonner";

import { BackgroundPicker } from "@/components/trips/background-picker";
import { getPresignedTripGalleryUploadUrlAction } from "@/actions/upload";
import { getAuthToken } from "@/lib/api/auth";
import {
  addTripGalleryFromUnsplash,
  deleteTripGalleryImage,
  registerTripGalleryImage,
  setTripCoverFromGalleryImage,
} from "@/lib/api/trips";
import { CoverImageWithBlur } from "@/components/ui/cover-image-with-blur";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getR2PublicUrl } from "@/lib/r2";
import {
  galleryImageStorageKey,
  tripCoverBlurHash,
  tripCoverStorageKey,
} from "@/lib/trip-cover-key";

const MAX_GALLERY_PHOTOS = 100;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/** Stable React key for the non-gallery trip cover tile (Unsplash / create-time cover). */
const EMBEDDED_COVER_GRID_KEY = "embedded-trip-cover";

async function fileToBlurAndDimensions(file: File): Promise<{
  blurHash: string | null;
  width: number;
  height: number;
}> {
  const url = URL.createObjectURL(file);
  try {
    const { width, height, imageData } = await new Promise<{
      width: number;
      height: number;
      imageData: ImageData;
    }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx || w <= 0 || h <= 0) {
          reject(new Error("Invalid image"));
          return;
        }
        const tw = 32;
        const th = Math.max(1, Math.round((h / w) * tw));
        canvas.width = tw;
        canvas.height = th;
        ctx.drawImage(img, 0, 0, tw, th);
        resolve({
          width: w,
          height: h,
          imageData: ctx.getImageData(0, 0, tw, th),
        });
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = url;
    });

    let blurHash: string | null = null;
    try {
      const { encode } = await import("blurhash");
      blurHash = encode(
        imageData.data,
        imageData.width,
        imageData.height,
        4,
        4
      );
    } catch (e) {
      console.error("[TripGallery] blurhash encode failed:", e);
    }

    return { blurHash, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function TripGallery({
  trip,
  tripId,
  initialImages,
  coverImageUrl,
  onCoverPersistedFromApi,
}: {
  trip: Trip;
  tripId: string;
  initialImages: TripGalleryImage[];
  /** Resolved cover URL when trip has a photo background (may not match any gallery `storage_key`). */
  coverImageUrl?: string | null;
  /** Called with the trip returned by the API after setting cover from a gallery image (avoids stale UI). */
  onCoverPersistedFromApi?: (next: Trip) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [images, setImages] = useState<TripGalleryImage[]>(initialImages);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [unsplashOpen, setUnsplashOpen] = useState(false);
  const [unsplashBusy, setUnsplashBusy] = useState(false);
  const [settingCoverId, setSettingCoverId] = useState<string | null>(null);

  const galleryRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<{ destroy: () => void } | null>(null);
  const imageCountRef = useRef(initialImages.length);

  const coverStorageKey = tripCoverStorageKey(trip);
  const coverBlurHash = tripCoverBlurHash(trip);
  const coverInGallery = Boolean(
    coverStorageKey &&
      images.some(
        (i) => galleryImageStorageKey(i.storage_key) === coverStorageKey,
      ),
  );
  const resolvedCoverSrc =
    coverImageUrl && coverImageUrl.trim() !== ""
      ? coverImageUrl.trim()
      : coverStorageKey
        ? getR2PublicUrl(coverStorageKey)
        : null;
  const showEmbeddedCoverTile = Boolean(
    resolvedCoverSrc && coverStorageKey && !coverInGallery,
  );
  const hasGalleryGrid = showEmbeddedCoverTile || images.length > 0;
  const defaultUnsplashQuery =
    trip.destination?.trim() || trip.title?.trim() || "";

  const idsKey = useMemo(
    () =>
      `${showEmbeddedCoverTile ? "cov|" : ""}${images.map((i) => i.id).join("|")}`,
    [showEmbeddedCoverTile, images],
  );

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  useEffect(() => {
    imageCountRef.current = images.length;
  }, [images.length]);

  useEffect(() => {
    lightboxRef.current?.destroy();
    lightboxRef.current = null;

    if (!hasGalleryGrid) {
      return;
    }

    const root = galleryRef.current;
    if (!root) {
      return;
    }

    let disposed = false;

    void (async () => {
      await import("photoswipe/style.css");
      const { default: PhotoSwipeLightbox } = await import("photoswipe/lightbox");
      if (disposed) {
        return;
      }
      const lb = new PhotoSwipeLightbox({
        gallery: root,
        children: "a[data-pswp-src]",
        pswpModule: () => import("photoswipe"),
      });
      lb.init();
      if (disposed) {
        lb.destroy();
        return;
      }
      lightboxRef.current = lb;
    })();

    return () => {
      disposed = true;
      lightboxRef.current?.destroy();
      lightboxRef.current = null;
    };
  }, [hasGalleryGrid, idsKey]);

  const uploadOne = useCallback(
    async (file: File): Promise<boolean> => {
      if (!ALLOWED_MIME.has(file.type)) {
        toast.error(
          t("trip_gallery.invalid_type", {
            defaultValue: "Use JPEG, PNG, WebP, or GIF.",
          })
        );
        return false;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(
          t("trip_gallery.too_large", {
            defaultValue: "Each photo must be under 8MB.",
          })
        );
        return false;
      }

      const ext =
        file.name.split(".").pop() ??
        (file.type === "image/png" ? "png" : "jpg");

      const presigned = await getPresignedTripGalleryUploadUrlAction(
        tripId,
        file.type,
        ext
      );
      if (!presigned.success) {
        toast.error(
          t("trip_gallery.upload_failed", { defaultValue: "Upload failed" }),
          { description: presigned.error }
        );
        return false;
      }

      const body = await file.arrayBuffer();
      const putRes = await fetch(presigned.uploadUrl, {
        method: "PUT",
        body,
        headers: { "Content-Type": file.type },
      });
      if (!putRes.ok) {
        toast.error(
          t("trip_gallery.upload_failed", { defaultValue: "Upload failed" }),
          {
            description: `${putRes.status} ${putRes.statusText}`,
          }
        );
        return false;
      }

      let meta: { blurHash: string | null; width: number; height: number };
      try {
        meta = await fileToBlurAndDimensions(file);
      } catch (e) {
        console.error("[TripGallery] image meta failed:", e);
        meta = { blurHash: null, width: 1600, height: 1200 };
      }

      const token = await getAuthToken();
      if (!token) {
        toast.error(
          t("trip_gallery.auth_required", {
            defaultValue: "Sign in again to save photos.",
          })
        );
        return false;
      }

      try {
        const row = await registerTripGalleryImage(
          tripId,
          {
            storage_key: presigned.key,
            blur_hash: meta.blurHash,
            width: meta.width,
            height: meta.height,
          },
          token
        );
        setImages((prev) => [...prev, row]);
        toast.success(
          t("trip_gallery.added", { defaultValue: "Photo added" })
        );
        router.refresh();
        return true;
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : t("trip_gallery.register_failed", {
                defaultValue: "Could not save photo to trip",
              });
        toast.error(
          t("trip_gallery.register_failed", {
            defaultValue: "Could not save photo to trip",
          }),
          { description: message }
        );
        return false;
      }
    },
    [router, t, tripId]
  );

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (imageCountRef.current >= MAX_GALLERY_PHOTOS) {
        toast.error(
          t("trip_gallery.limit_reached", {
            defaultValue: "Maximum photos for this trip reached.",
          })
        );
        return;
      }
      setUploadBusy(true);
      try {
        let n = imageCountRef.current;
        for (const file of accepted) {
          if (n >= MAX_GALLERY_PHOTOS) {
            break;
          }
          const ok = await uploadOne(file);
          if (ok) {
            n += 1;
            imageCountRef.current = n;
          }
        }
      } finally {
        setUploadBusy(false);
      }
    },
    [t, uploadOne]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
    },
    disabled: uploadBusy || images.length >= MAX_GALLERY_PHOTOS,
    multiple: true,
    noClick: images.length > 0 || showEmbeddedCoverTile,
    noKeyboard: images.length > 0 || showEmbeddedCoverTile,
  });

  const handleUnsplashImage = useCallback(
    async (_type: "image", value: CoverPhotoInput) => {
      if (imageCountRef.current >= MAX_GALLERY_PHOTOS) {
        toast.error(
          t("trip_gallery.limit_reached", {
            defaultValue: "Maximum photos for this trip reached.",
          })
        );
        return;
      }
      setUnsplashBusy(true);
      try {
        const token = await getAuthToken();
        if (!token) {
          toast.error(
            t("trip_gallery.auth_required", {
              defaultValue: "Sign in again to save photos.",
            })
          );
          return;
        }
        const row = await addTripGalleryFromUnsplash(tripId, value, token);
        setImages((prev) => [...prev, row]);
        imageCountRef.current += 1;
        toast.success(
          t("trip_gallery.unsplash_added", {
            defaultValue: "Photo added from Unsplash",
          })
        );
        setUnsplashOpen(false);
        router.refresh();
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        toast.error(
          t("trip_gallery.unsplash_failed", {
            defaultValue: "Could not add Unsplash photo",
          }),
          { description: message }
        );
      } finally {
        setUnsplashBusy(false);
      }
    },
    [router, t, tripId]
  );

  const handleSetCover = useCallback(
    async (galleryImageId: string) => {
      setSettingCoverId(galleryImageId);
      try {
        const token = await getAuthToken();
        if (!token) {
          toast.error(
            t("trip_gallery.auth_required", {
              defaultValue: "Sign in again to save photos.",
            })
          );
          return;
        }
        const updatedTrip = await setTripCoverFromGalleryImage(
          tripId,
          galleryImageId,
          token,
        );
        onCoverPersistedFromApi?.(updatedTrip);
        toast.success(
          t("trip_gallery.background_updated", {
            defaultValue: "Background updated",
          })
        );
        router.refresh();
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        toast.error(
          t("trip_gallery.background_failed", {
            defaultValue: "Could not update background",
          }),
          { description: message }
        );
      } finally {
        setSettingCoverId(null);
      }
    },
    [onCoverPersistedFromApi, router, t, tripId]
  );

  const handleDelete = useCallback(
    async (imageId: string) => {
      setDeletingId(imageId);
      try {
        const token = await getAuthToken();
        if (!token) {
          toast.error(
            t("trip_gallery.auth_required", {
              defaultValue: "Sign in again to save photos.",
            })
          );
          return;
        }
        await deleteTripGalleryImage(tripId, imageId, token);
        setImages((prev) => prev.filter((i) => i.id !== imageId));
        toast.success(
          t("trip_gallery.removed", { defaultValue: "Photo removed" })
        );
        router.refresh();
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        toast.error(
          t("trip_gallery.remove_failed", {
            defaultValue: "Could not remove photo",
          }),
          { description: message }
        );
      } finally {
        setDeletingId(null);
      }
    },
    [router, t, tripId]
  );

  const atLimit = images.length >= MAX_GALLERY_PHOTOS;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full shrink-0 gap-2 sm:w-auto dark:border-white/20"
          disabled={atLimit || unsplashBusy || uploadBusy}
          onClick={() => setUnsplashOpen(true)}
        >
          {unsplashBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {t("trip_gallery.search_unsplash", {
            defaultValue: "Search Unsplash",
          })}
        </Button>
      </div>

      <BackgroundPicker
        open={unsplashOpen}
        onClose={() => setUnsplashOpen(false)}
        onSelect={handleUnsplashImage}
        onSelectColor={() => {}}
        variant="unsplashOnly"
        defaultSearchQuery={defaultUnsplashQuery}
      />

      <div
        {...getRootProps({
          className: cn(
            "relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 px-4 py-8 text-center transition-colors dark:border-white/15 dark:bg-white/[0.03]",
            isDragActive && "border-primary bg-primary/5",
            (uploadBusy || atLimit) && "pointer-events-none opacity-60"
          ),
        })}
      >
        <input {...getInputProps()} />
        {uploadBusy ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
        <p className="mt-2 text-sm font-medium text-foreground">
          {atLimit
            ? t("trip_gallery.dropzone_full", {
                defaultValue: "Gallery is full (100 photos max).",
              })
            : t("trip_gallery.dropzone_title", {
                defaultValue: "Drop photos here or tap to upload",
              })}
        </p>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          {t("trip_gallery.dropzone_hint", {
            defaultValue: "JPEG, PNG, WebP, or GIF — up to 8MB each.",
          })}
        </p>
        {(images.length > 0 || showEmbeddedCoverTile) && !atLimit && (
          <button
            type="button"
            className="mt-4 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent dark:border-white/15"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
          >
            {t("trip_gallery.add_more", { defaultValue: "Add more photos" })}
          </button>
        )}
      </div>

      {!hasGalleryGrid ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/30 py-16 text-center dark:border-white/[0.08]">
          <Images className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t("trip_gallery.empty", {
              defaultValue: "No photos yet — upload to build your trip gallery.",
            })}
          </p>
        </div>
      ) : (
        <div
          ref={galleryRef}
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 sm:gap-3"
        >
          {showEmbeddedCoverTile && resolvedCoverSrc ? (
            <div
              key={EMBEDDED_COVER_GRID_KEY}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border/70 bg-muted/20 ring-2 ring-[#ff7670] dark:border-white/[0.08]"
            >
              <span className="absolute left-2 top-2 z-30 rounded-md bg-[#ff7670] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
                {t("trip_gallery.background_badge", {
                  defaultValue: "Background",
                })}
              </span>
              <a
                href={resolvedCoverSrc}
                data-pswp-src={resolvedCoverSrc}
                data-pswp-width={1600}
                data-pswp-height={1200}
                target="_blank"
                rel="noreferrer"
                className="block h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={t("trip_gallery.open_lightbox", {
                  defaultValue: "Open photo",
                })}
              >
                <CoverImageWithBlur
                  src={resolvedCoverSrc}
                  alt={t("trip_gallery.photo_alt", {
                    defaultValue: "Trip gallery photo",
                  })}
                  blurHash={coverBlurHash ?? undefined}
                  className="h-full w-full"
                />
              </a>
            </div>
          ) : null}
          {images.map((img) => {
            const src = getR2PublicUrl(img.storage_key);
            const w = img.width && img.width > 0 ? img.width : 1600;
            const h = img.height && img.height > 0 ? img.height : 1200;
            const isTripCover = Boolean(
              coverStorageKey &&
                coverStorageKey === galleryImageStorageKey(img.storage_key),
            );
            return (
              <div
                key={img.id}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-xl border border-border/70 bg-muted/20 dark:border-white/[0.08]",
                  isTripCover && "ring-2 ring-[#ff7670]",
                )}
              >
                {isTripCover ? (
                  <span className="absolute left-2 top-2 z-30 rounded-md bg-[#ff7670] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
                    {t("trip_gallery.background_badge", {
                      defaultValue: "Background",
                    })}
                  </span>
                ) : null}
                <a
                  href={src}
                  data-pswp-src={src}
                  data-pswp-width={w}
                  data-pswp-height={h}
                  target="_blank"
                  rel="noreferrer"
                  className="block h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={t("trip_gallery.open_lightbox", {
                    defaultValue: "Open photo",
                  })}
                >
                  <CoverImageWithBlur
                    src={src}
                    alt={t("trip_gallery.photo_alt", {
                      defaultValue: "Trip gallery photo",
                    })}
                    blurHash={img.blur_hash ?? undefined}
                    className="h-full w-full"
                  />
                </a>
                {!isTripCover ? (
                  <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-2 pt-10 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/95 py-2 text-xs font-semibold text-foreground shadow-md backdrop-blur-sm hover:bg-white dark:bg-zinc-900/95 dark:text-white dark:hover:bg-zinc-900"
                      disabled={settingCoverId === img.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void handleSetCover(img.id);
                      }}
                    >
                      {settingCoverId === img.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Wallpaper className="h-3.5 w-3.5" />
                      )}
                      {t("trip_gallery.set_background", {
                        defaultValue: "Use as background",
                      })}
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  className="absolute right-1.5 top-1.5 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-background/90 text-foreground shadow-md backdrop-blur-sm transition-opacity hover:bg-destructive/15 hover:text-destructive dark:border-white/20 dark:bg-black/50"
                  aria-label={t("trip_gallery.remove_photo", {
                    defaultValue: "Remove photo",
                  })}
                  disabled={deletingId === img.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void handleDelete(img.id);
                  }}
                >
                  {deletingId === img.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
