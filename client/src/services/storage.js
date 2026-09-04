/**
 * Client-Side Storage Service (Zero Database, Pure LocalStorage)
 */

const STORAGE_KEYS = {
  FAVORITES: 'streamsync_favorites',
  PLAYLISTS: 'streamsync_playlists',
  HISTORY: 'streamsync_history',
  SEARCH_HISTORY: 'streamsync_search_history',
  LAST_SEARCH: 'streamsync_last_search',
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
          coverUrl: '',
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

  createPlaylist: (name, description = '', coverUrl = '') => {
    const playlists = storageService.getPlaylists();
    const newPlaylist = {
      id: `pl_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      coverUrl: coverUrl.trim(),
      createdAt: new Date().toISOString(),
      tracks: []
    };
    playlists.push(newPlaylist);
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('playlistsUpdated'));
    return newPlaylist;
  },

  updatePlaylist: (playlistId, updates = {}) => {
    let playlists = storageService.getPlaylists();
    const index = playlists.findIndex(p => p.id === playlistId);
    if (index >= 0) {
      playlists[index] = {
        ...playlists[index],
        ...updates
      };
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('playlistsUpdated'));
      return playlists[index];
    }
    return null;
  },

  getPlaylistCover: (playlist) => {
    if (!playlist) return null;
    if (playlist.coverUrl && playlist.coverUrl.trim()) {
      return playlist.coverUrl.trim();
    }
    if (playlist.tracks && playlist.tracks.length > 0 && playlist.tracks[0].thumbnailUrl) {
      return playlist.tracks[0].thumbnailUrl;
    }
    return null;
  },

  deletePlaylist: (playlistId) => {
    let playlists = storageService.getPlaylists();
    playlists = playlists.filter(p => p.id !== playlistId);
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('playlistsUpdated'));
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('playlistsUpdated', {
          detail: { playlistId, addedTrack: track, type: 'addTrack' }
        }));
      }
    }
    return true;
  },

  removeTrackFromPlaylist: (playlistId, trackId) => {
    const playlists = storageService.getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return false;

    playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('playlistsUpdated', {
        detail: { playlistId, removedTrackId: trackId, type: 'removeTrack' }
      }));
    }
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
    if (!query || !query.trim() || query.trim().length < 2) return;
    const cleanQuery = query.trim();
    let history = storageService.getSearchHistory();
    // Filter out duplicates and partial typed fragments
    history = history.filter(q => {
      const qLower = q.toLowerCase();
      const cleanLower = cleanQuery.toLowerCase();
      if (qLower === cleanLower) return false;
      // If previous item was an incomplete prefix just typed, replace it
      if (cleanLower.startsWith(qLower) && (cleanLower.length - qLower.length <= 5)) return false;
      return true;
    });
    history.unshift(cleanQuery);
    history = history.slice(0, 30);
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
  },

  removeSearchHistoryItem: (query) => {
    if (!query) return;
    let history = storageService.getSearchHistory();
    history = history.filter(q => q.toLowerCase() !== query.trim().toLowerCase());
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
  },

  clearSearchHistory: () => {
    localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  },

  // --- Saved Last Search Results ---
  getLastSearchResults: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LAST_SEARCH);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveLastSearchResults: (query, results) => {
    try {
      if (!query || !results) return;
      localStorage.setItem(STORAGE_KEYS.LAST_SEARCH, JSON.stringify({
        query: query.trim(),
        results,
        savedAt: new Date().toISOString()
      }));
    } catch (err) {
      console.warn('Failed to cache search results:', err);
    }
  },

  clearLastSearchResults: () => {
    localStorage.removeItem(STORAGE_KEYS.LAST_SEARCH);
  },

  /**
   * Analyzes all old search results, history, and preferences to build a comprehensive recommendation profile
   */
  getPersonalizedHints: () => {
    const searches = storageService.getSearchHistory();
    const played = storageService.getHistory();
    const lastSearch = storageService.getLastSearchResults();
    const favorites = storageService.getFavorites();
    const hints = new Set();

    // 1. All previous search queries
    searches.forEach(s => {
      if (s && s.trim().length > 1) {
        hints.add(s.trim());
      }
    });

    // 2. Artists from cached search results
    if (lastSearch?.results && Array.isArray(lastSearch.results)) {
      lastSearch.results.slice(0, 8).forEach(t => {
        if (t.artist && t.artist !== 'Artist' && t.artist.length > 2) {
          hints.add(t.artist.trim());
        }
      });
    }

    // 3. Artists from recently played tracks
    played.slice(0, 15).forEach(t => {
      if (t.artist && t.artist !== 'Artist' && t.artist.length > 2) {
        hints.add(t.artist.trim());
      }
    });

    // 4. Artists from liked/favorited songs
    favorites.slice(0, 10).forEach(t => {
      if (t.artist && t.artist !== 'Artist' && t.artist.length > 2) {
        hints.add(t.artist.trim());
      }
    });

    return Array.from(hints);
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
