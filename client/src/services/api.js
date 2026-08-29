/**
 * API Service Client for StreamSync YouTube Backend
 */

const API_BASE = '/api';

export const apiService = {
  /**
   * YouTube Music Search
   */
  search: async (query, limit = 24) => {
    if (!query || !query.trim()) return [];
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      return data.results || [];
    } catch (err) {
      console.error('YouTube search error:', err);
      return [];
    }
  },

  /**
   * Get Trending & Featured YouTube Music
   */
  getTrending: async () => {
    try {
      const res = await fetch(`${API_BASE}/trending`);
      if (!res.ok) throw new Error('Failed to fetch trending');
      return await res.json();
    } catch (err) {
      console.error('YouTube trending error:', err);
      return { youtube: [], featured: [], trending: [] };
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
  }
};
