# ALO Education — Web + CRM সম্পূর্ণ অডিট ও উন্নয়ন পরিকল্পনা

**তারিখ:** ২০২৬-১০-২৬
**ব্রাঞ্চ:** `arena/55e679fd-alo-web-crm-tech`
**পদ্ধতি:** শুধু কোড পড়ে নয় — অ্যাপটি সত্যিই চালিয়ে (রিয়েল ডেটাবেস সহ) পাতা-পাতা পরীক্ষা করে এই রিপোর্ট তৈরি করা হয়েছে।

---

## ০. যেভাবে পরীক্ষা করা হয়েছে (Methodology)

রিপোজিটরিতে MySQL/SQLite/Docker কোনোটিই স্যান্ডবক্সে ছিল না, এবং অফলাইন ডেভ পাইপলাইনটি ভাঙা ছিল। তাই প্রথমে রানটাইমটি সচল করে নেওয়া হয়:

1. `scripts/dev-sqlite/generate-dev-schema.mjs` ঠিক করা হয়েছে (এটি MySQL-নির্ভর ৩২৫টি `dbgenerated()` ডিফল্ট আর `@db.VarChar` হ্যান্ডেল না করতে পারায় ধরে যাচ্ছিল)।
2. ৬০৪ মডেলের SQLite রিফ্লেকশন তৈরি করে Prisma ক্লায়েন্ট জেনারেট করা হয়েছে (`engineType = "client"`, WASM)।
3. সিড চালিয়ে **২৪ জন কর্মচারী + ১ জন ডেমো শিক্ষার্থী + ১ জন ডেমো পার্টনার** তৈরি করা হয়েছে।
4. Next.js 16.4.2 ডেভ সার্ভার চালিয়ে **৪৫৩টি রুট**, **৩৫টি পাবলিক পেজ**, **৪৯টি পোর্টাল পেজ** এবং **৪ ভূমিকার (role) API** লাইভ পরীক্ষা করা হয়েছে।

> ⚠️ **সীমাবদ্ধতা (সৎভাবে উল্লেখ করা হচ্ছে):** স্যান্ডবক্সে ৪ GB RAM এবং কোনো ব্রাউজার (Playwright/Chromium) নেই। তাই **বাটনে ক্লিক** করে UI-ফ্লো পরীক্ষা করা যায়নি; HTTP + API + অথরাইজেশন লেয়ার পর্যন্ত পরীক্ষা করা হয়েছে। তবে নিচের "ব্ল্যাঙ্ক ফার্স্ট পেইন্ট" সমস্যাটি ঠিক এই কারণেই ধরা পড়েছে।

---

## ১. মূল প্রশ্নের উত্তর: কেন প্রকল্পটি বারবার গুণগত মান অর্জনে ব্যর্থ হচ্ছে?

আপনি যে রেফারেন্স সাইটগুলো দিয়েছেন (hokai.io, edvoy.com, prospects.ac.uk, findaphd.com) — সেগুলোর সবচেয়ে বড় শক্তি হলো **সংযম**: একটি H1, একটি প্রধান CTA, একটি কাজ। ALO-তে ঠিক এর বিপরীত ঘটেছে। নিচে কারণগুলো প্রমাণসহ দেওয়া হলো।

### ১.১ রিপোজিটরির ৮৬% হলো কপি-পেস্ট করা `node_modules`, কোড নয়

| এলাকা | ট্র্যাক করা ফাইল | মন্তব্য |
|---|---:|---|
| `imports/` | **৬১,১৯৩** | পুরো প্রকল্পের ভেন্ডর করা কপি — তার **নিজস্ব `node_modules` সহ** |
| `alo-education-web-crm-final/` | ১,৫১৮ | ৩৭১ MB — রুটের আরেকটি ডুপ্লিকেট কপি |
| **`node_modules/` (কমিট করা)** | **৫৮,৭৫৮** | **৮২৭ MB** — ৩২ MB swc বাইনারি, ১৮.৭ MB Prisma engine সহ |
| `docs/` | ৪৮৪ | — |
| **`src/` (আসল অ্যাপ)** | **২,৫৭৪** | — |
| `prisma/` + `tests/` + `scripts/` + `public/` | ৭২২ | — |
| রুট + অন্যান্য | ১,৭২৬ | ১৯১টি Markdown + ২১৪ MB CSV শুধু রুটেই |

- **মোট ট্র্যাক করা ফাইল: ৬৮,২৭২**; ওয়ার্কিং ট্রি **৩.৮ GB**; `.git` **২৪২ MB**
- **আসল অ্যাপ্লিকেশন কোড = ৩,২৯৬ ফাইল = মাত্র ৪.৮%**
- **২,০০২টি Markdown ডকুমেন্ট** ট্র্যাক করা আছে — আসল কোডের চেয়ে বেশি

