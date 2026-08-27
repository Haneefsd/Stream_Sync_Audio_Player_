import { getSpotifyMetadata, resolveSpotifyTrackToStream } from '../services/spotifyService.js';
import { getLyrics } from '../services/lyricsService.js';

/**
 * Resolves Spotify link (track, playlist, album) into streamable tracks
 */
export async function resolveSpotifyHandler(req, res) {
  try {
    const url = req.query.url || req.query.trackId || req.query.id;
    if (!url) {
      return res.status(400).json({ error: 'Spotify URL or trackId parameter is required' });
    }

    const metadata = await getSpotifyMetadata(url);

    // If it's a single track, immediately resolve its playable stream link
    if (metadata.type === 'track' && metadata.tracks.length > 0) {
      const resolved = await resolveSpotifyTrackToStream(metadata.tracks[0]);
      return res.json({
        type: 'track',
        resolved: resolved || metadata.tracks[0]
      });
    }

    // If it's a playlist or album, return the metadata and list of tracks
    return res.json(metadata);
  } catch (err) {
    console.error('Spotify resolver error:', err);
    return res.status(500).json({ error: 'Failed to resolve Spotify metadata', details: err.message });
  }
}

/**
 * Batch resolves Spotify tracks to playable streams
 */
export async function batchResolveHandler(req, res) {
  try {
    const { tracks } = req.body;
    if (!Array.isArray(tracks) || tracks.length === 0) {
      return res.status(400).json({ error: 'Tracks array is required' });
    }

    // Limit batch resolution to avoid overloading
    const tracksToResolve = tracks.slice(0, 10);
    const resolvedResults = await Promise.all(
      tracksToResolve.map(t => resolveSpotifyTrackToStream(t))
    );

    return res.json({
      results: resolvedResults.filter(Boolean)
    });
  } catch (err) {
    console.error('Batch resolver error:', err);
    return res.status(500).json({ error: 'Failed to batch resolve tracks' });
  }
}

/**
 * Lyrics fetching handler
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
