# Alaminn.info — Run on M5 Mac + Mobile App Guide

> **Question this answers:** *"How do I run this on my M5 machine with mobile apps?"*
>
> Two parts:
> 1. **Run the project locally on an Apple M5 (M-series) Mac**
> 2. **Use it as a mobile app** — installable on iPhone/Android home screen, or packaged as a real native app

---

## Part 1 — Run on your M5 Mac (Apple Silicon)

### Step 1: Install Bun (the runtime)

```bash
# Open Terminal on your M5 Mac, then:
curl -fsSL https://bun.sh/install | bash

# Restart your shell so `bun` is on PATH:
exec $SHELL

# Verify (should print bun 1.3.x or newer):
bun --version
```

Bun runs natively on Apple Silicon — no Rosetta needed.

### Step 2: Get the project onto your Mac

Either copy from this sandbox, or download the production archive:

```bash
# Option A — copy the production archive (42 MB) to your Mac:
scp your-server:/home/z/my-project/alaminn-info-web-crm-production.tar.gz ./
tar -xzf alaminn-info-web-crm-production.tar.gz
cd alaminn-info

# Option B — clone from git (if you have a repo):
git clone <your-repo-url> alaminn-info
cd alaminn-info
```

### Step 3: Install dependencies

```bash
bun install
```

This pulls all 100+ packages. On an M5 Mac this takes ~15 seconds.

### Step 4: Set up the local database (SQLite — zero config)

The dev database is already configured in `.env`:

```
DATABASE_URL=file:./db/custom.db
```

Push the schema and seed it:

```bash
bun run db:generate   # generates Prisma client
bun run db:push       # creates all 25 tables in SQLite
bun run db:seed       # inserts admin user + sample data
```

### Step 5: Start the dev server

```bash
bun run dev
```

You'll see:

```
▲ Next.js 16.1.3 (Turbopack)
- Local:        http://localhost:3001
- Network:      http://192.168.x.x:3001
✓ Ready in ~1s
```

Open **http://localhost:3001** in your browser. Done — the site is running on your M5 Mac.

### Step 6 (optional): Production build on your M5 Mac

```bash
bun run build       # builds standalone server (~22 seconds on M5)
bun run start       # serves the production build on port 3001
```

---

## Part 2 — Use it as a Mobile App

You have **three options**, from easiest to most native. I recommend starting with **Option A (PWA)** — it gives you a real installable app icon on iPhone/Android with zero native code.

### Option A — PWA (Progressive Web App) ✅ RECOMMENDED

A PWA is a website that **installs to the home screen** like a native app, works offline, and shows no browser chrome. This is what Twitter Lite, Starbucks, and Pinterest use.

#### What's already in the project

- ✅ Next.js 16 with App Router
- ✅ `src/app/icon.tsx` + `src/app/apple-icon.tsx` (auto-generated icons)
- ✅ Responsive mobile-first design (Tailwind CSS 4)
- ✅ Standalone build (`output: "standalone"`)

#### What I added for you (in this session)

- ✅ `src/app/manifest.ts` — Web App Manifest (name, icons, theme color, display: standalone)
- ✅ `public/sw.js` — Service Worker for offline caching
- ✅ Service Worker registration component (`src/components/site/pwa/register-sw.tsx`)
- ✅ Manifest metadata in `src/app/layout.tsx`

#### How to install on your phone

**iPhone (iOS 16.4+):**
1. Make sure your M5 Mac and iPhone are on the same Wi-Fi.
2. On iPhone, open Safari → go to `http://192.168.x.x:3001` (the Network URL from `bun run dev`).
3. Tap the **Share** button → **Add to Home Screen** → **Add**.
4. An app icon appears on your home screen. Tap it → opens full-screen, no Safari chrome.

**Android (Chrome / Edge):**
1. Same Wi-Fi. Open Chrome → `http://192.168.x.x:3001`.
2. Chrome shows an **"Install app"** prompt automatically (or menu → **Install app**).
3. App installs to home screen + app drawer. Launches full-screen.