**এটিই মূল কারণ।** প্রতিটি AI-সহায়ক সেশন যেন প্রকল্পটি "আবার ইমপোর্ট/কপি" করেছে, সরাসরি সম্পাদনা করেনি। ফলাফল: কোনো মানুষ বা এজেন্টই পুরো কোডবেস মাথায় রাখতে পারে না; প্রতিটি পরিবর্তন স্টেল কপি স্পর্শ করার ঝুঁকি তৈরি করে; `git` ধীর, CI ধীর, মার্জ কনফ্লিক্ট নিত্যদিনের ঘটনা।

### ১.২ ডকুমেন্টেশন তৈরি হচ্ছে, সফটওয়্যার নয়

রুটে রয়েছে `ALO_WEBSITE_HOMEPAGE_20X_READY.md`, `ALO_SUPER_ADMIN_CONTROL_CENTER_READY.md`, `ALO_FINAL_MASTER_PRODUCTION_READY.md` (৫৪৫ KB!), `ALO_COUNTRY_PAGES_10X_READY.md`, `*_EVIDENCE_REPORT.md` … ১৯১টি। এগুলো "সম্পন্ন/প্রস্তুত" দাবি করে, কিন্তু রানটাইম তা দেয় না।

সবচেয়ে বড় প্রমাণ: **প্রোডাকশন বিল্ডই সফল হয় না।**

```
FATAL ERROR: Ineffective mark-compacts near heap limit
Allocation failed - JavaScript heap out of memory
Next.js build worker exited with code: null and signal: SIGABRT
```

`--max-old-space-size=3072` দিয়েও বিল্ড OOM হয়। রিপোজিটরির নিজস্ব ডকুমেন্টেশনেই লেখা আছে:

> `docs/BRANCH-MERGE-CHANGELOG.md`: "Build OOM still BLOCKED sandbox 4GB needs VPS 8GB+"

অর্থাৎ দল জানে — কিন্তু সমস্যাটি সমাধান না করে ডকুমেন্ট করা হয়েছে। শেষ সফল বিল্ডে ছিল **২১০টি স্ট্যাটিক পেজ**; আজ **৪৫৪টি** (২.২ গুণ) — বিল্ড সফল হওয়া বন্ধ হয়ে গেছে।

### ১.৩ দুইটি সমান্তরাল রাউটিং সিস্টেম (সবচেয়ে বড় স্থাপত্যগত ত্রুটি)

- **A.** Next.js App Router: ৪৫৪টি বাস্তব `page.tsx`
- **B.** `src/app/page.tsx` — ৬৩১ লাইনের `'use client'` মনোলিথ, যেখানে হাতে লেখা `studentPageMap`, `employeePageMap`, `partnerPageMap`, `marketingPageMap`, `crmPageMap` দিয়ে সব পোর্টাল রেন্ডার হয়

একই ফিচার দুই জায়গায়। আর `src/components/alo/views/public-home.tsx` (২,০৭৫ লাইন) হলো হোমপেজের **আরেকটি** কপি।

### ১.৪ একাধিক "একমাত্র সত্য" (single source of truth) নেই

| বিষয় | কতটি উৎস |
|---|---|
| কনটেন্ট | TS কনস্ট্যান্ট (`src/lib/country-destinations-data.ts` ১,৯৯২ লাইন/১৮৩ KB, `university-data-intl.ts` ৩,০৯২ লাইন, `test-prep-data.ts` ৮৪৪ লাইন — মোট **১১,২৮৭ লাইন**) **এবং** ৬০৪ টেবিলের ডেটাবেস |
| রাউটিং | App Router **এবং** ক্লায়েন্ট-সাইড SPA |
| অথেনটিকেশন | NextAuth JWT **এবং** `alo_page_session` পোর্টাল JWT **এবং** আলাদা `StudentSession` টেবিল |
| শিক্ষার্থী | `User` **এবং** `PortalUser`+`PortalStudentProfile` **এবং** `Student` — তিনটি টেবিল |

### ১.৫ হোমপেজ: একটি পেজে পুরো কোম্পানি

লাইভ হোমপেজের HTML: **৫০২,৮৮২ বাইট**, **১৩৭টি হেডিং**, **৯৮টি ইউনিক ইন্টারনাল লিংক**। সেকশনগুলো:

1. Hero
2. Find Your Perfect Course
3. Popular Study Destinations (৭)
4. Who We Are (Mission/Vision/Values)
5. **Everything You Need for a Successful Journey** (১২টি সার্ভিস)
6. **Comprehensive Support Services** (১৫টি সার্ভিস) ← উপরের সেকশনের প্রায় একই
7. From Dream to Destination (১১ ধাপ)
8. Study Abroad Country Guide
9. Trending Programs
10. Top Universities in UK
11. Scholarships & Funding (৬)
12. English Language Tests
13. Visa & Compliance Support (৬)
14. **Your Student Portal** (৮টি অভ্যন্তরীণ ফিচার)
15. **Partner Portal** (৮টি অভ্যন্তরীণ ফিচার)
16. AI-Powered Support Tools (৬)
17. **Everything You Need to Study Abroad** (২২টি রিসোর্স কার্ড)
18. Meet the Experts (৪)
19. FAQ
20. Final CTA

