/**
 * API Service Client for StreamSync Backend
 */

const API_BASE = '/api';

export const apiService = {
  /**
   * Search Music
   */
  search: async (query, limit = 24) => {
    if (!query || !query.trim()) return [];
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      return data.results || [];
    } catch (err) {
      console.error('Search error:', err);
      return [];
    }
  },

  /**
   * Get Dynamic Trending & Discovery Mix
   */
  getTrending: async () => {
    try {
      const res = await fetch(`${API_BASE}/trending`);
      if (!res.ok) throw new Error('Failed to fetch trending');
      return await res.json();
    } catch (err) {
      console.error('Trending error:', err);
      return { sectionTitle: 'Trending Hits', tracks: [], featured: [] };
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
