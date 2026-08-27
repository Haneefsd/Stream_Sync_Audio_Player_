import play from 'play-dl';
import ytdl from '@distube/ytdl-core';
import axios from 'axios';

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.privacydev.net',
  'https://piped-api.garudalinux.org',
  'https://api.piped.yt'
];

/**
 * Streams audio from YouTube video ID with multi-tier fallback and seeking support
 */
export async function streamHandler(req, res) {
  const videoId = req.query.id || req.query.videoId;
  if (!videoId) {
    return res.status(400).json({ error: 'Missing YouTube video ID (id parameter)' });
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const range = req.headers.range;

  // Tier 1: play-dl (Modern & resilient)
  try {
    const source = await play.stream(videoUrl);
    if (source && source.stream) {
      res.setHeader('Content-Type', source.type || 'audio/webm');
      res.setHeader('Accept-Ranges', 'bytes');

      source.stream.on('error', (err) => {
        console.error(`play-dl stream error for ${videoId}:`, err.message);
        if (!res.headersSent) res.status(500).end();
      });

      req.on('close', () => {
        if (source.stream && typeof source.stream.destroy === 'function') {
          source.stream.destroy();
        }
      });

      return source.stream.pipe(res);
    }
  } catch (err) {
    console.warn(`play-dl attempt failed for ${videoId}:`, err.message);
  }

  // Tier 2: @distube/ytdl-core
  try {
    const info = await ytdl.getInfo(videoUrl);
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    const format = audioFormats.find(f => f.container === 'mp4' || f.container === 'm4a') || 
                   audioFormats[0] || 
                   info.formats.find(f => f.hasAudio);

    if (format && format.url) {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };
      if (range) headers.Range = range;

      const response = await axios({
        method: 'GET',
        url: format.url,
        responseType: 'stream',
        headers,
        timeout: 10000
      });

      res.status(response.status);
      ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach(h => {
        if (response.headers[h]) res.setHeader(h, response.headers[h]);
      });

      if (!res.getHeader('content-type')) {
        res.setHeader('Content-Type', format.mimeType || 'audio/webm');
      }
      res.setHeader('Accept-Ranges', 'bytes');

      response.data.on('error', (err) => {
        if (!res.headersSent) res.status(500).end();
      });

      req.on('close', () => {
        if (response.data && typeof response.data.destroy === 'function') {
          response.data.destroy();
        }
      });

      return response.data.pipe(res);
    }
  } catch (err) {
    console.warn(`ytdl direct attempt failed for ${videoId}:`, err.message);
  }

  // Tier 3: Piped API audio stream mirror
  for (const instance of PIPED_INSTANCES) {
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

        res.status(audioProxy.status);
        res.setHeader('Content-Type', bestStream.mimeType || 'audio/webm');
        res.setHeader('Accept-Ranges', 'bytes');

        audioProxy.data.on('error', () => {
          if (!res.headersSent) res.status(500).end();
        });

        req.on('close', () => {
          if (audioProxy.data && typeof audioProxy.data.destroy === 'function') {
            audioProxy.data.destroy();
          }
        });

        return audioProxy.data.pipe(res);
      }
    } catch (err) {
      // Try next piped mirror
    }
  }

  if (!res.headersSent) {
    return res.status(500).json({ error: 'Failed to extract playable audio stream for this track' });
  }
}