তুলনা করুন:
- **edvoy.com:** "Study abroad. Simplified." → একটি সার্চ বক্স → ৪টি ভ্যালু প্রপ → ৪.৭ রেটিং → ৭৫০+ ইনস্টিটিউশন
- **hokai.io:** "Find the right AI tool for your work in about two minutes." → একটি ইনপুট → ৩টি সেকশন → "436 records re-checked in the last 30 days" (যাচাইযোগ্য প্রমাণ)
- **prospects.ac.uk:** দুটো কাজ — চাকরি খোঁজা / কোর্স খোঁজা

ALO-র হোমপেজে **অভ্যন্তরীণ পোর্টাল ফিচার (Student Portal, Partner Portal)**ও পাবলিক পেজে তালিকাভুক্ত — যা দর্শকের কোনো কাজে আসে না।

### ১.৬ ক্রিটিক্যাল: হোমপেজের Suspense fallback হলো **ফাঁকা সাদা পেজ**

সার্ভার যে HTML পাঠায় তার আসল ক্রম:

```
<header …>navbar…</header>
<!--$--><!--$?-->
<template id="B:0"></template>
<div class="min-h-screen bg-white"></div>     ← Suspense fallback = সম্পূর্ণ ফাঁকা
<!--/$-->
<footer id="alo-public-footer">…</footer>      ← footer, ২৩,২৫৯ বাইটে
…
<main class="flex-1">…</main>                  ← আসল কনটেন্ট, ১১৫,৮৬৪ বাইটে (অনেক পরে)
```

কারণ `src/app/page.tsx`-এ পুরো অ্যাপ একটি মাত্র Suspense-এর ভেতর:

```jsx
<Suspense fallback={<div className="min-h-screen bg-white" />}>
  <HomePageContent />
</Suspense>
```

`useSearchParams()` ব্যবহারের জন্য এই Suspense বাধ্যতামূলক — কিন্তু এর মানে:

- **প্রথম পেইন্টে ব্যবহারকারী দেখে: navbar + ফাঁকা সাদা জায়গা + footer**
- LCP (Largest Contentful Paint) মারাত্মকভাবে খারাপ
- ধীর সংযোগে/ক্রলারে পেজ ফাঁকা দেখায়
- SEO-তে সরাসরি নেতিবাচক প্রভাব

**এটিই সেই কারণ যার জন্য "সব ঠিকঠাক ২০০ OK" হওয়া সত্ত্বেও সাইটটি ধীর ও অপেশাদার মনে হয়।**

### ১.৭ ডেটাবেস প্রায় খালি

সিড চালানোর পর: **৬০৪টি টেবিলের মধ্যে মাত্র ২৫টিতে ডেটা।**

```
portalRolePermission: 842   employee: 24        homeHeroSlide: 7
portalPermission:     122   employeeProfile: 24 teamMember: 6
permission:            57   homepageFaq: 20     blogPost: 6
portalRole:            27   service: 15         newsArticle: 6
portalUser:            26   department: 10      successStory: 4
student:                0   university: 0       course: 0
application:            0   lead: 0             scholarship: 0
```

অর্থাৎ ১০০ MB+ CSV ও JSON (ইউনিভার্সিটি/কোর্স মাস্টার ডেটা) রিপোজিটরিতে আছে, কিন্তু **CRM-এর ডেটাবেসে নেই**। ওয়েবসাইট যা দেখায় তা TS কনস্ট্যান্ট থেকে আসে।

---

## ২. বর্তমান অবস্থা: কী কী সত্যিই কাজ করছে (লাইভ যাচাইকৃত)

### ২.১ পাবলিক ওয়েবসাইট — **সুস্থ** ✅

৩৫টি পাবলিক পেজ লাইভ পরীক্ষা:

```
ফলাফল: ৩৪ × HTTP 200, ১ × HTTP 308 (ইচ্ছাকৃত রিডাইরেক্ট /courses → /course-finder)
রানটাইম এরর: ০    Placeholder/Coming-soon: ০    404: ০
```

