import axios from 'axios';
import { searchJioSaavn } from '../services/jiosaavnService.js';

const INVIDIOUS_MIRRORS = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://invidious.jing.rocks',
  'https://yt.artemislena.eu',
  'https://invidious.privacyredirect.com',
  'https://iv.datura.network',
  'https://invidious.protokolla.fi'
];

const PIPED_MIRRORS = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.yt',
  'https://pipedapi.adminforge.de',
  'https://api-piped.mha.fi'
];

const COBALT_INSTANCES = [
  'https://co.wuk.sh/api/json',
  'https://api.cobalt.tools/api/json',
  'https://cobalt.kwiatekm.com/api/json'
];

/**
 * Clean track title for smart matching
 */
function cleanSongTitle(title = '', artist = '') {
  let clean = decodeURIComponent(title)
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/official video|music video|lyric video|audio|full song|video song|hd|4k|remix|version/gi, '')
    .replace(/[^\w\s\d]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let cleanArt = decodeURIComponent(artist || '')
    .replace(/vevo|official|channel|music|records/gi, '')
    .replace(/[^\w\s\d]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { title: clean, artist: cleanArt, query: `${clean} ${cleanArt}`.trim() };
}

/**
 * Strategy 1: Match with JioSaavn 320kbps CDN stream
 */
async function tryJioSaavnMatch(videoTitle, videoArtist, range, res) {
  if (!videoTitle) return false;

  const { query } = cleanSongTitle(videoTitle, videoArtist);
  try {
    const results = await searchJioSaavn(query, 3);
    if (results && results.length > 0 && results[0].streamUrl) {
      const saavnTrack = results[0];
      console.log(`[Stream] JioSaavn 320k matched for "${videoTitle}" -> "${saavnTrack.title}"`);

      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.jiosaavn.com/'
      };
      if (range) headers.Range = range;

      const saavnRes = await axios({
        method: 'GET',
        url: saavnTrack.streamUrl,
        responseType: 'stream',
        headers,
        timeout: 8000
      });

      res.status(saavnRes.status);
      ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach(h => {
        if (saavnRes.headers[h]) res.setHeader(h, saavnRes.headers[h]);
      });

      if (!res.getHeader('content-type')) res.setHeader('Content-Type', 'audio/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');

      saavnRes.data.pipe(res);

      reqCleanup(saavnRes.data, res);
      return true;
    }
  } catch (err) {
    console.warn('[Stream] JioSaavn match failed:', err.message);
  }
  return false;
}

/**
 * Strategy 2: Direct Invidious Audio Stream (itag 140)
 */
async function tryInvidiousStream(videoId, range, res) {
  for (const mirror of INVIDIOUS_MIRRORS) {
    try {
      const invidiousUrl = `${mirror}/latest_version?id=${videoId}&itag=140`;
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };
      if (range) headers.Range = range;

      const invResponse = await axios({
        method: 'GET',
        url: invidiousUrl,
        responseType: 'stream',
        headers,
        timeout: 7000,
        maxRedirects: 5
      });

      if (invResponse.status === 200 || invResponse.status === 206) {
        console.log(`[Stream] Invidious mirror active (${mirror}) for ${videoId}`);
        res.status(invResponse.status);
        ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach(h => {
          if (invResponse.headers[h]) res.setHeader(h, invResponse.headers[h]);
        });

        if (!res.getHeader('content-type')) res.setHeader('Content-Type', 'audio/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');

        invResponse.data.pipe(res);
        reqCleanup(invResponse.data, res);
        return true;
      }
    } catch (err) {
      // Try next mirror
    }
  }
  return false;
}

/**
 * Strategy 3: Piped API Audio Stream
 */
