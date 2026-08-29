import { getLyrics } from '../services/lyricsService.js';

/**
 * Lyrics fetching handler for YouTube tracks
 */
export async function lyricsHandler(req, res) {
  try {
    const { title, artist, duration } = req.query;
    if (!title) {
      return res.status(400).json({ error: 'Song title is required' });
    }

    const lyricsData = await getLyrics(title, artist, duration);
    if (!lyricsData) {
      return res.status(404).json({ error: 'Lyrics not found for this track' });
    }

    return res.json(lyricsData);
  } catch (err) {
    console.error('Lyrics handler error:', err);
    return res.status(500).json({ error: 'Failed to retrieve lyrics' });
  }
}