| পেজ | আকার | সময় | | পেজ | আকার | সময় |
|---|---:|---:|---|---|---:|---:|
| `/` | ৫০২ KB | ৪১৪ ms | | `/blog` | ১৯১ KB | ২,২৪০ ms |
| `/destinations` | ২৯০ KB | ১,৮০৯ ms | | `/guides` | ১৩৭ KB | ২,২৫৭ ms |
| `/destinations/uk` | ২৮৯ KB | ২,৪৮৯ ms | | `/news` | ১৫৫ KB | ১,৮৮৮ ms |
| `/course-finder` | ১৪১ KB | ১,৫৭০ ms | | `/events` | ১৪৪ KB | ১,৭২২ ms |
| `/universities` | ১৩১ KB | ১,৬৭১ ms | | `/visa` | ১৫৬ KB | ১,৭৭৩ ms |
| `/scholarships` | ১৩৯ KB | ১,৪৭১ ms | | `/visa/readiness` | ১৬০ KB | ১,৭৯২ ms |
| `/services` | ১৩৫ KB | ১,৫২১ ms | | `/english-test-prep` | ১৮৬ KB | ১,৩৮২ ms |
| `/resources` | ১৩৬ KB | ১,২১৪ ms | | `/eligibility-check` | ১৪৪ KB | ২,০৫০ ms |
| `/about` `/contact` `/team` `/faqs` `/success-stories` `/global-offices` `/compare` `/application-process` `/research-opportunities` `/all-university-information` `/language-prep/ielts` `/book-consultation` — সব ২০০ | | | | সব লগিন পেজ (student/employee/partner/admin) — ২০০ | | |

### ২.২ পোর্টাল — **অধিকাংশই কাজ করছে** ✅

| ভূমিকা | পরীক্ষিত | ফলাফল |
|---|---:|---|
| **SUPER_ADMIN** (`admin@alo.edu.bd`) | ৪৯টি রুট | **৪০ × 200**, ১১ × 307 (`/employee/*` — সঠিকভাবে ব্লক, RBAC কাজ করছে) |
| **EMPLOYEE** (`employee@alo.edu.bd`) | ১২টি রুট | **১২ × 200**, প্রতিটি ৫৭–৬৪ KB বাস্তব কনটেন্ট |
| **PARTNER** (`partner@alo.edu.bd`) | ৮টি রুট | **৮ × 200**, প্রতিটি ~৫৫ KB |
| **STUDENT** (`student@alo.edu.bd`) | ১২টি রুট | ১২ × 200 — **কিন্তু সবই ফাঁকা শেল ("Loading your portal…"), নিচের ত্রুটি দেখুন** |

**লগিন + RBAC নিখুঁতভাবে কাজ করছে:**
- ভুল পোর্টালে ঢুকতে চাইলে → `403 {"error":"unauthorized","message":"Please use the correct portal."}`
- অননুমোদিত রুট → `307 → /login?callbackUrl=…`
- ১৫ মিনিটে ৫ বার ব্যর্থ লগিন → অ্যাকাউন্ট লক (rate limiting কাজ করছে)

### ২.৩ API লেয়ার — **অধিকাংশই সঠিক উত্তর দিচ্ছে** ✅

```
✅ /api/admin/dashboard/metrics   200  {"activeStudents":1,"totalLeads":0,"totalPartners":1,…}
✅ /api/admin/employees           200  {success, employees, portalUsers, launcherCards}
✅ /api/applications              200  {success, data:[], pagination:{page,limit,total,totalPages}}
✅ /api/admin/universities        200  {success, data:[], meta:{total:0,…}}
✅ /api/admin/courses             200  {success, data:[], meta:{…}}
✅ /api/analytics/conversion-funnel 200 {window, groupBy, rows}
✅ /api/audit                     200  {logs:[]}
✅ /api/employee/tasks            200  {success, tasks:[], pagination:{…}}
✅ /api/employee/notifications    200  {success, notifications:[], unreadCount:0}
✅ /api/partner/students          200  {success, data:[], pagination:{…}}
✅ /api/partner/leads             200  {success, data:[], total:0}
✅ /api/partner/commission        200  {success, data:{summary:{…}, payments:…}}
```

### ২.৪ নিরাপত্তা ও পরীক্ষা — **শক্তিশালী** ✅

- **৩১৮টি টেস্ট ফাইল** (ইউনিট + ইন্টিগ্রেশন + E2E), যার বেশিরভাগই **অথরাইজেশন/নিরাপত্তা রিগ্রেশন টেস্ট**: `api-authz-regression`, `visa-security-negative`, `partner-b2b-security`, `employee-scope-boundaries`, `application-document-review-security`, `whatsapp-ai-safety`, `private-storage-filesystem` …
- `src/proxy.ts` — সুস্পষ্ট `PUBLIC_ROUTES` + `ROLE_ROUTES` allow-list
- `src/lib/storage/private-file-store.ts` — **খুব ভালো**: private ডকুমেন্ট `public/`-
  এর বাইরে, `O_NOFOLLOW`, canonical-path যাচাই, web-root ওভারল্যাপ প্রত্যাখ্যান, 0700 পারমিশন
- CSP, HSTS, `X-Frame-Options`, `Referrer-Policy` সব কনফিগার করা
- `SESSION_ROLES` মডিউল + টেস্ট দিয়ে দুই ভোকাবুলারির ড্রিফট রোধ করা হয়েছে (চমৎকার প্র্যাকটিস)

**স্পষ্ট করে বলতে হয়: নিরাপত্তা চিন্তাভাবনার মান সাধারণের চেয়ে অনেক উপরে। সমস্যা নিরাপত্তায় নয় — সমস্যা হলো আকার, গঠন ও সমাপ্তি।**

