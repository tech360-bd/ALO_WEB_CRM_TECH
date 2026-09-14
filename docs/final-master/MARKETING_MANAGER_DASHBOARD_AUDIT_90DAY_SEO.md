# মার্কেটিং ম্যানেজার ড্যাশবোর্ড — পূর্ণ পর্যালোচনা ও ৯০ দিনে Google Top-3 SEO পরিকল্পনা

> উদ্দেশ্য: একটি আইডিয়া অথবা একটি ইমেজ থেকে স্বয়ংক্রিয়ভাবে — Google Location + Facebook + সব প্ল্যাটফর্ম থেকে লিড কালেকশন, কন্টেন্ট / ইমেজ / ভিডিও জেনারেশন (সাইজ অনুযায়ী), ব্লগ/আর্টিকেলসহ সব প্ল্যাটফর্মে অটো-পাবলিশ, এবং প্রতিটি কাউন্সেলর/এমপ্লয়ি নিজের অফিসিয়াল সোশ্যাল মিডিয়ায় এক-ক্লিকে রিপোস্ট — ব্র্যান্ড লোগো / ঠিকানা / ফোন / WhatsApp সহ প্রফেশনাল ভিজ্যুয়াল।

**পর্যালোচনার তারিখ:** 2026-09-14  
**ড্যাশবোর্ড লোকেশন:** `src/components/alo/views/marketing-dashboard.tsx` (2546 লাইন, 8 ট্যাব) + `marketing-ai.tsx` + `src/app/api/marketing/*`

---

## 1) বর্তমানে কী আছে (ভালো দিক)

