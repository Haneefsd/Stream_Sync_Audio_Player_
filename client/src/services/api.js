/**
 * API Service Client for StreamSync Backend
 */

const API_BASE = '/api';

export const apiService = {
  /**
   * Multi-source Search (JioSaavn + YouTube)
   */
  search: async (query, source = 'all', limit = 24) => {
    if (!query || !query.trim()) return [];
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&source=${source}&limit=${limit}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      return data.results || [];
    } catch (err) {
      console.error('API search error:', err);
      return [];
    }
  },

  /**
   * Get Trending & Featured Charts
   */
  getTrending: async (language = 'hindi,english,punjabi') => {
    try {
      const res = await fetch(`${API_BASE}/trending?language=${encodeURIComponent(language)}`);
      if (!res.ok) throw new Error('Failed to fetch trending');
      return await res.json();
    } catch (err) {
      console.error('API trending error:', err);
      return { jiosaavn: [], youtube: [], featured: [] };
    }
  },

  /**
   * Resolve Spotify Link (Track, Playlist, Album)
   */
  resolveSpotify: async (urlOrId) => {
    try {
      const res = await fetch(`${API_BASE}/resolve?url=${encodeURIComponent(urlOrId)}`);
      if (!res.ok) throw new Error('Failed to resolve Spotify link');
      return await res.json();
    } catch (err) {
      console.error('API spotify resolve error:', err);
      throw err;
    }
  },

  /**
   * Fetch Synchronized / Plain Lyrics
   */
  getLyrics: async (title, artist, duration) => {
    try {
      const params = new URLSearchParams({
        title,
        ...(artist ? { artist } : {}),
        ...(duration ? { duration: Math.round(duration) } : {})
      });
      const res = await fetch(`${API_BASE}/lyrics?${params.toString()}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  /**
   * Builds the appropriate stream URL based on track source and user quality preferences
   */
  getStreamUrl: (track, preferredQuality = '320kbps') => {
    if (!track) return null;

    if (track.source === 'jiosaavn') {
      if (Array.isArray(track.downloadUrls) && track.downloadUrls.length > 0) {
        const match = track.downloadUrls.find(d => d.quality === preferredQuality) ||
                      track.downloadUrls.find(d => d.quality === '320kbps') ||
                      track.downloadUrls.find(d => d.quality === '160kbps') ||
                      track.downloadUrls[0];
        if (match?.url) return match.url;
      }
      return track.streamUrl || null;
    }

    if (track.source === 'youtube') {
      const videoId = track.originalId || track.id?.replace('youtube_', '');
      return `${API_BASE}/stream?id=${videoId}`;
    }

    return track.streamUrl || null;
  }
};
