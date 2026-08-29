import { searchYouTube, getYouTubeTrending } from '../services/youtubeService.js';

/**
 * Search handler
 */
export async function searchHandler(req, res) {
  try {
    const query = req.query.q || req.query.query;
    const limit = parseInt(req.query.limit, 10) || 24;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Search query (q) parameter is required' });
    }

    const results = await searchYouTube(query, limit);

    return res.json({
      query,
      count: results.length,
      results
    });
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ error: 'Failed to process search request', details: err.message });
  }
}

/**
 * Dynamic Trending / Discovery handler - changes on every refresh
 */
export async function trendingHandler(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 24;
    const trendingData = await getYouTubeTrending(limit);

    return res.json({
      sectionTitle: trendingData.sectionTitle || 'Trending Hits Today',
      tracks: trendingData.tracks || [],
      featured: (trendingData.tracks || []).slice(0, 8)
    });
  } catch (err) {
    console.error('Trending error:', err);
    return res.status(500).json({ error: 'Failed to fetch trending tracks' });
  }
}
