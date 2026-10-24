"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, Images } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/types/vehicle";
import { viewFromAltText } from "@/lib/vehicle-photo-views";

function viewLabel(item: MediaItem): string | null {
  return viewFromAltText(item.altText);
}

function useSlider(count: number) {
  // The scroll container is held in state via a callback ref, so nothing here
  // reads a ref object while rendering.
  const [track, setTrack] = useState<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);

  const scrollToIndex = useCallback(
    (i: number, behavior: ScrollBehavior = "smooth") => {
      track?.scrollTo({ left: i * track.clientWidth, behavior });
    },
    [track],
  );

  const go = useCallback(
    (delta: number) => {
      const next = Math.min(count - 1, Math.max(0, index + delta));
      setIndex(next);
      scrollToIndex(next);
    },
    [count, index, scrollToIndex],
  );

  // Swipes move the track natively; keep the counter/thumbnails in sync with where it lands.
  const onScroll = useCallback(() => {
    if (!track || track.clientWidth === 0) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }, [track]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    },
    [go],
  );

  // The callback ref is returned on its own so it doesn't taint the rest of the slider API.
  return [setTrack, { index, setIndex, scrollToIndex, go, onScroll, onKeyDown }] as const;
}

const trackClass =
  "flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export function VehicleGallery({
  media,
  title,
  fallbackImageUrl,
}: {
  media: MediaItem[];
  title: string;
  fallbackImageUrl: string | null;
}) {
  const items: MediaItem[] = media.length
    ? media
    : fallbackImageUrl
      ? [{ id: "fallback", url: fallbackImageUrl, type: "image", altText: title, caption: null, position: 0 }]
      : [];

  const [mainTrackRef, main] = useSlider(items.length);
  const [fullTrackRef, full] = useSlider(items.length);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const thumbPrefix = useId();

  // Keep the active thumbnail visible as the customer swipes.
  useEffect(() => {
    document
      .getElementById(`${thumbPrefix}-thumb-${main.index}`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [main.index, thumbPrefix]);

  // Open the full-screen view on the photo being looked at. The dialog's scroll
  // container mounts a moment after `lightboxOpen` flips, so this re-runs when
  // `scrollToIndex` is rebuilt for the freshly mounted element.
  const scrollFullTo = full.scrollToIndex;
  const startIndex = main.index;
  useEffect(() => {
    if (lightboxOpen) scrollFullTo(startIndex, "instant");
  }, [lightboxOpen, scrollFullTo, startIndex]);

  function openLightbox() {
    full.setIndex(main.index);
    setLightboxOpen(true);
  }

  function closeLightbox(open: boolean) {
    if (open) return;
    setLightboxOpen(false);
    // Land the inline gallery on whatever photo they finished on.
    main.setIndex(full.index);
    main.scrollToIndex(full.index, "instant");
  }

  if (items.length === 0) {
    return (
      <div className="flex aspect-[3/2] items-center justify-center rounded-sm bg-muted text-muted-foreground">
        No images yet
      </div>
    );
  }

  const active = items[main.index] ?? items[0];
  const activeLabel = viewLabel(active);
  const many = items.length > 1;

  return (
    <div>
      <div
        className="group relative aspect-[3/2] overflow-hidden rounded-sm bg-muted"
        role="region"
        aria-roledescription="carousel"
        aria-label={`${title} photos`}
      >
        <div
          ref={mainTrackRef}
          onScroll={main.onScroll}
          onKeyDown={main.onKeyDown}
          tabIndex={0}
          className={cn(trackClass, "focus-visible:outline-2 focus-visible:outline-brand-gold")}
        >
          {items.map((item, i) => (
            <div
              key={item.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${items.length}${viewLabel(item) ? `: ${viewLabel(item)}` : ""}`}
              className="relative h-full w-full shrink-0 snap-center"
            >
              {item.type === "video" ? (
                <video src={item.url} controls preload="metadata" className="h-full w-full bg-black object-contain" />
              ) : (
                <button
                  type="button"
                  onClick={openLightbox}
                  className="relative block h-full w-full cursor-zoom-in"
                  aria-label={`Open photo ${i + 1} full screen`}
                >
                  <Image
                    src={item.url}
                    alt={item.altText ?? title}
                    fill
                    preload={i === 0}
                    loading={i === 0 ? "eager" : "lazy"}
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    className="object-cover"
                  />
                </button>
              )}
            </div>
          ))}
        </div>

        {many && (
          <>
            <GalleryArrow side="left" disabled={main.index === 0} onClick={() => main.go(-1)} />
            <GalleryArrow side="right" disabled={main.index === items.length - 1} onClick={() => main.go(1)} />
          </>
        )}

        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <span className="rounded-sm bg-black/65 px-2 py-1 text-xs font-medium text-white">
            {activeLabel ?? (many ? "Swipe for more photos" : "Photo")}
          </span>
          <span className="flex items-center gap-1 rounded-sm bg-black/65 px-2 py-1 text-xs font-medium text-white" aria-live="polite">
            <Images className="size-3.5" aria-hidden="true" />
            {main.index + 1} / {items.length}
          </span>
        </div>

        {active.type !== "video" && (
          <button
            type="button"
            onClick={openLightbox}
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
            aria-label="View full screen"
          >
            <Expand className="size-4" />
          </button>
        )}
      </div>

      {active.caption && <PhotoCredit caption={active.caption} />}

      {many && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]" aria-label="Photo thumbnails">
          {items.map((item, i) => (
            <button
              key={item.id}
              id={`${thumbPrefix}-thumb-${i}`}
              type="button"
              onClick={() => {
                main.setIndex(i);
                main.scrollToIndex(i);
              }}
              className={cn(
                "relative aspect-[3/2] w-20 shrink-0 overflow-hidden rounded-sm border-2 transition-opacity sm:w-24",
                i === main.index ? "border-brand-gold" : "border-transparent opacity-70 hover:opacity-100",
              )}
              aria-label={`Show photo ${i + 1}${viewLabel(item) ? `: ${viewLabel(item)}` : ""}`}
              aria-current={i === main.index}
            >
              {item.type === "video" ? (
                <span className="flex h-full w-full items-center justify-center bg-brand-black text-xs text-white">Video</span>
              ) : (
                <Image src={item.url} alt="" fill sizes="96px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      <Dialog open={lightboxOpen} onOpenChange={closeLightbox}>
        <DialogContent
          className="top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none bg-black p-0 text-white ring-0 sm:max-w-none [&>[data-slot=dialog-close]]:z-10 [&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]]:hover:bg-white/15"
        >
          <DialogTitle className="px-4 pt-3 pr-14 text-sm font-medium text-white/90">
            {title} · {full.index + 1} / {items.length}
            {viewLabel(items[full.index] ?? items[0]) && ` · ${viewLabel(items[full.index] ?? items[0])}`}
          </DialogTitle>
          <div className="relative min-h-0 flex-1">
            <div ref={fullTrackRef} onScroll={full.onScroll} onKeyDown={full.onKeyDown} tabIndex={0} className={trackClass}>
              {items.map((item, i) => (
                <div key={item.id} className="relative h-full w-full shrink-0 snap-center">
                  {item.type === "video" ? (
                    <video src={item.url} controls preload="metadata" className="h-full w-full object-contain" />
                  ) : (
                    <Image
                      src={item.url}
                      alt={item.altText ?? title}
                      fill
                      loading={Math.abs(i - full.index) <= 1 ? "eager" : "lazy"}
                      sizes="100vw"
                      className="object-contain"
                    />
                  )}
                </div>
              ))}
            </div>
            {many && (
              <>
                <GalleryArrow side="left" disabled={full.index === 0} onClick={() => full.go(-1)} />
                <GalleryArrow side="right" disabled={full.index === items.length - 1} onClick={() => full.go(1)} />
              </>
            )}
          </div>
          {(items[full.index] ?? items[0]).caption && (
            <div className="px-4 pb-3 [&_a]:text-white/70 [&_p]:text-white/70">
              <PhotoCredit caption={(items[full.index] ?? items[0]).caption!} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GalleryArrow({ side, disabled, onClick }: { side: "left" | "right"; disabled: boolean; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={cn(
        "absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition-opacity hover:bg-black/75 disabled:pointer-events-none disabled:opacity-0",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}

/** Renders "Photo: Author, Licence, via Wikimedia Commons — https://…" with the source linked. */
function PhotoCredit({ caption }: { caption: string }) {
  const [text, url] = caption.split(" — ");
  const safeUrl = url && /^https:\/\//.test(url) ? url : null;
  return (
    <p className="mt-1.5 text-[11px] text-muted-foreground">
      {safeUrl ? (
        <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
          {text}
        </a>
      ) : (
        caption
      )}
    </p>
  );
}
