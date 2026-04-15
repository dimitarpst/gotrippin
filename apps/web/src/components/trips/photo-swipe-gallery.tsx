"use client";

import type { ReactNode, RefObject } from "react";
import { useEffect, useRef } from "react";
import { CoverImageWithBlur } from "@/components/ui/cover-image-with-blur";
import { cn } from "@/lib/utils";

export type PhotoSwipeGalleryTileProps = {
  url: string;
  blurHash?: string | null;
  /** PhotoSwipe slide dimensions (defaults 1600×1200, same as trip gallery). */
  width?: number;
  height?: number;
  photoAlt: string;
  /** `aria-label` for the lightbox link (trip gallery: open lightbox). */
  openLabel: string;
  className?: string;
  topLeftBadge?: ReactNode;
  bottomOverlay?: ReactNode;
  topRightControl?: ReactNode;
};

/**
 * One gallery cell: same markup/classes as {@link TripGallery} tiles (PhotoSwipe + CoverImageWithBlur).
 */
export function PhotoSwipeGalleryTile({
  url,
  blurHash,
  width = 1600,
  height = 1200,
  photoAlt,
  openLabel,
  className,
  topLeftBadge,
  bottomOverlay,
  topRightControl,
}: PhotoSwipeGalleryTileProps) {
  const w = width > 0 ? width : 1600;
  const h = height > 0 ? height : 1200;

  return (
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-xl border border-border/70 bg-muted/20 dark:border-white/[0.08]",
        className,
      )}
    >
      {topLeftBadge}
      <a
        href={url}
        data-pswp-src={url}
        data-pswp-width={w}
        data-pswp-height={h}
        target="_blank"
        rel="noreferrer"
        className="block h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={openLabel}
      >
        <CoverImageWithBlur
          src={url}
          alt={photoAlt}
          blurHash={blurHash ?? undefined}
          className="h-full w-full"
        />
      </a>
      {bottomOverlay}
      {topRightControl}
    </div>
  );
}

/**
 * Same PhotoSwipe Lightbox wiring as {@link TripGallery}: `gallery` root + `a[data-pswp-src]` descendants.
 * When `initialSlideIndex` is set and `enabled` becomes true, opens that slide once after init (e.g. AI drawer → gallery).
 * Optional `onPswpClose` runs when the PhotoSwipe UI closes (mapped to the core `close` event).
 */
export function usePhotoSwipeLightbox(
  galleryRef: RefObject<HTMLDivElement | null>,
  idsKey: string,
  enabled: boolean,
  options?: { initialSlideIndex?: number | null; onPswpClose?: () => void },
): void {
  const lightboxRef = useRef<{ destroy: () => void } | null>(null);
  const initialSlideIndex = options?.initialSlideIndex ?? null;
  const onPswpCloseRef = useRef(options?.onPswpClose);
  onPswpCloseRef.current = options?.onPswpClose;

  useEffect(() => {
    lightboxRef.current?.destroy();
    lightboxRef.current = null;

    if (!enabled) {
      return undefined;
    }

    const root = galleryRef.current;
    if (!root) {
      return undefined;
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
      const onMethod = Reflect.get(lb, "on");
      if (typeof onMethod === "function" && onPswpCloseRef.current) {
        Reflect.apply(onMethod, lb, [
          "close",
          () => {
            if (disposed) {
              return;
            }
            onPswpCloseRef.current?.();
          },
        ]);
      }
      lb.init();
      if (disposed) {
        lb.destroy();
        return;
      }
      lightboxRef.current = lb;

      const loadAndOpen = Reflect.get(lb, "loadAndOpen");
      if (
        initialSlideIndex != null &&
        initialSlideIndex >= 0 &&
        typeof loadAndOpen === "function"
      ) {
        queueMicrotask(() => {
          if (disposed) {
            return;
          }
          Reflect.apply(loadAndOpen, lb, [initialSlideIndex]);
        });
      }
    })();

    return () => {
      disposed = true;
      lightboxRef.current?.destroy();
      lightboxRef.current = null;
    };
  }, [enabled, idsKey, galleryRef, initialSlideIndex]);
}
