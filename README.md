# StreamSync Audio Player 🎵

**StreamSync** is a high-performance, stateless music player and aggregator web application designed for high-fidelity audio playback. Built with a modern **React + Vite** frontend and an ultra-lightweight **Express** backend, it delivers instant music streaming with zero login walls and zero databases.

---

## 🌟 Key Highlights & Features

### 🎧 Seamless Playback Engine
* **Instant Client-Side Streaming:** Powered by a headless audio engine ensuring zero CORS errors, fast loading, and hardware-accelerated playback.
* **Continuous Auto-Play:** Automatically and seamlessly transitions to the next track in your playlist or queue when a song finishes.
* **Full Playback Controls:** Play/Pause, Next/Previous, Seek Bar, Volume slider, Mute toggle, Shuffle, and 3-state Repeat modes (`off`, `all`, `one`).
* **MediaSession API Integration:** Full integration with OS lock screens, notifications, media keyboards, and Bluetooth accessories.

### 📚 Zero Database, 100% Client-Side Persistence
* **No Database Required:** Everything runs stateless—no SQL, no MongoDB, and no accounts needed.
* **Custom Playlists with Photo Support:**
  * Create, manage, and delete custom playlists.
  * **Custom Cover Art:** Upload an image directly from your device or paste any image URL.
  * **Smart 1st Song Cover Fallback:** If no custom photo is added, the playlist automatically uses the album artwork of its 1st track.
* **Dedicated "Liked Songs" Panel:** A private collection showing strictly your favorited tracks with *Play All*, *Shuffle*, and in-panel search.
* **Central "Your Library" Hub:** View all custom playlists and your Liked Songs collection side by side.
* **Persistent Search Results:** Search results and active search queries are saved locally, ensuring your search results stay preserved when switching tabs.

### 🔥 Dynamic & Personalized Discovery
* **Personalized Recommendations:** Dynamically tailors trending songs on the homepage based on your past search history and favorite artists.
* **Rotating Trending Mixes:** Rotates through diverse themes on page refresh (*Top Viral Chartbusters*, *Indie & Acoustic Essentials*, *Bollywood Hits*, *Global Pop*, *Lo-Fi Beats*, *Punjabi Waves*).
* **Mood & Genre Filters:** Instant one-click chips to explore specific genres and artist essentials.

### 🎤 Synchronized Lyrics & Fullscreen Visualizer
* **Timestamped Synced Lyrics:** Real-time auto-scrolling lyrics synchronized with current playback (powered by LRCLIB).
* **Interactive Audio Spectrum Visualizer:** Real-time canvas frequency spectrum visualizer with animated spinning vinyl cover art.

### 🎨 Modern Vibrant Aesthetics
* **Decent, Vibrant Theme:** Curated palette featuring **Electric Indigo**, **Emerald Green**, **Mint Cyan**, and **Sunset Amber** with obsidian dark glassmorphism.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client (React + Vite)                         │
│                                                                         │
│  ┌───────────────────────┐  ┌────────────────────┐  ┌────────────────┐  │
│  │   UI & Navigation     │  │   Playback Engine  │  │  localStorage  │  │
│  │  (Home, Search,       │  │ (Auto-play next,   │  │ (Playlists,    │  │
│  │   Library, Liked)     │  │  MediaSession API) │  │  Favorites)    │  │
│  └───────────┬───────────┘  └──────────┬─────────┘  └────────────────┘  │
└──────────────┼─────────────────────────┼────────────────────────────────┘
               │                         │
               ▼                         ▼
┌──────────────────────────────┐  ┌───────────────────────────────────────┐
│   Express Stateless Backend  │  │        High-Fidelity Audio            │
│                              │  │                                       │
│  ├── /api/search             │  │   Direct client-side streams          │
│  ├── /api/trending           │  │   with zero proxy buffering           │
│  └── /api/lyrics             │  └───────────────────────────────────────┘
└──────────────┬───────────────┘
               │
               ├───────────────► Official Data API v3 / Scraper Fallback
               └───────────────► LRCLIB (Synchronized Lyrics)
