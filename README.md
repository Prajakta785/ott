# Aurora OTT — Production Web Admin Panel

A cinematic, high-performance Web Admin Panel for the Premium OTT Video Streaming Platform built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Firebase (Auth, Firestore, Cloud Functions)**, and **Bunny.net (Stream, Storage, CDN)**.

---

## 🎬 Architecture & Technology Stack

- **Framework:** Next.js 14 (App Router) + React 18 + TypeScript
- **Styling:** Tailwind CSS with Dark Cinematic Theme, Glassmorphic Panels & Neon Badges
- **Icons & Charts:** Lucide React & Recharts
- **Database & Auth:** Google Cloud Firestore + Firebase Auth (Email/Password + 2FA OTP)
- **Backend & Webhooks:** Next.js Server Routes (`/api/bunny/*`, `/api/admins/*`) + Firebase Cloud Functions (`functions/`)
- **Video & Storage Engine:** Bunny.net Stream (HLS adaptive bitrate encoding, direct signed uploads, token authentication) + Bunny Storage & CDN

---

## 🚀 Key Features

### 1. Unified Content Management System (CMS)
- **Movies (VOD):** Title, slug, genres, cast, director, ratings, Bunny Stream video GUID, resolution (4K HDR/1080p), duration detection, poster & banner uploaders, premium gating toggle, and status workflow (Draft / Published).
- **Web Series Drill-Down:** Multi-tier nested management:
  `Series List` ➔ `Click into Series` ➔ `Seasons Tab (Add/Reorder)` ➔ `Episodes Table (Bunny Video GUID, Duration, Thumbnail, Free Preview Toggle for Episode 1)`.
- **Podcasts & Audio Vault:** Podcast show management with audio upload to Bunny Storage, show notes with timestamps, duration, and cover art.

### 2. Bunny.net Direct Upload & Anti-Piracy Architecture
- **Direct Client-to-Bunny Upload:** Files never pass through serverless functions. The client requests a signed upload session via `/api/bunny/upload`, then uploads directly to Bunny Stream with real-time progress.
- **Auto HLS Renditions & Webhook:** Bunny encodes adaptive bitrate renditions (4K, 1080p, 720p, 480p) and triggers the `/api/bunny/webhook` endpoint to mark items as `ready` in Firestore.
- **Signed Playback Tokens:** Player URLs are token-authenticated via HMAC-SHA256 with 2-hour expiration, verifying active subscriber status before issuing playback tokens.

### 3. Role-Based Access Control (RBAC)
- **Superadmin:** Full control over catalog, billing plans, admin accounts, and API credentials.
- **Editor:** Can create and edit movies, series, episodes, podcasts, and publish to live users.
- **Uploader:** Can upload media drafts to Bunny Stream and create draft entries.

### 4. Interactive Hero Banners & Monetization
- **Hero Carousel Manager:** Reorderable hero banners with live preview simulator, order sequencing, and linked media.
- **Subscription Plans:** Configure pricing, currency, duration (days), concurrent device limits (1 to 4 devices), resolution limits, and feature lists.
- **User Device Limit Enforcement:** Inspect active device sessions (Apple TV, Android TV, Mobile, Web) with remote session revocation and continue-watching sync.

### 5. Dual Engine (Live Firebase + Instant Demo Mode)
- **Out of the Box:** Pre-populated with rich, realistic streaming movies, series, seasons, episodes, podcasts, active users, and analytics.
- **Seamless Live Switching:** Configure your `.env.local` keys to connect directly to your live Firebase project and Bunny.net library!

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (Optional for Live Mode)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Firebase and Bunny.net credentials:
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, etc.
- `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_CDN_HOSTNAME`, `BUNNY_TOKEN_SECURITY_KEY`

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🔒 Security Rules & Cloud Functions

- **Firestore Rules:** Deploy `firestore.rules` using the Firebase CLI (`firebase deploy --only firestore:rules`).
- **Cloud Functions:** Deployed from `functions/` via `firebase deploy --only functions`.

---

## 📂 Project Structure

```
ottweb/
├── app/
│   ├── (auth)/
│   │   └── login/                  # Email/Password + 2FA Login
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + Topbar shell
│   │   ├── page.tsx                # Dashboard Overview with Recharts
│   │   ├── movies/page.tsx         # Movies catalog & Bunny video uploader
│   │   ├── series/page.tsx         # Series -> Seasons -> Episodes drilldown
│   │   ├── podcasts/page.tsx       # Podcasts & Audio Episodes
│   │   ├── banners/page.tsx        # Hero Carousel builder with live preview
│   │   ├── plans/page.tsx          # Subscription tiers & active subscribers
│   │   ├── users/page.tsx          # Users directory & multi-device inspector
│   │   ├── admins/page.tsx         # Admin user management & RBAC matrix
│   │   └── settings/page.tsx       # Bunny & CDN API diagnostics
│   └── api/
│       ├── bunny/upload/           # Signed video upload session creator
│       ├── bunny/webhook/          # Bunny transcoding completion webhook
│       └── bunny/token/            # Signed playback token generator
├── components/
│   ├── ui/                         # Buttons, Modals, Badges, Tabs
│   ├── sidebar.tsx                 # Cinematic dark sidebar
│   ├── header.tsx                  # Search & quick actions header
│   ├── bunny-uploader.tsx          # Direct Bunny Stream/Storage uploader
│   └── stats-card.tsx              # KPI metric cards
├── lib/
│   ├── firebase.ts                 # Firebase client SDK
│   ├── firebase-admin.ts           # Firebase server Admin SDK
│   ├── firestore-service.ts        # Data layer with Live & Demo fallback
│   ├── bunny-service.ts            # Bunny Stream, Storage & CDN client
│   ├── mock-data.ts                # Pre-populated streaming catalog
│   ├── types.ts                    # TypeScript data models
│   └── auth-context.tsx            # Role authentication context
├── functions/                      # Firebase Cloud Functions backend
│   └── src/index.ts
├── firestore.rules                 # Strict RBAC security rules
└── tailwind.config.ts              # Dark theme design system
```
