"use client";

/**
 * PhotoGallery — premium masonry-style gallery of REAL, user-provided
 * photos with a full-screen Lightbox viewer.
 *
 * Truth & evidence governance: every image is a real photo provided by
 * Al Aminn (stored in /public/gallery). No fabricated or AI-generated
 * photos of people, offices or events are used. Captions are descriptive.
 */
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Camera, Filter } from "lucide-react";
import { GALLERY_ITEMS, type GalleryItem } from "@/lib/site-data";
import { Lightbox, LightboxZoomHint, type LightboxImage } from "@/components/site/lightbox";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Portrait", "Workspace", "Project", "Event"] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

export function PhotoGallery() {
  const [filter, setFilter] = useState<CategoryFilter>("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const items =
    filter === "All"
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((i) => i.category === filter);

  const lightboxImages: LightboxImage[] = items.map((i) => ({
    src: i.src,
    alt: i.alt,
    caption: i.caption,
  }));

  const openAt = (item: GalleryItem) => {
    const idx = items.findIndex((i) => i.src === item.src);
    if (idx >= 0) setLightboxIndex(idx);
  };

  return (
    <section
      id="gallery"
      aria-labelledby="gallery-heading"
      className="relative overflow-hidden py-20 sm:py-24 lg:py-28"
    >
      {/* Soft ambient background */}
      <div className="absolute inset-0 grad-ambient opacity-60" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle, #0B63CE 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto max-w-[1320px] px-4 sm:px-6">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700"
          >
            <Camera className="h-3.5 w-3.5" />
            Photo Gallery
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl lg:text-5xl text-balance [text-wrap:balance]"
          >
            Workspace, projects & moments
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-4 text-base text-ink-500 sm:text-lg"
          >
            Real photos from Al Aminn&apos;s workspace, projects and events.
            Click any image to view it full-screen.
          </motion.p>
        </div>

        {/* Filter pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ink-400">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              aria-pressed={filter === cat}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:ring-offset-1",
                filter === cat
                  ? "border-orange-300 bg-orange-600 text-white shadow-orange"
                  : "border-ink-200 bg-white text-ink-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Masonry grid */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item, i) => (
            <motion.button
              key={item.src}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: (i % 4) * 0.05 }}
              onClick={() => openAt(item)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-blue-900/10 bg-white shadow-soft transition-all duration-300 hover:shadow-lg hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:ring-offset-2",
                item.span === "wide" && "col-span-2 row-span-1 aspect-[16/10]",
                item.span === "tall" && "row-span-2 aspect-[3/4]",
                (!item.span || item.span === "default") && "aspect-square",
              )}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradient overlay + caption */}
              <span
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/0 to-ink-950/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden="true"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-orange-300">
                  {item.category}
                </span>
                <span className="mt-0.5 block text-xs font-semibold leading-snug text-white">
                  {item.caption}
                </span>
              </span>
              <LightboxZoomHint />
            </motion.button>
          ))}
        </div>
      </div>

      <Lightbox
        images={lightboxImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </section>
  );
}