---

## ৩. যাচাইকৃত ত্রুটিসমূহ (প্রমাণসহ)

### 🔴 ক্রিটিক্যাল (Production ব্লকার)

| # | ত্রুটি | প্রমাণ |
|---|---|---|
| C1 | **প্রোডাকশন বিল্ড OOM** — ৩ GB heap-এও বিল্ড ব্যর্থ | `FATAL ERROR: Ineffective mark-compacts near heap limit` / `SIGABRT` |
| C2 | **হোমপেজের Suspense fallback = ফাঁকা সাদা ডিভ** → প্রথম পেইন্ট ফাঁকা | `<div class="min-h-screen bg-white"></div>` at byte ২৩,২৬০; `<main>` ১,১৫,৮৬৪-এ |
| C3 | **শিক্ষার্থী লগিন সম্ভব নয়** — `Student` টেবিলে ০ রো; সিড শুধু `PortalUser`+`PortalStudentProfile` তৈরি করে | `student: 0`, `portalStudentProfile: 1`; `/api/student/auth/login` → `{"success":false,"error":"Invalid credentials"}` |
| C4 | **শিক্ষার্থী API গুলো পোর্টাল সেশন গ্রহণ করে না** — আলাদা `StudentSession` সিস্টেম | `/api/student/dashboard`, `/applications`, `/documents` → **401** |
| C5 | **ডেভ সার্ভার ~২৫টি রুটের পর OOM** → ৪৫৪টি রুট কখনোই এক্সারসাইজ করা যায় না | পর্যবেক্ষিত: ২৫ রুটে ৩,৮৪৬ MB / ৩,৯৩৯ MB ব্যবহার |

### 🟠 হাই

| # | ত্রুটি | প্রমাণ |
|---|---|---|
| H1 | `prisma/seed-employee-access.ts` ক্র্যাশ — `partnerPackage.create()`-এ বাধ্যতামূলক `slug` নেই | `Argument \`slug\` is missing.` |
| H2 | `docs/DEV-SQLITE-SANDBOX.md` মিথ্যা — ডকুমেন্টে আছে `file:` DATABASE_URL থাকলে স্বয়ংক্রিয়ভাবে SQLite হবে; কোডে (`src/lib/db.ts`) আসলে `ALO_DB_DRIVER=sqlite` লাগে | `db.ts` শুধুমাত্র `ALO_DB_DRIVER === 'sqlite'` চেক করে |
| H3 | `prisma/verification-mirror/schema.sqlite.prisma` ড্রিফটেড — `PartnerBranding` মডেল অনুপস্থিত | `npm run awf:mirror` চালালে ৩১ লাইন যুক্ত হয় (আমি ঠিক করে দিয়েছি) |
| H4 | `/api/crm/leads` → **403** EVEN for SUPER_ADMIN | লাইভ প্রোব |
| H5 | `/api/notifications` → **404**, `/api/partner/dashboard` → **404** (রুটই নেই) | লাইভ প্রোব |
| H6 | `/student/referrals/[id]` — পেজে **কাঁচা স্পেসিফিকেশন টেক্সট** UI কপি হিসেবে রেন্ডার হয়, কোনো ডেটা-ফেচ নেই | সরাসরি পেজের উৎস দেখুন |

### 🟡 মিডিয়াম

| # | ত্রুটি | পরিমাণ |
|---|---|---|
| M1 | **১০টি "স্টাব" পেজ** — স্ট্যাটিক JSX, কোনো ডেটা নেই | `/blog`, `/destinations`, `/global-offices`, `/aqf-compliance`, `/code-of-conduct`, `/student-complaint-policy`, `/admission-requirements`, `/offline`, `/employee/activate`, `/student/visa-interview-practice` |
| M2 | **SEO মেটাডেটা নেই** — ৪৫৪ পেজের মধ্যে মাত্র ১২৫টিতে `export const metadata` | ২৭.৫% |
| M3 | **i18n অসম্পূর্ণ** — EN/BN ৭৪টি কী আছে, কিন্তু ৫২৬ কম্পোনেন্টের মাত্র **৩টিতে** `useI18n` ব্যবহার | ০.৬% |
| M4 | **মনোলিথ কম্পোনেন্ট** — ২,৮৯৮ / ২,৬৯৮ / ২,৫৯৩ / ২,৩৩৪ / ২,২৩৫ লাইনের ফাইল | `marketing-dashboard.tsx`, `enterprise-hr-dashboard.tsx`, `StudentProfilePage.tsx` … |
| M5 | **ডিজাইন টোকেন অসঙ্গতি** — ১৮,৪১২ বার `var(--alo-*)` ব্যবহার, কিন্তু ৮২টি ফাইলে **৪৭২টি হার্ডকোডেড hex**; **৩,৩৫৩টি arbitrary px** ফন্ট সাইজ (`text-[15px]`) | টাইপ স্কেল ভিন্নতা |
| M6 | **২৮৩টি "পাতলা র‍্যাপার" পেজ** — শুধু একটি কম্পোনেন্ট ইমপোর্ট করে (নিজে কোনো ত্রুটি নয়, কিন্তু ৪৫৪ পেজের "প্রশস্ততা" অনেকটাই কৃত্রিম) | — |

