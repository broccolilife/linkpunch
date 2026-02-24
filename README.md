# 🛸 Linkpunch (Aerolinks)

A "sexy" 3D Linktree-style experience built with Next.js 14, React Three Fiber, and local JSONL analytics. Floating glass banners in a 3D scene — flip to reveal details, click to visit.

## ✨ Features

- **3D Glass Banners** — Floating `meshPhysicalMaterial` cards with glass/metal presets, flip interaction, and spring animations
- **Platform Links** — OnlyFans, X/Twitter, Instagram, TikTok, YouTube, Twitch, Patreon — all configurable
- **JSONL Analytics** — Server-side event logging with visitor tracking, CTR, device detection, and referrer analysis
- **Creator Dashboard** — Stats panel with aggregated metrics (append `?creator=1` to URL)
- **Avatar Badge** — Animated avatar component with platform emblem overlays
- **WebGL Fallback** — Graceful HTML fallback when 3D isn't available
- **Reduced Motion** — Respects `prefers-reduced-motion` for float intensity

## 🏗 Architecture Overview

```
┌─ app/
│  ├─ page.tsx              3D homepage (Canvas + banner layout)
│  ├─ layout.tsx            Root layout
│  ├─ globals.css           Global styles
│  ├─ shared/client.ts      Client analytics helpers (visitorId, device, fetch)
│  ├─ (protected)/
│  │   ├─ layout.tsx        Protected route layout
│  │   └─ insights/page.tsx Creator insights page
│  └─ api/
│      ├─ event/route.ts    POST — append JSONL event (page_view / banner_click)
│      └─ stats/route.ts    GET  — aggregated stats (views, CTR, devices, referrers)
│
├─ components/
│  ├─ Banner3D.tsx          3D banner mesh — flip animation, PBR material, emblem textures
│  ├─ StatsPanel.tsx        Creator-only analytics overlay
│  └─ AvatarBadge.tsx       Animated avatar with platform badge
│
├─ server/
│  └─ store.ts              JSONL file persistence, event types (Zod), aggregation logic
│
├─ public/                  Logo images, avatar placeholder
└─ data/
   └─ events.jsonl          (gitignored) analytics event log
```

### Data Flow
```
Browser → trackPageView() / trackBannerClick()
       → POST /api/event → store.appendEvent() → data/events.jsonl
       
Creator → GET /api/stats → store.getStats() → StatsSummary
       → StatsPanel renders totals, CTR, device mix, top referrers
```

## 🚀 Getting Started

### Requirements
- Node.js 18+
- npm

### Install & Run
```bash
git clone https://github.com/broccolilife/linkpunch.git
cd linkpunch
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the 3D link page.

Open [http://localhost:3000/?creator=1](http://localhost:3000/?creator=1) for the creator dashboard (or press **S**).

### Customizing Links
Edit the `platformBanners` array in `app/page.tsx` — each banner has `id`, `title`, `description`, `url`, `material`, `color`, and optional `emblem`.

### Resetting Analytics
```bash
rm -f data/events.jsonl
```
A new file is created automatically on the next event.

### Production Build
```bash
npm run build
npm run start
```
All API routes use the Node runtime for filesystem access.

## 📸 Screenshots

> _Coming soon — 3D glass banners, flip interaction, creator stats panel_

## 🧰 Tech Stack

- **Next.js 14** — App Router, API routes
- **React Three Fiber** + **drei** — 3D scene, materials, floating animation
- **Three.js** — `meshPhysicalMaterial` with clearcoat, transmission, IOR
- **JSONL** — Lightweight append-only analytics (no database needed)
- **TypeScript** — Full type safety

## 📄 License

MIT