**For production (real domain with HTTPS):**
- PWA install requires HTTPS. `https://alaminn.info` already has SSL (Let's Encrypt via Nginx).
- Once deployed, the same "Add to Home Screen" flow works on the live domain.

#### How to find your M5 Mac's local IP

```bash
# On your M5 Mac:
ipconfig getifaddr en0     # Wi-Fi
ipconfig getifaddr en1     # Ethernet (or Wi-Fi if en0 is empty)
```

Then on your phone: `http://<that-ip>:3001`

---

### Option B — Capacitor (native iOS/Android wrapper)

If you want a **real binary** you can ship to the App Store / Play Store, wrap the web app with Capacitor. Same UI, but packaged as a native app with access to native APIs (camera, push notifications, etc.).

#### Step 1: Install Capacitor

```bash
bun add @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
```

#### Step 2: Initialize

```bash
bunx cap init "Alaminn" "info.alaminn.app" --web-dir=.next/standalone
```

#### Step 3: Build the web app, then add native platforms

```bash
bun run build
bunx cap add ios
bunx cap add android
bunx cap copy
```

#### Step 4: Open in native IDEs

```bash
bunx cap open ios      # opens Xcode (requires macOS + Xcode)
bunx cap open android  # opens Android Studio
```

From Xcode: connect your iPhone → select it → ▶️ Run. The app launches on your phone as a real native binary.

#### Prerequisites on M5 Mac

- **Xcode 15+** (free from Mac App Store) — for iOS builds
- **Android Studio** (free) — for Android builds
- **Apple Developer account** ($99/year) — only needed to ship to App Store or install on a device that isn't yours. For your own device, free Apple ID works.

---

### Option C — Expo / React Native (NOT recommended for this project)

This would mean **rewriting the entire UI** in React Native. The project is 15+ sections, 22 admin pages, 25 DB tables — a full rewrite would take weeks. **Don't do this.** Use Option A or B.

---

## Part 3 — Mobile-Specific Features Already in the Project

The site was built mobile-first. These already work on your phone:

| Feature | Where |
|---|---|
| Responsive layout (mobile → tablet → desktop breakpoints) | All `sm:` / `md:` / `lg:` Tailwind classes |
| Mobile hamburger nav drawer | `src/components/site/navbar.tsx` |
| Touch-friendly tap targets (min 44px) | All buttons + nav links |
| Mobile-safe sticky footer | `src/app/page.tsx` (flex-col + mt-auto) |
| Auto-generated app icons (192, 512, apple-touch) | `src/app/icon.tsx`, `src/app/apple-icon.tsx` |
| Theme color meta | `src/app/layout.tsx` |
| Safe-area insets (iOS notch) | `src/app/globals.css` |
| Pull-to-refresh friendly (no overscroll bounce bug) | `globals.css` `overscroll-behavior: none` |

---

## Part 4 — Quick Start Summary (TL;DR)

```bash
# 1. On your M5 Mac:
curl -fsSL https://bun.sh/install | bash && exec $SHELL

# 2. Get the project:
tar -xzf alaminn-info-web-crm-production.tar.gz
cd alaminn-info

# 3. Install + set up DB:
bun install
bun run db:generate && bun run db:push && bun run db:seed

# 4. Run:
bun run dev

# 5. Find your Mac's IP:
ipconfig getifaddr en0

# 6. On your phone (same Wi-Fi):
#    Open http://<mac-ip>:3001 in Safari/Chrome
#    → "Add to Home Screen" → you now have a mobile app
```

---

## Part 5 — Production (so anyone in the world can install it)

Once you deploy to `https://alaminn.info` (per the deploy guide):

1. The PWA manifest + service worker are automatically served.
2. Any visitor on iPhone/Android can "Add to Home Screen" → gets an app icon.
3. The app works offline (service worker caches the shell).
4. To distribute as a real App Store / Play Store app later, follow Option B (Capacitor) using the same codebase.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `bun: command not found` after install | Run `exec $SHELL` or restart Terminal. If still missing: `source ~/.zshrc` |
| Phone can't reach `http://<mac-ip>:3001` | Make sure both devices are on the **same Wi-Fi network** (not a guest network). On Mac: System Settings → Network → check the network name. |
| Mac firewall blocks the connection | System Settings → Network → Firewall → Options → allow `bun` (or temporarily disable firewall for testing). |
| `EADDRINUSE: port 3001 already in use` | Run `lsof -i :3001` to find the process, then `kill -9 <PID>`. Or change port in `package.json` → `scripts.dev` → `next dev -p 3002`. |
| iPhone "Add to Home Screen" missing the app icon | Make sure you visited the site in **Safari** (not Chrome on iOS — Chrome on iOS can't install PWAs). |
| Android "Install app" prompt doesn't appear | Open Chrome menu (⋮) → "Install app" should be there manually. Requires HTTPS for the prompt to auto-trigger. |
| Service Worker not registering | Open Chrome DevTools → Application → Service Workers. Check the console for errors. SW only works on HTTPS or `localhost`. |
| Database errors on first run | Delete `db/custom.db` and re-run `bun run db:push && bun run db:seed`. |