| ফিচার | অবস্থা | কোথায় |
|---|---|---|
| 8 ট্যাব (Inbox, Comments, Posts/Campaigns, Brand Assets, AI Reply, n8n, Outreach, Access) | ✅ আছে | `marketing-dashboard.tsx:492-545` |
| Campaign Posts — platform (FB/IG/LinkedIn/TikTok/YouTube/WA Status/Blog) + category + objective + **platformSize (SQUARE 1:1, PORTRAIT 4:5, LANDSCAPE 1.91:1, STORY 9:16)** | ✅ আছে | `CampaignPostsTab` |
| Brand Assets — Logo upload + Brand Colors (#0057B8 / #E8501A) + compliance banner | ✅ আছে কিন্তু অসম্পূর্ণ | `BrandAssetsTab` |
| Logo gate — logo না থাকলে post create ব্লক | ✅ আছে | `campaign-posts/route.ts:14-18` |
| SEO content generator — country/course/university/scholarship/blog_topic → title+markdown + Approval | ✅ আছে | `api/marketing/seo/route.ts` |
| Video script generator — script + subtitle + thumbnailConcept | ✅ আছে | `api/marketing/video/route.ts` |
| Content ideas (5 ideas from keyword) + full content generate | ✅ আছে | `api/marketing/content/route.ts` |
| Keyword Triggers — comment/message → auto-reply + auto DM + auto lead + assign counselor | ✅ আছে | `KeywordTriggersView` |
| Social Inbox + Comments + Lead Pipeline + Outreach + n8n workflows | ✅ আছে | বাকি ট্যাব |
| Approval workflow (DRAFT→PENDING→APPROVED→SCHEDULED→PUBLISHED) + AuditLog | ✅ আছে | সবখানে |

## 2) কী নেই / আংশিক আছে — আপনার ৯০ দিনের Top-3 লক্ষ্যের জন্য ব্লকার

### A. “একটি আইডিয়া / একটি ইমেজ → সবকিছু অটো” পাইপলাইন নেই
বর্তমানে আলাদা আলাদা কল — ideas, content, seo, video, campaign-posts — কিন্তু **One-Click Auto-Pipeline** নেই:
`Idea/Text/Image URL → 5 Ideas → Best Idea → SEO Article (800-2000w) + Social Captions (5 tone) + Image Prompts (4 size) + Video Script (4 ratio) + BlogPost + CampaignPost × প্রতিটি Platform × প্রতিটি Size → Brand Overlay → Calendar Schedule → Auto-Publish (connected accounts) → Lead Webhook`  
**ফল:** অপারেটরকে 6 জায়গায় হাত দিতে হয়, সময় নষ্ট, SEO consistency ভাঙে।

### B. Brand Kit অসম্পূর্ণ — Logo আছে, কিন্তু ঠিকানা/ফোন/WhatsApp নেই
আপনি চেয়েছেন: *ভিডিও ও শিক্ষা পার্টনারদের জন্য লোগো, ঠিকানা, ফোন, WhatsApp আপলোড/এডিট — ইমেজ/ভিডিও তৈরির সময় সিস্টেম এই তথ্য ব্যবহার করবে*  
বর্তমান `BrandAsset` মডেল: `assetType, name, value(String JSON), isActive` — শুধু LOGO + কালার। **CONTACT_INFO কখনো সেভ হয় না**, আর image/video prompt-এ inject হয় না।  
`marketing-dashboard BrandAssetsTab` এ Address/Phone/WhatsApp ফিল্ডই রেন্ডার হয় না।

### C. সাইজ অনুযায়ী ইমেজ/ভিডিও জেনারেশন — টোকেন আছে, কিন্তু জেনারেশন নেই
`POST_SIZES` ও `platformSize` ফিল্ড আছে, কিন্তু **আসল image/video generate API কল নেই** — শুধু caption/hashtag save হয়। `MarketingAsset` / `MarketingVideo` এ file তৈরি হয় না, CDN URL বসে না, aspectRatio অনুযায়ী রেন্ডার হয় না। Brand overlayও প্রিভিউতে দেখা যায় না।

### D. সব প্ল্যাটফর্মে অটো-পাবলিশ (Blog সহ) — Calendar আছে, Publisher নেই
`MarketingCalendar` + `campaign-posts PATCH publish` আছে, কিন্তু **BlogPost publish, Facebook/Instagram Graph publish, TikTok/LinkedIn/YouTube publish cron** নেই। Auto-share = manual publish বাটন।

### E. অটো লিড কালেকশন — Facebook/Instagram আছে, Google Location নেই
`SocialInbox` + `MarketingComment` + `LeadOutreach` Facebook/Insta কভার করে, কিন্তু **Google Business Profile / Google Maps / Google Location** থেকে auto lead ingest নেই। “সকল জায়গা থেকে অটোমেটিক্যালি লিড কালেক্ট” দাবি পূরণ হয় না।

### F. কাউন্সেলর / এমপ্লয়ি রিপোস্ট লাইব্রেরি নেই
আপনি চেয়েছেন: *Marketing Manager dashboard থেকে প্রতিটি dashboard-এ (কাউন্সেলর, এমপ্লয়ি) একটি অপশন — সেখানে approved image/video দেখে নিজের অফিসিয়াল সোশ্যাল মিডিয়ায় পোস্ট করতে পারবে*  
বর্তমানে `access` ট্যাবে শুধু MarketingUserAccess, কিন্তু **“Approved Library / Repost Hub”** ট্যাব নেই। `UnifiedEmployeeDashboard` এ Marketing content দেখা যায় না।

### G. 90 দিনের SEO Top-3 সিস্টেম নেই
`seo/route.ts` একটা page বানায়, কিন্তু **90-day editorial calendar, daily 1-2 post pacing, internal linking graph, FAQ schema, sitemap ping, Search Console indexing** automation নেই। Top-3 এর জন্য এগুলো mandatory।

---

## 3) ৯০ দিনে Top-3 — বাস্তবসম্মত রোডম্যাপ (আপনার বর্তমান স্ট্যাকের উপর)

### Phase 1 — Days 1-15: ফাউন্ডেশন
- Brand Kit পূর্ণ (Logo + Address + Phone + WhatsApp + Website + Brand colors) — single source of truth
- One-Click Auto-Pipeline API: `POST /api/marketing/auto-pipeline`
- Size matrix: FB 1080×1080 / 1080×1350 / 1200×628, IG Story 1080×1920, TikTok 9:16, YouTube Thumb 1280×720 — প্রতিটি size এ Brand overlay (logo bottom-right 8%, address/phone/WhatsApp footer bar)
- Google Business Profile webhook (Place ID → leads)

### Phase 2 — Days 16-45: ভলিউম + Authority
- 45 দিনে 45 pillar page (country/course/university/scholarship) + 45 supporting blog = 90 SEO pages → `/api/marketing/seo` + `BlogPost` auto-publish, internal link wheel, FAQ schema, sitemap.xml auto-regenerate + Search Console Indexing API
- প্রতিদিন 3 campaign post (FB/IG/LinkedIn) × 4 size = 12 asset/day → auto-schedule 9AM/2PM/7PM Asia/Dhaka
- Lead magnet: প্রতি post এ CTA + WhatsApp deep link + portal link → auto DM + comment trigger

### Phase 3 — Days 46-90: Distribution + Repost Network
- Counselor Repost Hub: সব approved asset “Library” তে, 1-click “Post to my Facebook/Instagram/LinkedIn” (their connected account) — organic reach 10×
- YouTube Shorts (9:16) + Blog syndication (Medium/LinkedIn Article) auto cross-post
- Weekly SEO report: keyword rank tracker, GSC impressions, conversion → Proposal update

**KPI (Day 90):** 90 SEO pages indexed, 540 social assets published, 5k+ organic leads (600 FB+ 400 Google Location + rest organic), avg rank improvement → Top-3 for 15+ long-tail ("study in UK from Bangladesh without IELTS" etc.)

---

## 4) সুপারিশকৃত ফিক্স — কোড লেভেল (এই repo তে)

1. **Brand Kit CONTACT_INFO** — `BrandAsset {assetType: "BRAND_KIT", value: {logoUrl, address, phone, whatsapp, website}}` + `BrandAssetsTab` এ 4 ফিল্ড ফর্ম + `campaign-posts` ও `video` প্রম্পটে inject
2. **Auto-Pipeline endpoint** — `src/app/api/marketing/auto-pipeline/route.ts` (idea/imageUrl → ideas → content → seo → 4 image assets → video → 7 platform posts → calendar)
3. **Size-aware generator** — `src/lib/marketing/image-generator.ts` (prompt + brand overlay + size → CDN) — শুরুতে placeholder + পরে SDXL / DALL·E
4. **Repost Hub** — নতুন ট্যাব `Library` (`marketing-dashboard.tsx` 9th tab) + `src/app/api/marketing/library/route.ts` (approved posts feed) + `POST /api/marketing/repost` (clone to employee's connected account)
5. **Google Location lead ingest** — `src/app/api/marketing/webhooks/google-business/route.ts` + `LeadOutreach sourceType=GOOGLE_MAPS`
6. **Blog auto-publish** — `seo approve` → `BlogPost {slug, markdown, faqSchema, internalLinks}` + `sitemap ping`

---

## 5) বর্তমান ড্যাশবোর্ডে কি এড করা আছে? — সংক্ষেপে

| আপনার চাওয়া | আছে? |
|---|---|
| আইডিয়া/ইমেজ থেকে কন্টেন্ট+ইমেজ+ভিডিও অটো | ❌ আংশিক (আলাদা কল, পাইপলাইন নেই) |
| সব প্ল্যাটফর্মে অটো পাবলিশ (Blog সহ) | ❌ Calendar আছে, auto-publishing নেই |
| Google Location + FB সব জায়গা থেকে অটো লিড | ❌ FB আছে, Google নেই |
| সাইজ অনুযায়ী জেনারেশন | ⚠️ Size field আছে, real generation নেই |
| Brand Logo/Address/Phone/WhatsApp single editor + auto overlay | ❌ Logo only |
| কাউন্সেলর/এমপ্লয়ি রিপোস্ট (নিজের সোশ্যালে 1-click) | ❌ নেই |
| 90-day SEO calendar + schema + sitemap | ❌ এক page generator only |

**সিদ্ধান্ত:** ভিত্তি মজবুত, কিন্তু Top-3 লক্ষ্যের জন্য উপরের 6টি ফিক্স বাধ্যতামূলক — না হলে volume + brand consistency + distribution তিনটাই ভাঙবে।

---

## 6) পরবর্তী ধাপ — অনুমোদন চাই

আমি এখনই এই 6টি ফিক্স কোড করে দিতে পারি (আপনার বর্তমান `marketing-dashboard.tsx` ও `brand-assets` ভেঙে না ফেলে additive patch):
- Brand Kit ফর্ম
- Auto-Pipeline API
- Library / Repost Hub ট্যাব
- Size-aware placeholder generator (পরে আপনার AI key বসালেই real image)

অনুমোদন দিলে 1 টার্নে ড্যাশবোর্ডে দেখতে পাবেন। Google Business ও real image provider key পরে ENV এ যোগ করলেই live হবে।