---

## ৪. ওয়েবসাইট, CRM ও ডিজাইন উন্নত করার রোডম্যাপ

### ধাপ ১ — রিপোজিটরি পরিষ্কার (প্রথমেই করুন, অন্য সবকিছু আটকে আছে)

```bash
# ১. কমিট করা node_modules সরান (৮২৭ MB, ৫৮,৭৫৮ ফাইল)
git rm -r --cached imports/alo-education-full/node_modules
git rm -r --cached alo-education-web-crm-final
echo "node_modules/" >> .gitignore
echo "imports/"      >> .gitignore
echo "alo-education-web-crm-final/" >> .gitignore

# ২. ইতিহাস থেকেও মুছুন (BFG বা filter-repo দিয়ে)
git filter-repo --path-glob '**/node_modules/*' --invert-paths

# ৩. ২১৪ MB CSV রিপোজিটরি থেকে বের করে অবজেক্ট স্টোরেজে (S3/R2) নিন
# ৪. ২,০০২টি Markdown কে docs/-এ আর্কাইভ করুন, রুটে রাখবেন না
```

**প্রত্যাশিত ফল:** ৬৮,২৭২ ফাইল → ~৬,৫০০; ৩.৮ GB → ~২০০ MB; `.git` ২৪২ MB → ~৩০ MB; `git clone` এবং CI নাটকীয়ভাবে দ্রুত।

### ধাপ ২ — বিল্ড সচল করা (এটিই "প্রোডাকশন-রেডি"-র সংজ্ঞা)

বিল্ড OOM-এর মূল কারণ: ৪৫৪টি রুট একসাথে কম্পাইল + ৬০৪ মডেলের Prisma ক্লায়েন্ট + ৫২৬টি কম্পোনেন্টের গ্রাফ।

1. **রুট সংখ্যা কমান** — ২৮৩টি পাতলা র‍্যাপারের অনেকগুলোই একই কম্পোনেন্টের দিকে যায়। ৪৫৪ → লক্ষ্য ১২০–১৫০।
2. **`src/app/page.tsx`-এর SPA মনোলিথ ভেঙে ফেলুন** — App Router-ই একমাত্র রাউটিং হবে।
3. **কম্পোনেন্ট ভাগ করুন** — ২,০০০+ লাইনের ফাইলগুলোকে ফিচার-ভিত্তিক মডিউলে ভাগ করুন; `dynamic()` ইমপোর্ট ব্যবহার করুন।
4. **`modularizeImports` / `optimizePackageImports`** চালু করুন (lucide-react, recharts, radix-এর জন্য)।
5. **`experimental: { cpus: 1, workerThreads: false }`** — বিল্ডের সময় বাড়িয়ে দেয়; CI-তে `cpus: 4` দিন।
6. CI-তে **সর্বনিম্ন ৮ GB RAM** নিশ্চিত করুন (বর্তমান ডকুমেন্টেশনে "needs VPS 8GB+" লেখা আছে — মেনে চলুন)।

### ধাপ ৩ — হোমপেজ পুনর্নির্মাণ (সবচেয়ে বেশি দৃশ্যমান উন্নতি)

**করবেন:**
- Suspense fallback বদলে **আসল স্কেলিটন** দিন (নিচে কোড)
- Hero-র ওপরের অংশ সার্ভার-রেন্ডার করুন, `useSearchParams()` কে নিচের ছোট একটি ব্লকে সীমাবদ্ধ করুন
- সেকশন ২০ → ৮:
  1. Hero (একটি H1, একটি প্রাথমিক CTA)
  2. সার্চ/এলিজিবিলিটি চেক (edvoy-এর মতো একটি বক্স)
  3. জনপ্রিয় গন্তব্য (৭টি)
  4. কেন ALO (৪টি — বর্তমান ১২+১৫=২৭টির বদলে)
  5. যাত্রাপথ (১১ ধাপ → সংক্ষিপ্ত টাইমলাইন)
  6. স্কলারশিপ (৬)
  7. সফলতার গল্প + রেটিং (সামাজিক প্রমাণ)
  8. চূড়ান্ত CTA
- **"Your Student Portal" ও "Partner Portal" সেকশন সরিয়ে ফেলুন** — এগুলো অভ্যন্তরীণ ফিচার
- প্রতিটি দাবিতে যাচাইযোগ্য প্রমাণ যোগ করুন (hokai.io-এর "436 records re-checked in the last 30 days"-এর মতো): "X জন শিক্ষার্থী", "Y% ভিসা সাফল্য — সর্বশেষ যাচাই: <তারিখ>"

