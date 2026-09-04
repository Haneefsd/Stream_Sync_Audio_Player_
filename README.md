# StreamSync Audio Player 🎵

> 🌐 **Live Application:** [https://stream-sync-audio-player.onrender.com](https://stream-sync-audio-player.onrender.com)

**StreamSync** is a high-performance, stateless music player and audio streaming web application engineered for instant, high-fidelity music playback. Built with a modern **React + Vite** frontend and an ultra-lightweight **Express** backend, it delivers instant music streaming with zero login walls, zero user tracking, and zero database requirements.

---

## 📑 Table of Contents
1. [Key Highlights & Features](#-key-highlights--features)
2. [System Architecture & Data Flow](#-system-architecture--data-flow)
3. [Deep-Dive Feature Breakdown](#-deep-dive-feature-breakdown)
   - [Seamless Audio Playback Engine & Queue Management](#1-seamless-audio-playback-engine--queue-management)
   - [Dedicated Full-Page Playlist Management](#2-dedicated-full-page-playlist-management)
   - [Dedicated Liked Songs Hub](#3-dedicated-liked-songs-hub)
   - [Advanced Search & History Engine](#4-advanced-search--history-engine)
   - [Smart Recommendation & Dynamic Trending Mix](#5-smart-recommendation--dynamic-trending-mix)
   - [Fullscreen Visualizer & Synchronized Lyrics](#6-fullscreen-visualizer--synchronized-lyrics)
   - [Mobile-First Responsive Dock & Auto-Minimizing Navigation](#7-mobile-first-responsive-dock--auto-minimizing-navigation)
   - [Curated Vibrant Theme & Glassmorphism](#8-curated-vibrant-theme--glassmorphism)
4. [Data Models & Schema Specifications](#-data-models--schema-specifications)
5. [REST API Documentation](#-rest-api-documentation)
6. [Installation & Setup Guide](#-installation--setup-guide)
7. [Production Build & Deployment](#-production-build--deployment)
8. [Comprehensive Directory Tree](#-comprehensive-directory-tree)
9. [Keyboard Shortcuts & Touch Gestures](#-keyboard-shortcuts--touch-gestures)
10. [Troubleshooting & FAQ](#-troubleshooting--faq)
11. [Privacy & License](#-privacy--license)

---

## 🌟 Key Highlights & Features

* 🚀 **Zero Database & 100% Stateless:** No MongoDB, PostgreSQL, or Redis required. Playlists, favorites, listening history, search history, and player settings are stored securely in browser `localStorage`.
* ⚡ **Instant Client-Side Streaming:** Powered by an embedded headless player engine that bypasses proxy bottlenecks, eliminates CORS errors, and supports hardware-accelerated playback.
* 📱 **Mobile-First App Experience & Docked Navigation:** Features a fixed Spotify-style bottom navigation bar (`MobileBottomNav.jsx`) with 5 dedicated tabs (`Home`, `Search`, `Your Library`, `Liked Songs`, `Create`) paired with a rock-solid, non-jumping mini player bar docked directly above it.
* 🔽 **Auto-Minimizing Visualizer on Bottom Actions:** When the visualizer or lyrics view is open in mobile mode, tapping any bottom navigation button or tapping the mini-player bar automatically minimizes the visualizer and switches to the destination view.
* 🔢 **Intelligent Queue Display ("Songs to be Played"):** The queue button badge and queue drawer header dynamically calculate and display only the upcoming songs remaining to be played (`queue.length - 1 - currentIndex`), rather than historical played tracks.
* ⚡ **Real-Time Playlist-to-Queue Sync:** Adding tracks to the playlist currently playing immediately updates the active playback queue on-the-fly without needing to reload or restart playback.
* ➕ **In-Visualizer "Add to Playlist" Option:** Easily add the currently playing song to any custom playlist directly from within the visualizer using the dedicated `FolderPlus` symbol. The library selection modal opens seamlessly over the visualizer.
* 🌊 **Adjusted 360° Circular Vinyl Visualizer & Frequency Canvas:** Scaled perfectly for mobile screens (`min(28vh, 215px)`) with real-time Web Audio API spectrum bars, song metadata, and seek bar positioned cleanly above the docked bottom bars with zero clipping.
* 🔄 **Non-Stop Logo Page Refresh:** Clicking the **StreamSync logo** in the header or sidebar resets and refreshes the application view to the home feed while **audio playback continues uninterrupted in the background**.
* 📑 **Dedicated Full-Page Playlist Views:** Playlists open as comprehensive standalone pages (`PlaylistView.jsx`) with custom cover uploads, 1st-song artwork fallback, and in-page song search.
* 💖 **Dedicated "Liked Songs" Panel:** An isolated, private favorites panel with one-click **Play All**, **Shuffle**, and real-time title/artist search filtering.
* 🔀 **Personalized & Randomized Recommendations:** Deeply aggregates past search queries and listening history, sampling topics in parallel and applying a **Fisher-Yates shuffle** for a fresh mix upon every refresh.
* 🎤 **Synchronized Timestamped Lyrics:** Auto-scrolling, line-by-line synced lyrics powered by LRCLIB with click-to-seek functionality.
* 🛡️ **Context-Aware Action Guards:** A global, smart confirmation modal protects all destructive or critical actions (playlist deletion, playlist creation, track removal) with contextual warnings.
* 🎨 **Curated Vibrant Glassmorphic UI:** Deep obsidian theme featuring **Electric Indigo**, **Emerald Green**, **Mint Cyan**, and **Sunset Amber** with a strict **Zero Pink Guarantee**.

---

## 🏗️ System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT (React 18 + Vite)                                │
│                                                                                        │
│  ┌───────────────────────┐   ┌────────────────────────┐   ┌─────────────────────────┐  │
│  │    UI Components      │   │  AudioPlayerProvider   │   │   localStorage Service  │  │
│  │  (Home, Search,       │   │  (Headless Streaming,  │   │  (Playlists, Favorites, │  │
│  │   Library, Playlists, │◄─►│   Auto-next track,     │◄─►│   History, Search Cache,│  │
│  │   Liked, Fullscreen,  │   │   MediaSession API,    │   │   Playback Settings,    │  │
│  │   MobileBottomNav)    │   │   Immediate Queue Sync)│   │   Real-time events)     │  │
│  └───────────┬───────────┘   └───────────┬────────────┘   └─────────────────────────┘  │
└──────────────┼───────────────────────────┼─────────────────────────────────────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────────┐   ┌─────────────────────────────────────────────────────┐
│   Express Stateless Server   │   │                High-Fidelity Audio                  │
│   (Port 5000)                │   │                                                     │
│                              │   │   Direct client-side media stream                   │
│  ├── /api/search             │   │   with zero proxy buffering & zero CORS drops       │
│  ├── /api/trending           │   └─────────────────────────────────────────────────────┘
│  └── /api/lyrics             │
└──────────────┬───────────────┘
               │
               ├──────────────────► Official YouTube Data API v3 (Fast Primary Provider)
               ├──────────────────► High-Speed Scraper Engine (Automatic Quota Fallback)
               └──────────────────► LRCLIB API (Timestamped Synced & Plain Lyrics)
```

---

## 🔍 Deep-Dive Feature Breakdown

### 1. Seamless Audio Playback Engine & Queue Management
* **Headless Streaming Integration:** Integrates the YouTube IFrame API headlessly via `AudioPlayerProvider.jsx`. This guarantees zero media-server load on your backend and full access to CDN-cached audio streams.
* **Continuous Auto-Play (Sequential & Shuffle):** Listens to track completion events (`YT.PlayerState.ENDED`) and seamlessly triggers `handleNextTrack()`, advancing through the queue or playlist automatically.
* **Intelligent "Songs to be Played" Queue Counter:**
  * The queue icon in the header displays a live counter badge: `songsToBePlayed = currentIndex >= 0 ? Math.max(0, queue.length - 1 - currentIndex) : queue.length`.
  * The slide-out `QueueDrawer.jsx` clearly lists `Up Next ({upNextList.length} to be played)` and titles the drawer with the exact remaining track count.
* **Instant Playlist-to-Queue Synchronization:** When adding or removing tracks in the playlist currently being streamed, `storage.js` broadcasts a custom `playlist_updated` event that `AudioPlayerProvider` captures, updating the active queue instantaneously without disrupting audio.
* **Persistent Settings:** Volume levels, preferred quality, shuffle toggle, and 3-state repeat modes (`off`, `all`, `one`) are saved to `localStorage` and restored across browser sessions.
* **MediaSession API Support:** Hooks directly into your operating system's native media notification center. Track artwork, title, artist, seek bars, and play/pause controls function from locked screens, notifications, and Bluetooth headsets.
* **Non-Stop Logo Page Refresh:** Clicking the StreamSync brand logo triggers `refreshPage()`. It increments `pageRefreshKey`, resets modals, closes drawers, clears search filters, and loads fresh recommendations without interrupting `currentTrack` or pausing audio playback.

### 2. Dedicated Full-Page Playlist Management
* **Dedicated Standalone Views (`PlaylistView.jsx`):** Instead of popup dialogs, selecting a playlist opens a dedicated full-page experience with hero artwork, stats (track count, total duration, creation date), and an action bar.
* **Custom Artwork Management:**
  * **Device Upload:** Select image files from your computer; they are instantly encoded as base64 data URLs via `FileReader` and saved to `localStorage`.
  * **Direct Image Link:** Paste any HTTP/HTTPS image URL.
  * **Automatic 1st Song Fallback:** If no custom image is provided, `storageService.getPlaylistCover()` automatically uses the album art of the first song in the playlist.
* **In-Page Song Search & Add:** Search for songs, artists, or acoustic covers directly within the playlist page. Click `+ Add` to append tracks to the playlist instantly without leaving the view.
* **Full Tracklist Operations:** Play individual tracks, remove specific songs, trigger **Play All**, or start **Shuffle Play**.
* **Guarded Operations:** Context-aware confirmation modals intercept playlist deletion and modification attempts to prevent accidental data loss.

### 3. Dedicated Liked Songs Hub
* **Independent Panel (`LikedSongsView.jsx`):** Accessible from both desktop sidebar and mobile bottom navigation, this view is strictly reserved for user-favorited tracks.
* **Vibrant Indigo Branding:** Distinctive styling featuring an Electric Indigo and Royal Violet hero gradient banner with glowing heart iconography.
* **Real-Time Search Filtering:** Filter your liked songs collection instantly by title or artist.
* **One-Click Playback:** Batch-play all liked songs sequentially or in randomized shuffle mode.

### 4. Advanced Search & History Engine
* **Debounced Fast Search:** Triggers automatic queries as you type with a 300ms debounce interval, minimizing unnecessary network overhead.
* **Dual Responsive Input Architecture:**
  * Desktop uses the sticky global header search input.
  * Mobile devices dynamically display the StreamSync brand in the header, placing an inline search input inside `SearchView.jsx` (`.search-inpage-bar`) for optimal thumb reach.
* **Persistent Search Cache:** Cached search queries and full track result arrays are saved to `streamsync_last_search`. When switching tabs and returning to Search, your results remain preserved.
* **Individual Search Removal (`X` Button):** Each item in the "Previous Searches" list features a dedicated cross button to delete that specific search term from history.
* **Intelligent Fragment Consolidation:** Automatically replaces partial typing keystrokes (e.g. `y`, `y ra`, `y rath`) with the completed query (`y ratha`) to prevent history clutter.

### 5. Smart Recommendation & Dynamic Trending Mix
* **Deep User Taste Analysis:** `storageService.getPersonalizedHints()` analyzes all historical search queries, cached results, recently played tracks, and favorited artists into a unified taste profile.
* **Multi-Topic Parallel Sampling:** Samples 2-3 distinct topics from your profile, queries them in parallel via `Promise.allSettled`, and merges the results.
* **Fisher-Yates Shuffling:** Applies a randomized shuffle to the aggregated track array, guaranteeing a fresh and diverse set of tracks upon every reload.
* **Manual Refresh Button:** A sleek circular button (`RotateCw`) beside the "Trending Hits" title allows on-demand recommendation re-shuffling.
* **Clean Section Heading:** The shelf heading is kept clean and generic (**Trending Hits**) without exposing private search keywords in the title.

### 6. Fullscreen Visualizer & Synchronized Lyrics
* **Adjusted Mobile Layout:** Engineered to fit seamlessly above docked bottom controls without overflow or clipping:
  * Dynamic bottom padding: `calc(var(--mobile-nav-height) + var(--player-height-mobile) + 0.85rem)`.
  * Mobile vinyl diameter scaled to `min(28vh, 215px)` with centered glowing concentric rings.
  * Audio spectrum canvas (`height: 42px`, `max-width: 320px`) sits directly below the vinyl record.
  * Song title, artist, and seek bar sit cleanly above the mini player.
* **In-Visualizer "Add to Playlist":**
  * **Desktop Full Screen Mode:** The `FolderPlus` action button is cleanly positioned in the bottom playback control row beside Shuffle and Play buttons, keeping the top right clean with just the close (`X`) button.
  * **Mobile / Responsive Mode (`<= 768px`):** The `FolderPlus` button dynamically appears in the top right beside the close (`X`) button (since the bottom desktop controls are hidden on mobile), allowing one-tap library playlist selection over the visualizer without closing it.
* **Web Audio API Spectrum Analyser:** Extracts real-time frequency data into 64 frequency bins via an `AnalyserNode`, rendered on an HTML5 `<canvas>` with an emerald-to-cyan gradient waveform.
* **Line-by-Line Synchronized Lyrics:** Fetches timestamped lyrics from LRCLIB. Automatically scrolls the active line into view with smooth transitions and allows clicking any line to seek directly to that timestamp.

### 7. Mobile-First Responsive Dock & Auto-Minimizing Navigation
* **Dedicated Bottom Navigation Bar (`MobileBottomNav.jsx`):**
  * Displayed on viewports `<= 768px` at `bottom: 0`.
  * Provides 5 core tabs: **Home**, **Search**, **Your Library**, **Liked Songs**, and **Create** (`+`).
* **Auto-Minimizing Visualizer:** Tapping any button on the bottom navigation bar or tapping the mini-player track info immediately minimizes the visualizer/lyrics screen, bringing the user right to the requested view.
* **Rock-Solid Mini Player:** The mobile player bar (`PlayerBar.jsx`) is fixed directly above the bottom nav at `bottom: var(--mobile-nav-height)` (`60px`). It remains stable and stationary during scrolling, browsing, and tab switching.
* **Context-Guarded Playlist Creation:** Tapping the **Create** tab on the bottom bar triggers a confirmation modal to name and create a new playlist with one tap.

### 8. Curated Vibrant Theme & Glassmorphism
* **Modern Palette:** Built using curated colors tailored for high visual appeal:
  * **Electric Indigo:** `#6366f1` / `#4f46e5` (Liked Songs hero, active state highlights)
  * **Emerald Green:** `#10b981` (Primary accents, play buttons, sliders)
  * **Mint Cyan:** `#06b6d4` (Active lyrics, secondary highlights)
  * **Sunset Amber:** `#f59e0b` (Badges, warnings, secondary chips)
  * **Deep Obsidian Surface:** `#07090e` / `#0e131f` (Glassmorphic dark backgrounds)
* **Zero Pink Guarantee:** Completely free of pink or magenta tones throughout all components, SVGs, and stylesheets.

---

## 📊 Data Models & Schema Specifications

All client state is persisted in `localStorage` under specific, namespaced keys:

### 1. Track Schema
```typescript
interface Track {
  id: string;              // e.g. "track_Xukxjs9VYiI"
  originalId: string;      // Video ID e.g. "Xukxjs9VYiI"
  title: string;           // Song title
  artist: string;          // Artist or channel name
  album: string;           // Album name or "Single"
  duration: number;        // Track duration in seconds
  thumbnailUrl: string;    // High-resolution image URL
  source: "stream";        // Audio stream source
  savedAt?: string;        // ISO timestamp when favorited
  playedAt?: string;       // ISO timestamp when last played
}
```

### 2. Playlist Schema
```typescript
interface Playlist {
  id: string;              // Unique ID e.g. "pl_1725268400000"
  name: string;            // Playlist title
  description: string;     // Optional playlist description
  coverUrl: string;        // Base64 Data URL or direct HTTP URL (optional)
  createdAt: string;       // ISO timestamp
  tracks: Track[];         // Array of track objects in this playlist
}
```

### 3. Client Storage Keys (`localStorage`)
| Key | Type | Description |
| :--- | :--- | :--- |
| `streamsync_favorites` | `Track[]` | List of all favorited/liked tracks |
| `streamsync_playlists` | `Playlist[]` | Custom user-created playlists |
| `streamsync_history` | `Track[]` | Recently played tracks (capped at 50) |
| `streamsync_search_history` | `string[]` | List of past search keywords (capped at 30) |
| `streamsync_last_search` | `{ query, results, savedAt }` | Cached results of the most recent search |
| `streamsync_settings` | `Object` | Volume, quality, repeat mode, and shuffle state |

---

## 🚀 REST API Documentation

The backend server runs on port `5000` (or the configured `PORT` environment variable) and exposes clean REST endpoints:

### 1. Music Search
* **Endpoint:** `GET /api/search`
* **Query Parameters:**
  * `q` *(string, required)*: Search keyword (e.g. `Aditya Rikhari`, `Arijit Singh`, song name)
  * `limit` *(number, optional, default: 24)*: Maximum number of tracks to return
* **Sample Request:**
  ```http
  GET /api/search?q=Aditya%20Rikhari&limit=2
  ```
* **Sample JSON Response:**
  ```json
  {
    "query": "Aditya Rikhari",
    "count": 2,
    "results": [
      {
        "id": "track_Xukxjs9VYiI",
        "originalId": "Xukxjs9VYiI",
        "title": "Aditya Rikhari - NASAMAJH",
        "artist": "Aditya Rikhari",
        "album": "Single",
        "duration": 215,
        "thumbnailUrl": "https://i.ytimg.com/vi/Xukxjs9VYiI/hqdefault.jpg",
        "source": "stream"
      },
      {
        "id": "track_4k4n2g",
        "originalId": "4k4n2g",
        "title": "Aditya Rikhari - Samjho Na",
        "artist": "Aditya Rikhari",
        "album": "Single",
        "duration": 184,
        "thumbnailUrl": "https://i.ytimg.com/vi/4k4n2g/hqdefault.jpg",
        "source": "stream"
      }
    ]
  }
  ```

---

### 2. Dynamic & Randomized Trending Mix
* **Endpoint:** `GET /api/trending`
* **Query Parameters:**
  * `history` *(string, optional)*: Comma-separated list of past user search keywords/artists
  * `limit` *(number, optional, default: 24)*: Number of tracks to return
* **Sample Request:**
  ```http
  GET /api/trending?history=Aditya%20Rikhari,Anuv%20Jain,Arijit%20Singh&limit=24
  ```
* **Sample JSON Response:**
  ```json
  {
    "sectionTitle": "Trending Hits",
    "tracks": [
      {
        "id": "track_Xukxjs9VYiI",
        "originalId": "Xukxjs9VYiI",
        "title": "Aditya Rikhari - NASAMAJH",
        "artist": "Aditya Rikhari",
        "album": "Single",
        "duration": 215,
        "thumbnailUrl": "https://i.ytimg.com/vi/Xukxjs9VYiI/hqdefault.jpg",
        "source": "stream"
      }
    ]
  }
  ```

---

### 3. Synchronized Lyrics Resolver
* **Endpoint:** `GET /api/lyrics`
* **Query Parameters:**
  * `title` *(string, required)*: Track title
  * `artist` *(string, optional)*: Artist name
  * `duration` *(number, optional)*: Duration in seconds
* **Sample Request:**
  ```http
  GET /api/lyrics?title=NASAMAJH&artist=Aditya%20Rikhari&duration=215
  ```
* **Sample JSON Response:**
  ```json
  {
    "trackName": "NASAMAJH",
    "artistName": "Aditya Rikhari",
    "duration": 215,
    "syncedLyrics": [
      { "time": 14.2, "text": "Kyun itne sawal hain dil mein" },
      { "time": 18.6, "text": "Jo tu na mila toh kya milega" }
    ],
    "plainLyrics": "Kyun itne sawal hain dil mein..."
  }
  ```

---

## 🛠️ Installation & Setup Guide

### Prerequisites
* [Node.js](https://nodejs.org/) (version 18.x or higher recommended)
* `npm` (comes bundled with Node.js) or `yarn`

### 1. Clone the Repository
```bash
git clone https://github.com/Haneefsd/Stream_Sync_Audio_Player_.git
cd Stream_Sync_Audio_Player_
```

### 2. Configure Backend Environment
Create a `.env` file in the `server/` directory (you can copy `server/.env.example`):
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
PORT=5000
YOUTUBE_API_KEY=your_youtube_data_api_v3_key_here
```
> **Note:** If you don't provide an API key, the server automatically uses its built-in scraper fallback engine with zero setup required.

### 3. Install & Start Backend Server
```bash
cd server
npm install
npm start
```
*The backend server will start on `http://localhost:5000`.*

### 4. Install & Start Frontend Client
In a separate terminal window:
```bash
cd client
npm install
npm run dev
```
*The client dev server will start on `http://localhost:3000`.*

---

## 📦 Production Build & Deployment

To compile and produce optimized production bundles:

```bash
# Build the client for production
cd client
npm run build

# Preview the production build locally
npm run preview
```

The optimized build is saved in `client/dist/`. You can serve the static files using Nginx, Apache, or configure Express to serve `client/dist/` statically.

---

## 📂 Comprehensive Directory Tree

```text
Stream_Sync_Audio_Player_/
├── client/
│   ├── public/                  # Static assets & icons
│   ├── src/
│   │   ├── components/          # 15 Modular UI components
│   │   │   ├── AddToPlaylistModal.jsx   # Modal for adding tracks to custom playlists
│   │   │   ├── ConfirmationModal.jsx    # Context-aware safety dialog for destructive operations
│   │   │   ├── FullscreenPlayer.jsx     # 360° circle visualizer & synced lyrics mode with FolderPlus action
│   │   │   ├── Header.jsx               # Sticky search bar (desktop) / brand logo (mobile) & queue badge
│   │   │   ├── HomeView.jsx             # Hero banner, genre chips & trending hits
│   │   │   ├── LibraryView.jsx          # Playlists & Liked Songs management hub
│   │   │   ├── LikedSongsView.jsx       # Dedicated Liked Songs panel with batch actions
│   │   │   ├── MobileBottomNav.jsx      # Mobile docked navigation (Home, Search, Library, Liked, Create)
│   │   │   ├── PlayerBar.jsx            # Fixed audio controls, seekbar & responsive mobile controller
│   │   │   ├── PlaylistDetailModal.jsx  # Quick playlist modal viewer
│   │   │   ├── PlaylistView.jsx         # Standalone full-page playlist with in-page search
│   │   │   ├── QueueDrawer.jsx          # Slide-out playback queue with "songs to be played" count
│   │   │   ├── SearchView.jsx           # Persistent search results, history manager & mobile in-page search
│   │   │   ├── Sidebar.jsx              # Left desktop sidebar with interactive refresh logo
│   │   │   ├── TrackCard.jsx            # Grid track card with hover actions & dropdowns
│   │   │   └── TrackRow.jsx             # Table track row with animated equalizer
│   │   ├── context/
│   │   │   ├── AudioPlayerContext.jsx   # Context hook definition
│   │   │   ├── AudioPlayerProvider.jsx  # Playback engine, non-stop refresh & instant queue sync
│   │   │   ├── ConfirmationContext.jsx  # Confirmation modal hook definition
│   │   │   └── ConfirmationProvider.jsx # Global confirmation modal provider
│   │   ├── services/
│   │   │   ├── api.js                   # Client REST API consumer
│   │   │   └── storage.js               # Zero-DB client localStorage service & real-time events
│   │   ├── utils/
│   │   │   └── formatters.js            # Time & badge formatters
│   │   ├── App.jsx                      # Main app layout container & view router
│   │   ├── main.jsx                     # Vite React entry point
│   │   └── index.css                    # Design tokens, mobile dock & glassmorphic styling
│   ├── index.html                       # HTML5 entry with Outfit & Plus Jakarta fonts
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── resolveController.js     # Lyrics handler
│   │   │   └── searchController.js      # Search & trending recommendation controller
│   │   ├── routes/
│   │   │   └── api.js                   # Express route mapping (/api/*)
│   │   ├── services/
│   │   │   ├── lyricsService.js         # LRCLIB lyrics client
│   │   │   └── youtubeService.js        # YouTube Data API v3 & scraper fallback
│   │   └── app.js                       # Express bootstrap, CORS & middleware
│   ├── .env.example                     # Environment template
│   └── package.json
│
└── README.md
```

---

## ⌨️ Keyboard Shortcuts & Touch Gestures

| Key / Action | Context | Function |
| :--- | :--- | :--- |
| **Spacebar** | Global | Toggle Play / Pause |
| **Media Play / Pause** | Hardware | Hardware Play / Pause on keyboard or Bluetooth headset |
| **Media Track Next** | Hardware | Skip to next track in queue or playlist |
| **Media Track Previous**| Hardware | Skip to previous track |
| **Click Logo** | Header / Sidebar | Soft-refresh application to Home without interrupting music |
| **Click Lyrics Line** | Fullscreen Player | Seek playback directly to that lyric timestamp |
| **Click Cover Art / Title** | Player Bar | Expand or minimize Fullscreen Visualizer & Lyrics |
| **Tap Bottom Nav Tab** | Mobile | Switch view and automatically minimize visualizer if open |
| **Tap FolderPlus Icon**| Visualizer (Bottom on Desktop, Top Bar on Mobile)| Add currently playing track to any playlist instantly |

---

## ❓ Troubleshooting & FAQ

#### 1. Music stops or will not play?
- Browsers require an initial user gesture before playing audio. Click any track card or the play button to initiate playback.
- If you have an ad blocker blocking YouTube embeds, add an exception for `localhost:3000`.

#### 2. YouTube API Quota Exceeded?
- The backend features an automatic, seamless **fallback scraper engine**. If your Google Cloud API key quota is exhausted, StreamSync automatically routes searches through the scraper with zero downtime.

#### 3. How does the Queue count work?
- The queue badge displays only the upcoming songs that are scheduled to be played next (`queue.length - 1 - currentIndex`). Tracks that have already been played are excluded from the count.

#### 4. How does the mobile bottom navigation interact with the visualizer?
- When the visualizer is open, tapping any of the 5 bottom navigation tabs (**Home**, **Search**, **Your Library**, **Liked Songs**, **Create**) automatically minimizes the visualizer and takes you immediately to that screen.

---

## 🔒 Privacy Policy
StreamSync is completely **stateless**. We do not collect, store, or sell any personal data, IP addresses, search keywords, or listening habits. All playlists, favorited songs, search history, and settings are preserved strictly within your local browser's storage.

---

## 📄 License
This project is open-source and licensed under the **[MIT License](LICENSE)**.