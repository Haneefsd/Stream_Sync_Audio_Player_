import { searchYouTube, getYouTubeTrending } from '../services/youtubeService.js';

/**
 * YouTube search handler
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
      source: 'youtube',
      count: results.length,
      results
    });
  } catch (err) {
    console.error('YouTube search error:', err);
    return res.status(500).json({ error: 'Failed to process search request', details: err.message });
  }
}

/**
 * YouTube Trending / Discovery handler
 */
export async function trendingHandler(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 24;
    const youtube = await getYouTubeTrending(limit);

    return res.json({
      youtube,
      featured: youtube.slice(0, 8),
      trending: youtube
    });
  } catch (err) {
    console.error('YouTube trending error:', err);
    return res.status(500).json({ error: 'Failed to fetch trending tracks' });
  }
}
