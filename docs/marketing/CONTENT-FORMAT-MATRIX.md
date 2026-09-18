# Content Format Matrix

> Mandate §61. Clearly distinguishes an **INTERNAL CREATIVE PRESET** (our
> production convenience) from a **PROVIDER REQUIREMENT** (what the official
> API actually enforces), and a **RECOMMENDED PLANNING WINDOW** from
> **VERIFIED PERFORMANCE DATA**.

## Creative presets (INTERNAL CREATIVE PRESET — not performance guarantees)

| Preset | Dimensions | Aspect | Typical use |
|---|---|---|---|
| `FACEBOOK_FEED_4_5` | 1080×1350 | 4:5 | Facebook/Instagram feed portrait |
| `FACEBOOK_SQUARE` | 1080×1080 | 1:1 | Square feed |
| `FACEBOOK_HORIZONTAL` | 1200×628 | ~1.91:1 | Link posts |
| `SOCIAL_STORY` | 1080×1920 | 9:16 | Stories |
| `REELS_9_16` | 1080×1920 | 9:16 | Reels / Shorts / TikTok |
| `LINKEDIN_HORIZONTAL` | 1200×628 | ~1.91:1 | LinkedIn single image |
| `LINKEDIN_SQUARE` | 1080×1080 | 1:1 | LinkedIn square |
| `YOUTUBE_THUMBNAIL` | 1280×720 | 16:9 | YouTube thumbnail |
| `TIKTOK_VERTICAL` | 1080×1920 | 9:16 | TikTok video |

> These are **production presets**. They are NOT a claim that a given size
> maximises engagement. Provider-enforced limits differ and change; always
> confirm against the provider's current spec before publishing.

## Provider requirements (verify against current official docs)

| Provider | Format | Provider-enforced constraints |
|---|---|---|
| Instagram | Feed/Reels/Stories | Business/Creator account; Content Publishing API limits (25 publishes/user/24h) |
| TikTok | Video | privacy_level from creator-info query; dev mode forces SELF_ONLY |
| YouTube | Video/Shorts | videos.insert quota 1600 units; thumbnail 1280×720 |
| LinkedIn | Org post image | 1200×628 typical; Community Management API |
| Facebook | Feed | Page access token; feed/photo/video endpoints |

## Recommended planning windows (INITIAL PLANNING WINDOWS — Asia/Dhaka)

> Mandate §37/§38: these are **INITIAL_RECOMMENDATION** values, configurable per
> channel/audience/country/timezone. They are **NOT** guaranteed "highest
> engagement" times and must be improved from real ALO Education analytics.

| Channel | Initial planning windows (Asia/Dhaka) |
|---|---|
| Facebook | 12:00–14:00 · 17:00–19:00 · 20:00–22:00 |
| Instagram | 11:00–13:00 · 18:00–20:00 · 22:00–23:00 |
| LinkedIn | 09:00–11:00 · 12:00–14:00 |
| YouTube Shorts | 11:00–12:00 · 15:00–18:00 · 21:00–23:00 |
| YouTube Long Form | 12:00–14:00 · 19:00–22:00 |

The optional `Content Timing Agent` may refine these from historical
engagement, but must report **confidence + supporting data**, never certainty
(mandate §39).

## Verification status
Presets and planning windows are configuration data — `CODE_COMPLETE`. No
performance claim is `VERIFIED`; there is no historical ALO Education engagement
data wired to this matrix yet.
