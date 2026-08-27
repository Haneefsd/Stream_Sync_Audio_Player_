import axios from 'axios';

/**
 * Fetch synced (LRC) and plain lyrics for a track using open LRCLIB API
 */
export async function getLyrics(trackName, artistName, duration = null) {
  if (!trackName) return null;

  const cleanTitle = trackName
    .replace(/\(.*?\)|\[.*?\]/g, '') // remove parenthetical info like (Official Video), [feat. ...], etc.
    .replace(/ft\..*|feat\..*/i, '')
    .trim();

  const cleanArtist = (artistName || '')
    .split(',')[0]
    .replace(/ft\..*|feat\..*/i, '')
    .trim();

  // Try direct match with LRCLIB
  try {
    const params = {
      track_name: cleanTitle,
      artist_name: cleanArtist
    };
    if (duration && Number(duration) > 0) {
      params.duration = Math.round(Number(duration));
    }

    const res = await axios.get('https://lrclib.net/api/get', {
      params,
      headers: {
        'User-Agent': 'StreamSyncAudioPlayer/1.0 (https://github.com/streamsync)'
      },
      timeout: 4000
    });

    if (res.data && (res.data.syncedLyrics || res.data.plainLyrics)) {
      return {
        id: res.data.id,
        trackName: res.data.trackName,
        artistName: res.data.artistName,
        syncedLyrics: parseLrcLyrics(res.data.syncedLyrics),
        rawSyncedLyrics: res.data.syncedLyrics,
        plainLyrics: res.data.plainLyrics,
        isSynced: Boolean(res.data.syncedLyrics)
      };
    }
  } catch (err) {
    // Continue to search endpoint
  }

  // Fallback to LRCLIB search
  try {
    const searchRes = await axios.get('https://lrclib.net/api/search', {
      params: { q: `${cleanTitle} ${cleanArtist}` },
      headers: {
        'User-Agent': 'StreamSyncAudioPlayer/1.0 (https://github.com/streamsync)'
      },
      timeout: 4000
    });

    const results = searchRes.data || [];
    if (results.length > 0) {
      const match = results[0];
      return {
        id: match.id,
        trackName: match.trackName,
        artistName: match.artistName,
        syncedLyrics: parseLrcLyrics(match.syncedLyrics),
        rawSyncedLyrics: match.syncedLyrics,
        plainLyrics: match.plainLyrics,
        isSynced: Boolean(match.syncedLyrics)
      };
    }
  } catch (err) {
    // Return null if not found
  }

  return null;
}

/**
 * Parses raw LRC string into array of timestamped lines: [{ time: 12.5, text: "Line text" }]
 */
function parseLrcLyrics(lrcText) {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const parsed = [];

  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)/;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const ms = match[3] ? parseFloat(`0.${match[3]}`) : 0;
      const totalSeconds = minutes * 60 + seconds + ms;
      const text = match[4].trim();

      if (text) {
        parsed.push({
          time: totalSeconds,
          text
        });
      }
    }
  }

  return parsed.sort((a, b) => a.time - b.time);
}
