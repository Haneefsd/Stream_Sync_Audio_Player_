import { searchJioSaavn, getJioSaavnTrending } from '../services/jiosaavnService.js';
import { searchYouTube, getYouTubeTrending } from '../services/youtubeService.js';

/**
 * Unified search handler: queries JioSaavn, YouTube, or both
 */
export async function searchHandler(req, res) {
  try {
    const query = req.query.q || req.query.query;
    const source = (req.query.source || 'all').toLowerCase();
    const limit = parseInt(req.query.limit, 10) || 20;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Search query (q) parameter is required' });
    }

    let results = [];

    if (source === 'jiosaavn') {
      results = await searchJioSaavn(query, limit);
    } else if (source === 'youtube') {
      results = await searchYouTube(query, limit);
    } else {
      // Parallel multi-source search
      const [saavnTracks, ytTracks] = await Promise.allSettled([
        searchJioSaavn(query, Math.ceil(limit / 2)),
        searchYouTube(query, Math.ceil(limit / 2))
      ]);

      const saavnList = saavnTracks.status === 'fulfilled' ? saavnTracks.value : [];
      const ytList = ytTracks.status === 'fulfilled' ? ytTracks.value : [];

      // Interleave results for balanced presentation
      const maxLen = Math.max(saavnList.length, ytList.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < saavnList.length) results.push(saavnList[i]);
        if (i < ytList.length) results.push(ytList[i]);
      }
    }

    return res.json({
      query,
      source,
      count: results.length,
      results
    });
  } catch (err) {
    console.error('Search controller error:', err);
    return res.status(500).json({ error: 'Failed to process search request', details: err.message });
  }
}

/**
 * Trending / Discovery handler
 */
export async function trendingHandler(req, res) {
  try {
    const language = req.query.language || 'hindi,english,punjabi';
    
    const [saavnTrending, ytTrending] = await Promise.allSettled([
      getJioSaavnTrending(language),
      getYouTubeTrending(15)
    ]);

    const jiosaavn = saavnTrending.status === 'fulfilled' ? saavnTrending.value : [];
    const youtube = ytTrending.status === 'fulfilled' ? ytTrending.value : [];

    return res.json({
      jiosaavn,
      youtube,
      featured: [...jiosaavn.slice(0, 5), ...youtube.slice(0, 5)]
    });
  } catch (err) {
    console.error('Trending controller error:', err);
    return res.status(500).json({ error: 'Failed to fetch trending tracks' });
  }
}
