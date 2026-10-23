'use client';

import { useCallback, useState } from 'react';

/**
 * Privacy-enhanced YouTube embed with a click-to-load facade.
 *
 * Three reasons this is a facade rather than a plain `<iframe>`:
 *
 *   1. **Consent.** A raw YouTube iframe sets third-party cookies and contacts
 *      Google the moment the page renders — before any consent choice exists.
 *      The facade makes zero requests to YouTube until the visitor clicks play,
 *      so embedding a video does not silently bypass the analytics consent
 *      banner. This is why the banner's consent state is not consulted here: no
 *      data leaves the browser until an explicit click, which is itself the
 *      consent.
 *   2. **Core Web Vitals.** Search Console reports CWV, and an iframe per video
 *      is one of the heaviest things a page can load. The facade ships a
 *      thumbnail `<img>` and about 1 KB of markup; the iframe is created only on
 *      demand. ALO's country and course pages carry several videos each.
 *   3. **Cost.** `youtube-nocookie.com` needs no API key, no Cloud project and
 *      no billing account. The YouTube Data API is only needed to *list* videos
 *      dynamically, which ALO does not do — the video ids below are curated.
 *
 * The thumbnail is served from `i.ytimg.com`, which is a Google CDN and sets no
 * cookies; it is allowed by the site CSP's `img-src https:`.
 */

/** ALO's video categories, per the official channel structure. */
export const YOUTUBE_CATEGORIES = [
  { id: 'uk-study', label: 'UK Study' },
  { id: 'canada-study', label: 'Canada Study' },
  { id: 'australia-study', label: 'Australia Study' },
  { id: 'usa-study', label: 'USA Study' },
  { id: 'europe-study', label: 'Europe Study' },
  { id: 'student-visa', label: 'Student Visa' },
  { id: 'ielts', label: 'IELTS' },
  { id: 'pte', label: 'PTE' },
  { id: 'toefl', label: 'TOEFL' },
  { id: 'english-learning', label: 'English Learning' },
  { id: 'university-reviews', label: 'University Reviews' },
  { id: 'course-reviews', label: 'Course Reviews' },
  { id: 'scholarships', label: 'Scholarships' },
  { id: 'application-guides', label: 'Application Guides' },
  { id: 'success-stories', label: 'Student Success Stories' },
] as const;

export type YouTubeCategoryId = (typeof YOUTUBE_CATEGORIES)[number]['id'];

/**
 * A curated video entry.
 *
 * Only real, published ALO videos belong here. An entry with a placeholder or
 * borrowed video id must never be committed: it would render a broken or,
 * worse, someone else's video on a public ALO page.
 */
export interface YouTubeVideoEntry {
  videoId: string;
  title: string;
  category: YouTubeCategoryId;
  /** One-line description shown under the title. */
  description?: string;
  /** Destination country, for country-page filtering. */
  country?: string;
}

/** YouTube video ids are exactly 11 characters from a fixed alphabet. */
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function isValidVideoId(videoId: string): boolean {
  return VIDEO_ID_PATTERN.test(videoId);
}

/** Thumbnail URL. `hqdefault` always exists; `maxresdefault` often does not. */
export function thumbnailUrl(videoId: string, quality: 'hq' | 'mq' | 'max' = 'hq'): string {
  const file = quality === 'max' ? 'maxresdefault' : quality === 'mq' ? 'mqdefault' : 'hqdefault';
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/${file}.jpg`;
}

export interface YouTubeEmbedProps {
  videoId: string;
  title: string;
  /** Optional playlist to continue into after this video. */
  playlistId?: string;
  /** Start time in seconds. */
  start?: number;
  /** Aspect ratio. Default 16:9. */
  aspect?: '16:9' | '4:3' | '1:1';
  className?: string;
}

const ASPECT_PADDING: Record<NonNullable<YouTubeEmbedProps['aspect']>, string> = {
  '16:9': '56.25%',
  '4:3': '75%',
  '1:1': '100%',
};

export default function YouTubeEmbed({
  videoId,
  title,
  playlistId,
  start,
  aspect = '16:9',
  className = '',
}: YouTubeEmbedProps) {
  const [activated, setActivated] = useState(false);

  const activate = useCallback(() => setActivated(true), []);

  // An invalid id would produce a broken iframe and a YouTube error page inside
  // ALO's own layout. Refuse to render rather than show that to a visitor.
  if (!isValidVideoId(videoId)) {
    return (
      <div
        className={`rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 ${className}`}
        role="note"
      >
        This video is not available. The video reference is not a valid YouTube
        identifier, so nothing has been embedded rather than showing a broken
        player.
      </div>
    );
  }

  const srcParams = new URLSearchParams({
    autoplay: '1',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    // No suggested videos from other channels at the end.
    ...(start && start > 0 ? { start: String(start) } : {}),
    ...(playlistId ? { list: playlistId } : {}),
  });
  const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${srcParams.toString()}`;

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-black ${className}`}>
      <div className="relative w-full" style={{ paddingBottom: ASPECT_PADDING[aspect] }}>
        {activated ? (
          <iframe
            src={src}
            title={title}
            className="absolute inset-0 size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            // The iframe is created only after a click, so it never contributes
            // to the initial page weight.
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={activate}
            className="group absolute inset-0 size-full cursor-pointer border-0 bg-slate-900 p-0"
            aria-label={`Play video: ${title}. Loads from YouTube when played.`}
          >
            {/* A plain <img> rather than next/image: the thumbnail comes from an
                external CDN, which next/image would need in a remote-pattern
                allowlist, and routing a facade image through ALO's own image
                optimiser would add a server round-trip to the one part of this
                component whose purpose is to load as little as possible. */}
            <img
              src={thumbnailUrl(videoId)}
              alt=""
              width={480}
              height={360}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 size-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-[#F37021] shadow-lg transition-transform group-hover:scale-110">
                <svg viewBox="0 0 24 24" className="ml-1 size-7 fill-white" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-left text-sm font-medium text-white">
              {title}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export interface YouTubeVideoSectionProps {
  heading?: string;
  subheading?: string;
  videos: YouTubeVideoEntry[];
  /** Show only videos in this category. */
  category?: YouTubeCategoryId;
  /** Show only videos for this destination country. */
  country?: string;
  className?: string;
}

/**
 * A grid of curated ALO videos for a country, course or service page.
 *
 * Renders nothing when the list is empty after filtering. An empty section with
 * a heading would look broken, and filling it with placeholder videos is exactly
 * the fabrication this project prohibits.
 */
export function YouTubeVideoSection({
  heading = 'Watch ALO Education videos',
  subheading,
  videos,
  category,
  country,
  className = '',
}: YouTubeVideoSectionProps) {
  const filtered = videos
    .filter((video) => (category ? video.category === category : true))
    .filter((video) => (country ? video.country === country : true))
    .filter((video) => isValidVideoId(video.videoId));

  if (filtered.length === 0) return null;

  return (
    <section className={className} aria-label={heading}>
      <h2 className="text-2xl font-bold text-slate-900">{heading}</h2>
      {subheading ? <p className="mt-1 text-sm text-slate-600">{subheading}</p> : null}
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((video) => (
          <figure key={video.videoId} className="space-y-2">
            <YouTubeEmbed videoId={video.videoId} title={video.title} />
            <figcaption className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">{video.title}</p>
              {video.description ? <p className="text-xs text-slate-600">{video.description}</p> : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
