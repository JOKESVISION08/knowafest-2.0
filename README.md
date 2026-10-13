<div align="center">

# 🎓 KnowaFest 2.0 — TechFest Nexus Connect
### Real-Time College Technical Symposium Intelligence Platform & Mobile PWA

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase_13-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

<p align="center">
  <b>A production-grade Progressive Web Application (PWA) tracking 50+ real-time college technical symposiums, hackathons, and national conferences across Tamil Nadu districts with cloud database synchronization, offline persistence, and automatic over-the-air updates.</b>
</p>

[Live Demo](https://knowafest-2-0-mkkv064pv-d-square.vercel.app) • [GitHub Repository](https://github.com/JOKESVISION08/knowafest-2.0) • [Architecture](#-system-architecture) • [Key Features](#-key-features)

---

</div>

## 📌 Executive Summary

**KnowaFest 2.0** bridges the gap between collegiate event organizers and engineering students. Finding active, credible technical symposiums across regional engineering colleges (Anna University, PSG Tech, CIT, Sri Krishna, Bannari Amman, Kongu, Sairam, etc.) is traditionally fragmented. 

This platform aggregates verified events with direct registration links, enables district-wise monthly filtering, provides cross-device bookmarking via Firebase Cloud Firestore & Authentication, and functions as an installable standalone mobile app with offline access and automatic background updates.

---

## 🚀 Key Features

### 1. 🎯 Live Symposium Aggregation & Direct Event Routing
- **Verified Event Directory**: Curates 50+ live collegiate technical symposiums categorized by engineering streams (CSE, IT, ECE, Mech, Civil, AI/DS).
- **Direct Link Navigation**: Clicking "View Details" takes students directly to the official KnowaFest event page with no intermediary dead links or broken redirects.
- **Deep Search & Filters**: Search by college name, city/district, event category (Symposium, Hackathon, Workshop), or registration fee (Free / Paid).

### 2. 📍 District-Wise & Monthly Intelligent Partitioning
- **Geographic Partitioning**: Categorizes events across all Tamil Nadu educational hubs (Chennai, Coimbatore, Erode, Salem, Namakkal, Trichy, Tirunelveli, Vellore, Madurai, etc.).
- **Monthly Timeline**: Organizes events into structured monthly cohorts.
- **REST API (`/api/events/monthly-district`)**: Built-in backend endpoint returning real-time district-wise groupings with query filters (`?district=Chennai&month=oct`).

### 3. 🔐 Firebase Cloud Integration (`knowafest-d330f`)
- **Dual Authentication**: Google OAuth login + instant Guest Student authentication.
- **User Profile Synchronization**: Automatically records user profile data (`uid`, `email`, `displayName`, `lastSignInTime`, `device`) into Cloud Firestore `users` collection.
- **Real-Time Cross-Device Bookmarks**: Saved symposiums are synced to Cloud Firestore with instantaneous fallback to local storage for offline continuity.
- **Dual Database Architecture**: Cloud Firestore + Firebase Realtime Database integration with automated network resilience.

### 4. 📱 Progressive Web App (PWA) & Zero-Touch Auto-Update
- **Mobile Native Feel**: Installable on Android & iOS homescreens as a standalone app with customized splash screens, app manifests, and theme headers.
- **Zero-Touch Over-The-Air Updates**: Installed mobile applications automatically check for updates on app launch and every 5 minutes in the background using Workbox Service Worker (`skipWaiting` and `clientsClaim`).
- **Offline First**: Workbox caching guarantees access to previously loaded symposiums, bookmarks, and UI assets without an active internet connection.

---

## 🛠️ Tech Stack & Engineering Specifications

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite 8, React DOM |
| **Styling & Design System** | Tailwind CSS v4, Lucide React, Motion (Framer Motion) |
| **Backend & Server** | Node.js, Express, TSX, Serverless Functions (Vercel & Netlify) |
| **Database & Cloud Auth** | Google Firebase 13 (Cloud Firestore, Realtime Database, Firebase Auth) |
| **Offline & PWA** | Vite-Plugin-PWA, Workbox v7, Service Workers, Cache Storage API |
| **Web Scraping & Proxy** | Cheerio, Node Fetch, Custom TLS bypass middleware |
| **Deployment & CI/CD** | Vercel (Edge Network), GitHub Actions & Webhooks |

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│  React 19 SPA  •  PWA Standalone App  •  Tailwind CSS v4    │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Firebase Cloud          │ │       Backend Server       │
│  • Google OAuth / Guest Auth │ │  • Express / Vercel API    │
│  • Firestore: users          │ │  • District REST API       │
│  • Firestore: savedEvents    │ │  • KnowaFest Live Proxy    │
│  • Firestore: monthly_dist   │ │  • Cheerio HTML Parser     │
└──────────────────────────────┘ └────────────────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Local Persistence       │ │    External Integrations   │
│  • IndexedDB / CacheStorage  │ │  • KnowaFest Official CDN  │
│  • LocalStorage Bookmarks    │ │  • College Symposium Portals│
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 📂 Project Structure

```bash
knowafest-2.0/
├── api/                           # Vercel serverless API routes
│   ├── index.ts                   # Universal API router
│   └── knowafest/                 # Endpoints (live-events, event-details, portal)
├── public/                        # Static assets, PWA icons & manifest
│   ├── icon.svg
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
├── src/
│   ├── components/                # Modular UI components
│   │   ├── AuthUserButton.tsx     # Firebase Google & Guest sign-in modal
│   │   ├── KnowaFestLivePortal.tsx# Core symposium explorer & filter engine
│   │   ├── Navbar.tsx             # Responsive header with navigation controls
│   │   ├── OfflineIndicator.tsx   # Network status monitor
│   │   ├── ReloadPrompt.tsx       # Over-the-air PWA update prompt
│   │   └── SavedEventsModal.tsx   # Cross-device bookmark manager
│   ├── data/
│   │   ├── curatedEvents.ts       # Verified 50+ college symposium records
│   │   └── initialData.ts         # District mappings & default constants
│   ├── firebase/
│   │   ├── authService.ts         # User auth, sync profile, redirect handling
│   │   ├── config.ts              # Firebase client SDK initialization
│   │   ├── firestoreService.ts    # Monthly district sync & bookmark operations
│   │   └── rtdbService.ts         # Realtime Database synchronization
│   ├── hooks/                     # Custom React hooks (PWA install, online state)
│   ├── services/                  # KnowaFest scraping & proxy services
│   ├── App.tsx                    # Root application component
│   └── main.tsx                   # Service worker registration & bootloader
├── firestore.rules                # Cloud Firestore security rules
├── server.ts                      # Express local development & API server
├── vercel.json                    # Edge routing, zero-cache SW headers & rewrites
└── vite.config.ts                 # Vite bundler & Workbox PWA configuration
```

---

## 💻 Quick Start & Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**

### Installation
```bash
# 1. Clone repository
git clone https://github.com/JOKESVISION08/knowafest-2.0.git
cd knowafest-2.0

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

The application will be live at `http://localhost:3000`.

### Production Build
```bash
npm run build
npm run preview
```

---

## 📄 Resume Project Highlights

Feel free to adapt these bullet points for your resume:

- **Built KnowaFest 2.0**: Developed an end-to-end collegiate event intelligence platform using **React 19**, **TypeScript**, and **Tailwind CSS**, aggregating **50+ verified college symposiums** across Tamil Nadu.
- **Architected Cloud Persistence**: Integrated **Firebase Authentication** (Google OAuth & Guest Auth) and **Cloud Firestore**, engineering real-time data synchronization for user profiles, district-partitioned events, and cross-device bookmarks.
- **Implemented Mobile PWA with Zero-Touch Updates**: Configured **Vite-Plugin-PWA** with Workbox Service Workers (`skipWaiting`, `clientsClaim`), enabling offline access, app installability, and automatic background updates upon Vercel deployment.
- **Engineered Resilient Scraping Engine**: Designed Node.js / Express proxy endpoints using **Cheerio** with custom TLS negotiation to fetch live symposium data and parse event schemas.

---

## 👨‍💻 Author & Contributions

- **Developer**: Jokesun ([@JOKESVISION08](https://github.com/JOKESVISION08))
- **Repository**: [https://github.com/JOKESVISION08/knowafest-2.0](https://github.com/JOKESVISION08/knowafest-2.0)
- **License**: MIT

