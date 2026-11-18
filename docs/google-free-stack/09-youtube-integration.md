# 09 — YouTube integration

**Cost:** FREE. Embedding needs no API key, no billing account and no OAuth.
**Status:** component `PASS` (unit-tested), placement `PARTIAL` — no real video is published on
a page yet; channel configuration `BLOCKED` (no channel handle/ID set in this environment).

---

## 1. What is implemented

| Surface | File | Behaviour |
|---|---|---|
| Privacy-enhanced embed | `src/components/website/YouTubeEmbed.tsx` | Renders `https://www.youtube-nocookie.com/embed/<id>` in a real `<iframe>` |
| Video-ID validation | same file | Rejects anything that is not a plausible 11-character YouTube id, so a content editor cannot inject an arbitrary URL or a `javascript:` payload into an iframe `src` |
| Channel link/context | `src/lib/google/config.ts` (`NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE`, `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID`) | Public identifiers only; used for links and reporting, never a secret |
| CSP allowlist | `next.config.ts` | `frame-src` permits the YouTube origins; without it `default-src 'self'` blocks every embed |
| Status row | `GET /api/google/status` → `YOUTUBE` | Reports `configured`, `dataApiConfigured`, `embeddingAvailable`, `publishingAvailable` |

### Why `youtube-nocookie.com`

The `-nocookie` host does not set tracking cookies until playback. Visitors who never press
play are never tracked by Google — which is also the only consent posture that is defensible
when a visitor has declined analytics.

### Failure behaviour

If the embed cannot load (blocked, offline, deleted video) the iframe simply renders Google's
own error inside its own box. No script of ours waits on YouTube, so the page, routing and CRM
are unaffected. This satisfies "If YouTube fails, show a fallback video link or thumbnail" —
the surrounding component already renders the title, description and a plain outbound link, so
the content remains reachable without the player.

## 2. Categories the channel should be organised into

Recommended by the specification, mapped to pages that already exist on the site so each video
has a natural home:

| Category | Site surface |
|---|---|
| UK Study, Canada Study, Australia Study, USA Study, Europe Study | `/destinations/[country]` |
| Scholarships | `/scholarships` |
| Student Visa | `/visa`, `/destinations/[country]/visa-guide` |
| IELTS, PTE, TOEFL | `/language-prep/ielts`, `/language-prep/pte-academic`, `/language-prep/toefl-ibt` |
| University Reviews | `/universities/[slug]` |
| Student Success Stories | `/success-stories/[slug]` |

## 3. What is deliberately not implemented

| Item | Reason |
|---|---|
| YouTube **Data API** channel feed | Embedding needs no API. A dynamic feed would add a Google dependency to a page render, a quota to monitor, and a consent question, to replace a curated list of video IDs that a human chose deliberately |
| Automatic upload / publishing | Prohibited without a real authenticated integration and human approval, and none exists. `publishingAvailable` reports `false` precisely because there is no upload credential |
| Automatic captioning pipeline | Captions belong to the video owner in YouTube Studio. Nothing in this codebase should claim to generate them |
| Video structured data (`VideoObject`) on every page | Only correct on a page that actually embeds that video. Blanket `VideoObject` markup is a structured-data violation risk |

## 4. Operator steps to finish

1. Confirm the official ALO channel; ensure ownership is organisation-held, not personal.
2. Set `NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE` (e.g. `aloeducation`) and/or
   `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID`.
3. Choose real video IDs and place them with `<YouTubeEmbed videoId="…" title="…" />` on the
   matching page from the table in §2.
4. Confirm `GET /api/google/status` shows `YOUTUBE.configured: true`.
5. Open the page in a private window: the iframe must load from `youtube-nocookie.com`, and no
   YouTube script may appear in the Network tab before a click.
6. If the channel feed is ever genuinely wanted, set `YOUTUBE_API_KEY` — the status endpoint
   will then report `dataApiConfigured: true`. Do not enable it before there is a page that
   consumes it.

## 5. Status

| Item | Status |
|---|---|
| Embed component with ID validation | **PASS** (unit-tested) |
| CSP allows YouTube frames | **PASS** |
| No dependency on YouTube for page render | **PASS** |
| Channel configured | **BLOCKED** |
| Real videos placed on pages | **PARTIAL** — component complete, no video content in this repository |
| Data API | **NOT REQUIRED** (by decision) |
| Auto-publishing | **NOT REQUIRED** and prohibited |
