"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Horizontally scrolling row (swipe on phones, arrow buttons on larger screens).
 * Cards are passed in as server-rendered children, so this only adds the
 * scroll controls to the client bundle.
 */
export function FeaturedCarousel({ children, label }: { children: React.ReactNode; label: string }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="-mx-6 flex snap-x snap-mandatory scroll-px-6 gap-5 overflow-x-auto scroll-smooth px-6 pb-4 [scrollbar-width:thin] focus-visible:outline-2 focus-visible:outline-brand-gold"
      >
        {children}
      </div>
      <div className="mt-2 hidden justify-end gap-2 sm:flex">
        <Button variant="outline" size="icon" onClick={() => scroll(-1)} aria-label="Previous vehicles">
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => scroll(1)} aria-label="Next vehicles">
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