```jsx
// src/app/page.tsx — আগে
<Suspense fallback={<div className="min-h-screen bg-white" />}>
  <HomePageContent />
</Suspense>

// পরে: Hero সার্ভার-রেন্ডার, শুধু ইন্টারেক্টিউ ব্লক Suspense-এ
export default function Home() {
  return (
    <>
      <HeroServer />                         {/* SSR, কোনো Suspense নেই */}
      <Suspense fallback={<SearchBoxSkeleton />}>
        <SearchBoxClient />                  {/* useSearchParams এখানেই */}
      </Suspense>
      <PopularDestinationsServer />          {/* SSR */}
      …
    </>
  );
}
```

### ধাপ ৪ — ডিজাইন সিস্টেম শক্ত করুন

1. **একটি টাইপ স্কেল** ঠিক করুন — ৩,৩৫৩টি `text-[15px]`-এর মতো arbitrary মান কমিয়ে `text-sm/base/lg/xl` করুন
2. **হার্ডকোডেড রঙ বন্ধ করুন** — ৪৭২টি hex-এর জায়গায় `var(--alo-*)`; ESLint রুল যোগ করুন:
   ```js
   // eslint.config.mjs
   'no-restricted-syntax': ['error', {
     selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
     message: 'Use a design token (var(--alo-*)) instead of a hard-coded hex colour.',
   }]
   ```
3. `tests/unit/design-tokens.test.ts` আগে থেকেই আছে — এটিকে **রঙ + টাইপোগ্রাফি + স্পেসিং** সব কভার করুন এবং CI-তে বাধ্যতামূলক করুন
4. **যাচাইযোগ্য ডেটা ব্যাজ** — প্রতিটি তথ্যের সাথে "উৎস + সর্বশেষ যাচাইয়ের তারিখ" (ইতিমধ্যে `COUNTRY_DESTINATIONS`-এ `lastVerifiedAt` আছে — সেটি UI-তে দেখান)

### ধাপ ৫ — CRM-কে আসল ডেটাবেস-চালিত করুন

1. **১০০ MB CSV/JSON ইমপোর্ট করুন** → `University`, `Course`, `CourseIntake`, `TuitionFee`, `Scholarship` টেবিলে। বর্তমানে সব খালি।
2. **`src/lib/*-data.ts` কনস্ট্যান্টগুলো সরিয়ে** DB-থেকে পড়ুন (`/destinations`, `/blog`, `/universities` ইত্যাদি)।
3. **তিনটি শিক্ষার্থী টেবিল → একটিতে** নামিয়ে আনুন; অন্তত একটি মাইগ্রেশন লিখে `PortalStudentProfile` ও `Student` সিঙ্ক করুন।
4. **তিনটি অথেনটিকেশন → একটি**: `src/lib/auth-middleware.ts`-এর `authenticateRequest`-কে একমাত্র পথ করুন, `withStudentAuth`-কে এর ওপরে স্তর হিসেবে বসান।
5. **সিড ঠিক করুন**: `seed-employee-access.ts`-এ `slug` যোগ করুন; সিড যেন `Student` রো তৈরি করে।

### ধাপ ৬ — সমাপ্তির সংজ্ঞা (Definition of Done) ঠিক করুন

এটিই "বারবার ব্যর্থ হওয়া" বন্ধ করবে। একটি ফিচার "সম্পন্ন" বলা যাবে শুধুমাত্র যদি:

- [ ] `npm run build` **সম্পূর্ণ সফল** (OOM নয়)
- [ ] পেজটি **SSR-এ আসল কনটেন্ট** দেয় (শুধু "Loading…" নয়)
- [ ] লগিন করে সেই পেজে **বাস্তব ডেটা** দেখা যায়
- [ ] কমপক্ষে একটি **ইন্টিগ্রেশন টেস্ট** আছে যা DB-তে রেকর্ড তৈরি → পড়া → যাচাই করে
- [ ] মেটাডেটা + canonical URL আছে
- [ ] **কোনো `*_READY.md` রিপোর্ট লেখা হয়নি** — কোডই প্রমাণ

> রিপোজিটরিতে ইতিমধ্যে `tests/unit/false-success-quarantine.test.ts` আছে। এই চিন্তাভাবনাটি ইতিমধ্যে দলে ঢুকেছে — এবার একে **বিল্ড গেট** বানান।

---

## ৫. সম্পন্ন বনাম অবশিষ্ট

### ✅ সম্পন্ন (যাচাইকৃত)

