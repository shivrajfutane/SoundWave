# 🎵 Soundwave

A premium, Spotify-inspired music streaming web application built with **Next.js 15**, featuring dual audio sources (Jamendo & YouTube), real-time lyrics, and a fully immersive UI.

![Soundwave](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs) ![Supabase](https://img.shields.io/badge/Supabase-Auth-3ecf8e?logo=supabase) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06b6d4?logo=tailwindcss) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)

---

## ✨ Features

### 🎧 Audio Playback
- **Dual-source audio**: Streams free tracks from **Jamendo** and official audio from **YouTube** (via YouTube IFrame API)
- **YouTube IFrame Player API**: Stable, singleton player — no iframe reloads on pause/resume
- **Howler.js** for Jamendo tracks — low-latency, browser-compatible audio
- **Playback controls**: Play, Pause, Skip Next/Previous, Seek, Volume, Mute
- **Modes**: Shuffle and Repeat (Off / Repeat All / Repeat One)
- **Keyboard shortcuts**: `Space` = play/pause, `→/←` = skip, `↑/↓` = volume

### 🔍 Discovery & Search
- Search across Jamendo (free tracks) and YouTube (mainstream music)
- Smart YouTube search with `videoEmbeddable=true` and `videoSyndicated=true` filters to avoid restricted VEVO tracks
- Trending/featured tracks on the Discovery page

### 📄 Lyrics
- **Perfectly synced lyrics** powered by [LRCLIB](https://lrclib.net) — millisecond-accurate timestamps
- Click any lyric line to instantly jump to that point in the song
- Graceful fallback to plain text lyrics or "No lyrics found" with a Google search button
- Synced status indicator (🟢 Perfectly synced / 🟡 Estimated timing)

### 🖥️ UI & Experience
- **Immersive Now Playing overlay** — full-screen with blurred album art background, progress slider, and lyrics preview
- **Lyrics Overlay** — full-screen karaoke-style with auto-scrolling and glowing active line
- **Persistent mini player** — stays visible at the bottom at all times, slides out when full-screen views open
- **Animated sidebar** with active route tracking and library management
- **Mobile-responsive** with a bottom nav bar and swipe-friendly layouts
- **Framer Motion** animations throughout — spring physics, page transitions, and micro-interactions
- **Branded overlays** with the Soundwave logo pill in full-screen views

### 👤 Auth & Library
- **Supabase Auth** — Google OAuth + Magic Link sign-in
- **Liked Songs**: Save and manage your favourite tracks (persisted per user)
- **Recently Played**: Automatically tracked listening history
- **Custom Playlists**: Create, name, and add tracks to playlists
- **User Profile page** with stats and listening history

### 🛤️ Track Pages
- Dedicated `/track/[id]` pages for each song with full metadata

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Animations | Framer Motion |
| State | Zustand |
| Auth & DB | Supabase |
| Audio (Free tracks) | Howler.js + Jamendo API |
| Audio (Mainstream) | YouTube IFrame Player API |
| Lyrics | LRCLIB API |
| Icons | Lucide React |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/shivrajfutane/SoundWave.git
cd SoundWave
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your keys:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `NEXT_PUBLIC_YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `NEXT_PUBLIC_JAMENDO_CLIENT_ID` | Jamendo API client ID |

### 3. Set up the database

Run the schema in your Supabase SQL editor:

```bash
# The schema is in supabase_schema.sql
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/              # Authenticated app layout
│   │   ├── discovery/      # Home / Discovery page
│   │   ├── search/         # Search page
│   │   ├── library/        # Liked Songs & Playlists
│   │   ├── profile/        # User profile
│   │   └── track/[id]/     # Individual track page
│   └── auth/callback/      # Supabase OAuth callback
├── components/
│   ├── layout/             # App shell, Player, Sidebar, Overlays
│   └── ui/                 # Reusable UI components
└── lib/
    ├── store/              # Zustand stores (player, library, ui)
    ├── search.ts           # Unified Jamendo + YouTube search
    ├── jamendo.ts          # Jamendo API client
    ├── lyrics.ts           # LRCLIB lyrics fetcher
    └── supabase/           # Supabase client helpers
```

---

## 🔑 API Keys

- **Supabase**: [supabase.com](https://supabase.com) — free tier available
- **YouTube Data API v3**: [console.cloud.google.com](https://console.cloud.google.com)
- **Jamendo**: [developer.jamendo.com](https://developer.jamendo.com) — free tier available

---

## 📦 Deployment

Deploy to Vercel in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/shivrajfutane/SoundWave)

Remember to add all environment variables in your Vercel project settings.

---

## 📋 Changelog

### Latest
- ✅ Switched lyrics engine to **LRCLIB** for perfectly synced, millisecond-accurate lyrics
- ✅ Added **click-to-seek** on lyrics lines
- ✅ Fixed YouTube playback stopping when opening full-screen overlays
- ✅ Added **Soundwave brand logo** to Lyrics and Now Playing overlays
- ✅ Implemented official **YouTube IFrame Player API** to fix audio/sound issues
- ✅ Added `videoEmbeddable` filter to YouTube search to avoid restricted VEVO videos
- ✅ Keyboard shortcut support for playback control
- ✅ Supabase Auth integration (Google OAuth + Magic Link)
- ✅ Custom Playlist creation and management
- ✅ Individual track pages at `/track/[id]`

---

## 📄 License

MIT © [Shivraj Futane](https://github.com/shivrajfutane)
