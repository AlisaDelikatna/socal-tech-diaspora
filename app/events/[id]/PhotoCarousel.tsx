"use client";

import { useRef, useState } from "react";

type Photo = { id: string; url: string };

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"}
      />
    </svg>
  );
}

// Swipeable photo gallery: scroll-snap does the swiping on touch screens,
// arrows / thumbnails / arrow keys move it on desktop.
export default function PhotoCarousel({ photos, title }: { photos: Photo[]; title: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const many = photos.length > 1;

  function go(i: number) {
    const el = track.current;
    if (!el) return;
    const next = (i + photos.length) % photos.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    setIndex(next);
  }

  function onScroll() {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-2xl bg-neutral-900"
        tabIndex={many ? 0 : undefined}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(index - 1);
          if (e.key === "ArrowRight") go(index + 1);
        }}
        aria-roledescription="carousel"
        aria-label={`${title} photos`}
      >
        <div
          ref={track}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((p, i) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full shrink-0 snap-center"
              aria-label={`Photo ${i + 1} of ${photos.length}, open full size`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={`${title}, photo ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                className="aspect-[4/3] w-full object-contain"
              />
            </a>
          ))}
        </div>

        {many && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-neutral-900 shadow hover:bg-white"
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-neutral-900 shadow hover:bg-white"
            >
              <Chevron dir="right" />
            </button>
            <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 text-xs text-white">
              {index + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {many && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={`shrink-0 overflow-hidden rounded-md border-2 transition ${
                i === index ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" loading="lazy" className="h-14 w-14 object-cover sm:h-16 sm:w-16" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