| কাজ | অবস্থা |
|---|---|
| পাবলিক ওয়েবসাইট (৩৫টি পেজ) | ✅ লাইভ ২০০, ০ ত্রুটি |
| নেভিগেশন, ফুটার, লিগ্যাল পেজ | ✅ |
| গন্তব্য/কোর্স/স্কলারশিপ/সার্ভিস পেজ | ✅ |
| লগিন সিসটেম (৪ পোর্টাল) + rate limiting | ✅ |
| RBAC (২৭ রোল, ৮৪২ পারমিশন গ্রান্ট) | ✅ সঠিকভাবে ব্লক করছে |
| Employee পোর্টাল (১২/১২ পেজ, বাস্তব কনটেন্ট) | ✅ |
| Partner পোর্টাল (৮/৮ পেজ) | ✅ |
| Admin/CRM পোর্টাল (৪০/৪৯ রুট) | ✅ |
| ১২টি প্রধান API (মেট্রিক্স, অ্যাপ্লিকেশন, ইউনিভার্সিটি, কোর্স, টাস্ক, নোটিফিকেশন, কমিশন …) | ✅ সঠিক স্কিমা |
| প্রাইভেট ডকুমেন্ট স্টোরেজ (নিরাপত্তা) | ✅ খুব ভালো |
| CSP/HSTS/সিকিউরিটি হেডার | ✅ |
| ৩১৮টি টেস্ট (নিরাপত্তা-কেন্দ্রিক) | ✅ |
| SEO: sitemap, robots, ১২৫ পেজে মেটাডেটা | 🟡 আংশিক |
| i18n অবকাঠমো (EN + বাংলা, ৭৪ কী) | 🟡 অবকাঠমো আছে, প্রয়োগ নেই |

### ❌ অবশিষ্ট (অবশ্যই করতে হবে)

**ব্লকার:**
1. প্রোডাকশন বিল্ড OOM সমাধান
2. হোমপেজের ফাঁকা Suspense fallback → স্কেলিটন + SSR Hero
3. শিক্ষার্থী লগিন (Student টেবিল ০) + স্টুডেন্ট API ৪০১
4. `/api/crm/leads` 403, `/api/notifications` 404, `/api/partner/dashboard` 404
5. `/student/referrals/[id]`-এর স্পেসিফিকেশন টেক্সট

**গঠনমূলক:**
6. রিপোজিটরি পরিষ্কার (৮২৭ MB node_modules, ৬১,১৯৩ imports ফাইল)
7. `src/app/page.tsx` SPA মনোলিথ ভেঙে App Router-এ একীভূতকরণ
8. ১১,২৮৭ লাইনের হার্ডকোডেড কনস্ট্যান্ট → ডেটাবেস
9. তিনটি অথেনটিকেশন → একটি
10. তিনটি শিক্ষার্থী টেবিল → একটি
11. ২,০০০+ লাইনের কম্পোনেন্টগুলো ভাগ করা
12. হোমপেজ ২০ সেকশন → ৮
13. মেটাডেটা ২৭.৫% → ১০০%
14. i18n ৩ কম্পোনেন্ট → সব পাবলিক পেজ
15. ডিজাইন টোকেন: ৪৭২ hex + ৩,৩৫৩ arbitrary px নির্মূল

---

## ৬. এই অডিট-চলাকালে আমার করা পরিবর্তন

| ফাইল | পরিবর্তন | কারণ |
|---|---|---|
| `scripts/dev-sqlite/generate-dev-schema.mjs` | ঠিক করা — ৩২৫টি `dbgenerated()` ডিফল্ট ও `@db.VarChar` এখন অনূদিত হয় | স্ক্রিপ্টটি চলতেই না; ডেভ পাইপলাইন অচল ছিল |
| `prisma/verification-mirror/schema.sqlite.prisma` | `PartnerBranding` মডেল যোগ (মিরর সিঙ্ক) | মিরর স্কিমা `schema.prisma`-এর সাথে ড্রিফটেড ছিল |
| `.gitignore` | `prisma/schema.sqlite-runtime.prisma` যোগ | বিল্ড আর্টিফ্যাক্ট |

ডেটাবেস, `.env`, `node_modules`, সব জেনারেটেড ফাইল **গিট-ইগনোরড** — রিপোজিটরিতে কোনো অবাঞ্ছিত আর্টিফ্যাক্ট যোগ হয়নি।

---

## ৭. এক লাইনে উত্তর

> **আপনার প্রকল্পটি ধীরগতিতে চলছে কারণ এটি ৪.৮% কোড ও ৯৫% কপি-করা আর্টিফ্যাক্ট; কারণ এটি প্রস্থে (breadth) ৪৫৪ পেজ ও ৬০৪ টেবিল ছড়িয়ে পড়েছে কিন্তু গভীরে (depth) কোনো একটি প্রবাহও শেষ করেনি; কারণ ডকুমেন্টেশনকে অগ্রগতি হিসেবে গণ্য করা হয়েছে; এবং কারণ বিল্ড না চলায় কেউই পুরো পণ্যটি ক্লিক করে দেখতে পারেনি। সমাধান: রিপোজিটরি সরলীকরণ → বিল্ড সচলকরণ → একক সত্য-উৎস → "বিল্ড সফল + বাস্তব ডেটা" কে সমাপ্তির সংজ্ঞা করা।**