async function tryPipedStream(videoId, range, res) {
  for (const instance of PIPED_MIRRORS) {
    try {
      const pipedRes = await axios.get(`${instance}/streams/${videoId}`, { timeout: 4000 });
      const audioStreams = pipedRes.data?.audioStreams || [];
      if (audioStreams.length > 0) {
        const bestStream = audioStreams[0];
        const audioProxy = await axios({
          method: 'GET',
          url: bestStream.url,
          responseType: 'stream',
          headers: range ? { Range: range } : {},
          timeout: 8000
        });

        console.log(`[Stream] Piped instance active (${instance}) for ${videoId}`);
        res.status(audioProxy.status);
        res.setHeader('Content-Type', bestStream.mimeType || 'audio/webm');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');

        audioProxy.data.pipe(res);
        reqCleanup(audioProxy.data, res);
        return true;
      }
    } catch (err) {
      // Try next instance
    }
  }
  return false;
}

/**
 * Strategy 4: Cobalt Audio Extractor
 */
async function tryCobaltStream(videoId, range, res) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  for (const instance of COBALT_INSTANCES) {
    try {
      const cobaltRes = await axios.post(
        instance,
        {
          url: youtubeUrl,
          isAudioOnly: true,
          aFormat: 'mp3'
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'StreamSync/1.0'
          },
          timeout: 6000
        }
      );

      const downloadUrl = cobaltRes.data?.url;
      if (downloadUrl) {
        console.log(`[Stream] Cobalt audio link retrieved for ${videoId}`);
        const cobaltStream = await axios({
          method: 'GET',
          url: downloadUrl,
          responseType: 'stream',
          headers: range ? { Range: range } : {},
          timeout: 8000
        });

        res.status(cobaltStream.status);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');

        cobaltStream.data.pipe(res);
        reqCleanup(cobaltStream.data, res);
        return true;
      }
    } catch (err) {
      // Try next cobalt instance
    }
  }
  return false;
}

function reqCleanup(stream, res) {
  stream.on('error', () => {
    if (!res.headersSent) res.status(500).end();
  });
}

/**
 * Master multi-strategy stream handler
 */
export async function streamHandler(req, res) {
  const videoId = req.query.id || req.query.videoId;
  if (!videoId) {
    return res.status(400).json({ error: 'Missing YouTube video ID' });
  }

  const range = req.headers.range;
  const videoTitle = req.query.title || '';
  const videoArtist = req.query.artist || '';

  // 1. First priority: High-Speed 320kbps Studio Match
  if (videoTitle) {
    const matched = await tryJioSaavnMatch(videoTitle, videoArtist, range, res);
    if (matched) return;
  }

  // 2. Second priority: Invidious Direct AAC/M4A Stream
  const invidiousSuccess = await tryInvidiousStream(videoId, range, res);
  if (invidiousSuccess) return;

  // 3. Third priority: Piped API Audio Stream
  const pipedSuccess = await tryPipedStream(videoId, range, res);
  if (pipedSuccess) return;

  // 4. Fourth priority: Cobalt Audio Engine
  const cobaltSuccess = await tryCobaltStream(videoId, range, res);
  if (cobaltSuccess) return;

  // 5. Fallback: Search JioSaavn by videoId or generic query
  if (!res.headersSent) {
    return res.status(500).json({ error: 'Audio stream temporarily unavailable for this track.' });
  }
}

/**
 * Universal CDN Audio Proxy with byte-range forwarding and CORS
 */
export async function proxyStreamHandler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  const range = req.headers.range;

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.jiosaavn.com/'
    };
    if (range) headers.Range = range;

    const response = await axios({
      method: 'GET',
      url: targetUrl,
      responseType: 'stream',
      headers,
      timeout: 10000
    });

    res.status(response.status);
    ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach(h => {
      if (response.headers[h]) res.setHeader(h, response.headers[h]);
    });

    if (!res.getHeader('content-type')) {
      res.setHeader('Content-Type', targetUrl.includes('.mp4') ? 'audio/mp4' : 'audio/mp4');
    }
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');

    response.data.pipe(res);

    response.data.on('error', () => {
      if (!res.headersSent) res.status(500).end();
    });

    req.on('close', () => {
      if (response.data && typeof response.data.destroy === 'function') {
        response.data.destroy();
      }
    });
  } catch (err) {
    console.error('[Proxy] Stream error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to proxy audio stream' });
    }
  }
}
