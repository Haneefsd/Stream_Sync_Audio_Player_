# StreamSync Audio Player 🎵

A lightweight, high-performance music player aggregator designed for seamless audio playback across multiple streaming sources (**JioSaavn**, **YouTube / YouTube Music**, and **Spotify metadata**).

The application runs entirely **stateless**—requiring zero databases, no user authentication, and no persistent server-side storage.

---

## 📌 Key Features

* **Multi-Source Aggregation:** Unified search across JioSaavn and YouTube / YouTube Music.
* **Direct High-Fidelity Audio:** Streams directly up to **320 kbps** from native CDN sources (JioSaavn) and piped audio streams (YouTube).
* **Zero Database:** Favorites, liked songs, custom playlists, queue, and listening history live entirely on the client side via browser `localStorage`.
* **No Login / Auth Walls:** Instant playback without account registration, API tokens, or OAuth flows.
* **Smart Spotify Metadata Resolver:** Paste any Spotify track, playlist, or album link to instantly resolve tracks into playable 320 kbps streams.
* **Synchronized Lyrics:** Live real-time scrolling and timestamped lyrics synced with playback.
* **Real-time Audio Spectrum Visualizer:** Interactive Web Audio API frequency spectrum canvas visualizer.
* **MediaSession API Integration:** Full controls on OS lock screen, media keys, and Bluetooth headsets.
* **Responsive Modern UI:** Deep dark obsidian theme with glowing glassmorphism and fluid animations.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
│  ┌──────────────────┐  ┌────────────────┐  ┌─────────────┐  │
│  │ UI & Controls    │  │ Web Audio API  │  │ localStorage│  │
│  │ (React + Vite)   │  │ (Visualizer)   │  │ (Playlists) │  │
│  └────────┬─────────┘  └───────▲────────┘  └─────────────┘  │
└───────────┼────────────────────┼────────────────────────────┘
            │                    │
            ▼                    │
┌────────────────────────────────┴────────────────────────────┐
│                  Stateless Backend Engine                   │
│                                                             │
│   ├── /api/search      -> Queries JioSaavn & YouTube        │
│   ├── /api/trending    -> Top Charts & Featured Music       │
│   ├── /api/stream      -> YouTube Audio Chunk Pipeline      │
│   ├── /api/resolve     -> Spotify Metadata to Stream Mapper │
│   └── /api/lyrics      -> Synced & Plain Lyrics Provider    │
└───────────┬─────────────────────────────────────────────────┘
            │
            ├───────────────► JioSaavn CDN (Direct 320kbps Stream)
            ├───────────────► YouTube Media Servers (Piped Chunks)
            ├───────────────► Spotify Web API (Public Metadata)
            └───────────────► LRCLIB (Open Lyrics Provider)
```

---

## 🚀 API Endpoints

### 1. Unified Search
* **Endpoint:** `GET /api/search`
* **Query Params:** `q` (search term), `source` (`all` | `jiosaavn` | `youtube`), `limit` (number)

### 2. Trending & Top Charts
* **Endpoint:** `GET /api/trending`
* **Query Params:** `language` (e.g. `hindi,english,punjabi`)

### 3. YouTube Audio Stream Pipeline
* **Endpoint:** `GET /api/stream`
* **Query Params:** `id` (YouTube Video ID)
* **Features:** Supports HTTP Byte-Range requests for seeking in browser `<audio>` element.

### 4. Spotify Metadata Resolver
* **Endpoint:** `GET /api/resolve`
* **Query Params:** `url` or `trackId` (Spotify URL or URI)

### 5. Synchronized Lyrics
* **Endpoint:** `GET /api/lyrics`
* **Query Params:** `title`, `artist`, `duration`

---

## 🛠️ Quick Start & Running Locally

### 1. Start the Backend Server
```bash
cd server
npm install
npm start
```
*Backend runs on `http://localhost:5000`*

### 2. Start the Frontend Client
```bash
cd client
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`*

---

## 📂 Project Structure

```text
audio_Player/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/       # Sidebar, Header, PlayerBar, FullscreenPlayer, TrackCard, etc.
│   │   ├── context/          # AudioPlayerContext (Playback engine, Web Audio API visualizer)
│   │   ├── services/         # StorageService (localStorage), ApiService
│   │   ├── utils/            # Formatters, stream builders
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css         # Glassmorphic Design System
│   ├── vite.config.js
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── controllers/      # Search, stream, resolve, lyrics controllers
│   │   ├── routes/           # Express API router
│   │   ├── services/         # JioSaavn (320k), YouTube, Spotify, Lyrics services
│   │   └── app.js            # Express app entry
│   └── package.json
│
└── README.md
```