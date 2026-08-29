/**
 * Client-Side Storage Service (Zero Database, Pure LocalStorage)
 */

const STORAGE_KEYS = {
  FAVORITES: 'streamsync_favorites',
  PLAYLISTS: 'streamsync_playlists',
  HISTORY: 'streamsync_history',
  SEARCH_HISTORY: 'streamsync_search_history',
  SETTINGS: 'streamsync_settings'
};

export const storageService = {
  // --- Favorites / Liked Songs ---
  getFavorites: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  isFavorite: (trackId) => {
    const favorites = storageService.getFavorites();
    return favorites.some(t => t.id === trackId || (t.originalId && t.originalId === trackId));
  },

  toggleFavorite: (track) => {
    if (!track || !track.id) return [];
    let favorites = storageService.getFavorites();
    const existsIndex = favorites.findIndex(t => t.id === track.id || (t.originalId && t.originalId === track.originalId));

    if (existsIndex >= 0) {
      favorites.splice(existsIndex, 1);
    } else {
      favorites.unshift({
        ...track,
        savedAt: new Date().toISOString()
      });
    }

    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    return favorites;
  },

  // --- Playlists ---
  getPlaylists: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      if (data) return JSON.parse(data);
      // Default starter playlist
      const defaultPlaylists = [
        {
          id: 'pl_chill_vibes',
          name: 'Chill & Vibes',
          description: 'Relaxing tunes and late night beats',
          createdAt: new Date().toISOString(),
          tracks: []
        }
      ];
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(defaultPlaylists));
      return defaultPlaylists;
    } catch {
      return [];
    }
  },

  createPlaylist: (name, description = '') => {
    const playlists = storageService.getPlaylists();
    const newPlaylist = {
      id: `pl_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
      tracks: []
    };
    playlists.push(newPlaylist);
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    return newPlaylist;
  },

  deletePlaylist: (playlistId) => {
    let playlists = storageService.getPlaylists();
    playlists = playlists.filter(p => p.id !== playlistId);
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    return playlists;
  },

  addTrackToPlaylist: (playlistId, track) => {
    const playlists = storageService.getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return false;

    const alreadyIn = playlist.tracks.some(t => t.id === track.id);
    if (!alreadyIn) {
      playlist.tracks.push(track);
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    }
    return true;
  },

  removeTrackFromPlaylist: (playlistId, trackId) => {
    const playlists = storageService.getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return false;

    playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    return true;
  },

  // --- Recently Played History ---
  getHistory: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addToHistory: (track) => {
    if (!track || !track.id) return;
    let history = storageService.getHistory();
    history = history.filter(t => t.id !== track.id);
    history.unshift({
      ...track,
      playedAt: new Date().toISOString()
    });
    // Keep max 50 recent tracks
    history = history.slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  },

  clearHistory: () => {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  },

  // --- Search History ---
  getSearchHistory: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addSearchHistory: (query) => {
    if (!query || !query.trim()) return;
    const cleanQuery = query.trim();
    let history = storageService.getSearchHistory();
    history = history.filter(q => q.toLowerCase() !== cleanQuery.toLowerCase());
    history.unshift(cleanQuery);
    history = history.slice(0, 30);
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
  },

  clearSearchHistory: () => {
    localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  },

  /**
   * Get personalized artist/query hints from past search and listening history
   */
  getPersonalizedHints: () => {
    const searches = storageService.getSearchHistory();
    const played = storageService.getHistory();
    const artists = new Set();

    // Collect from searches
    searches.slice(0, 5).forEach(s => {
      if (s.length > 2) artists.add(s);
    });

    // Collect from played tracks
    played.slice(0, 5).forEach(t => {
      if (t.artist && t.artist !== 'Artist') {
        artists.add(t.artist);
      }
    });

    return Array.from(artists);
  },

  // --- Settings ---
  getSettings: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {
        preferredQuality: '320kbps',
        volume: 0.8,
        repeatMode: 'off', // 'off' | 'all' | 'one'
        shuffle: false
      };
    } catch {
      return {
        preferredQuality: '320kbps',
        volume: 0.8,
        repeatMode: 'off',
        shuffle: false
      };
    }
  },

  saveSettings: (settings) => {
    try {
      const current = storageService.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    } catch {
      return settings;
    }
  }
};