```

---

## 🚀 API Documentation

The backend operates on port `5000` (or specified `PORT` in `.env`) providing clean JSON REST endpoints:

### 1. Music Search
* **Endpoint:** `GET /api/search`
* **Query Parameters:**
  * `q` (required): Search keyword (e.g. `Aditya Rikhari`, `Taylor Swift`, song name, or link)
  * `limit` (optional, default: `24`): Number of track results to return
* **Example Response:**
  ```json
  {
    "query": "Aditya Rikhari",
    "count": 24,
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
      }
    ]
  }
  ```

### 2. Dynamic & Personalized Trending Mix
* **Endpoint:** `GET /api/trending`
* **Query Parameters:**
  * `history` (optional): Comma-separated list of user's past search queries/artists for personalized recommendations
  * `limit` (optional, default: `24`): Number of trending tracks
* **Example Response:**
  ```json
  {
    "sectionTitle": "Trending Hits based on \"Aditya Rikhari\"",
    "tracks": [ ... ],
    "featured": [ ... ]
  }
  ```

### 3. Synchronized Lyrics Resolver
* **Endpoint:** `GET /api/lyrics`
* **Query Parameters:**
  * `title` (required): Song title
  * `artist` (optional): Artist name
  * `duration` (optional): Duration in seconds
* **Example Response:**
  ```json
  {
    "trackName": "NASAMAJH",
    "artistName": "Aditya Rikhari",
    "duration": 215,
    "syncedLyrics": [
      { "time": 12.5, "text": "First line of the song..." },
      { "time": 16.8, "text": "Second synchronized line..." }
    ],
    "plainLyrics": "Full plain text lyrics..."
  }
  ```

---

## 🛠️ Installation & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.x or higher)
* `npm` or `yarn`

### 1. Clone the Repository
```bash
git clone https://github.com/Haneefsd/audio_Player.git
cd audio_Player
```

### 2. Configure Backend Environment
Create a `.env` file in the `server/` directory (or use `.env.example`):
```env
PORT=5000
YOUTUBE_API_KEY=your_youtube_api_key_here
```
*(Note: If no API key is provided, the backend automatically uses its robust fallback scraper engine).*

### 3. Install & Start Backend
```bash
cd server
npm install
npm start
```
*Backend will run at `http://localhost:5000`*

### 4. Install & Start Frontend Client
In a separate terminal window:
```bash
cd client
npm install
npm run dev
```
*Frontend will run at `http://localhost:3000`*

---

## 📂 Project Structure

```text
audio_Player/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddToPlaylistModal.jsx   # Modal for adding songs & creating custom playlists
│   │   │   ├── FullscreenPlayer.jsx     # Visualizer spectrum & synced lyrics view
│   │   │   ├── Header.jsx               # Search bar & queue trigger
│   │   │   ├── HomeView.jsx             # Hero banner, mood chips & dynamic trending
│   │   │   ├── LibraryView.jsx          # Playlists & Liked Songs management hub
│   │   │   ├── LikedSongsView.jsx       # Dedicated Liked Songs panel (Play all, shuffle)
│   │   │   ├── PlayerBar.jsx            # Bottom sticky audio control bar
│   │   │   ├── PlaylistDetailModal.jsx  # Playlist viewer with cover upload & track manager
│   │   │   ├── QueueDrawer.jsx          # Slide-out queue & up-next drawer
│   │   │   ├── SearchView.jsx           # Search results with persistent state & history
│   │   │   ├── Sidebar.jsx              # Left navigation sidebar with playlist list
│   │   │   ├── TrackCard.jsx            # Grid track card with options menu
│   │   │   └── TrackRow.jsx             # List track row with equalizer animation
│   │   ├── context/
│   │   │   ├── AudioPlayerContext.jsx   # Context hook & definitions
│   │   │   └── AudioPlayerProvider.jsx  # Continuous playback engine & state manager
│   │   ├── services/
│   │   │   ├── api.js                   # Client REST API consumer
│   │   │   └── storage.js               # Zero-DB client localStorage storage service
│   │   ├── utils/
│   │   │   └── formatters.js            # Time & badge formatting helpers
│   │   ├── App.jsx                      # Main app container & view router
│   │   ├── main.jsx                     # Vite entry point
│   │   └── index.css                    # Obsidian glassmorphic design system
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── resolveController.js     # Lyrics handler
│   │   │   └── searchController.js      # Search & dynamic trending handler
│   │   ├── routes/
│   │   │   └── api.js                   # API route definitions
│   │   ├── services/
│   │   │   ├── lyricsService.js         # LRCLIB synchronized lyrics provider
│   │   │   └── youtubeService.js        # Data API v3 & fallback search service
│   │   └── app.js                       # Express app bootstrap
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## 🔒 Privacy & Data Policy
StreamSync does **not** track, store, or transmit any user data, passwords, or personal credentials. All playlists, favorites, listening history, and preferences stay 100% on your local machine via browser `localStorage`.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).