import axios from 'axios';
import { searchJioSaavn } from '../services/jiosaavnService.js';

const INVIDIOUS_INSTANCES = [
  'https://invidious.nerdvpn.de',
  'https://inv.nadeko.net',
  'https://invidious.jing.rocks',
  'https://yt.artemislena.eu',
  'https://invidious.privacyredirect.com',
  'https://iv.datura.network'
];

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.yt',
  'https://pipedapi.adminforge.de',
  'https://api-piped.mha.fi'
];

/**
 * Extracts direct playable audio stream URL from YouTube using Android client context (No cipher required)
 */
async function getDirectAndroidStreamUrl(videoId) {
  try {
    const clients = [
      {
        clientName: 'ANDROID_TESTSUITE',
        clientVersion: '1.9',
        androidSdkVersion: 30,
        hl: 'en',
        gl: 'US'
      },
      {
        clientName: 'ANDROID',
        clientVersion: '19.29.37',
        androidSdkVersion: 31,
        hl: 'en',
        gl: 'US'
      },
      {
        clientName: 'IOS',
        clientVersion: '19.29.1',
        deviceModel: 'iPhone14,3',
        hl: 'en',
        gl: 'US'
      }
    ];

    for (const client of clients) {
      try {
        const res = await axios.post(
          'https://www.youtube.com/youtubei/v1/player',
          {
            videoId,
            context: { client }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'com.google.android.youtube/19.29.37 (Linux; U; Android 11; US) gzip'
            },
            timeout: 6000
          }
        );

        const formats = res.data?.streamingData?.adaptiveFormats || res.data?.streamingData?.formats || [];
        const audioFormats = formats.filter(f => f.hasAudio !== false && (f.mimeType?.includes('audio') || f.audioQuality));
        
        // Find best format with direct unencrypted URL
        const bestFormat = audioFormats.find(f => f.url && f.mimeType?.includes('audio/mp4')) ||
                           audioFormats.find(f => f.url && f.mimeType?.includes('audio')) ||
                           audioFormats.find(f => f.url);

        if (bestFormat && bestFormat.url) {
          return {
            url: bestFormat.url,
            mimeType: bestFormat.mimeType?.split(';')[0] || 'audio/mp4',
            contentLength: bestFormat.contentLength
          };
        }
      } catch (clientErr) {
        // Try next client
      }
    }
  } catch (err) {
    console.warn(`Direct Android client extraction failed for ${videoId}:`, err.message);
  }
  return null;
}

/**
 * Streams audio from YouTube video ID with multi-tiered resilient fallback
 */
export async function streamHandler(req, res) {
  const videoId = req.query.id || req.query.videoId;
  if (!videoId) {
    return res.status(400).json({ error: 'Missing YouTube video ID (id parameter)' });
  }

  const range = req.headers.range;
  const videoTitle = req.query.title || '';
  const videoArtist = req.query.artist || '';

  // STRATEGY 1: Smart JioSaavn Matcher (Plays pristine 320kbps CDN stream with 0 buffering)
  if (videoTitle) {
    try {
      const cleanTitle = decodeURIComponent(videoTitle)
        .replace(/\(.*?\)|\[.*?\]/g, '')
        .replace(/official video|music video|lyric video|audio|full song|video song|hd|4k/gi, '')
        .trim();
      const cleanArtist = decodeURIComponent(videoArtist || '').replace(/vevo|official|channel/gi, '').trim();

      const saavnResults = await searchJioSaavn(`${cleanTitle} ${cleanArtist}`, 3);
      if (saavnResults && saavnResults.length > 0 && saavnResults[0].streamUrl) {
        const saavnTrack = saavnResults[0];
        console.log(`✓ High-speed 320k stream matched for "${videoTitle}": ${saavnTrack.title}`);

        const saavnHeaders = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.jiosaavn.com/'
        };
        if (range) saavnHeaders.Range = range;

        const saavnRes = await axios({
          method: 'GET',
          url: saavnTrack.streamUrl,
          responseType: 'stream',
          headers: saavnHeaders,
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

        saavnRes.data.on('error', () => {
          if (!res.headersSent) res.status(500).end();
        });

        req.on('close', () => {
          if (saavnRes.data && typeof saavnRes.data.destroy === 'function') {
            saavnRes.data.destroy();
          }
        });

        return;
      }
    } catch (saavnErr) {
      console.warn('JioSaavn matching fallback failed, proceeding to direct extraction:', saavnErr.message);
    }
  }

  // STRATEGY 2: Direct Android Client Stream (No cipher signature decipher needed)
  try {
    const directAudio = await getDirectAndroidStreamUrl(videoId);
    if (directAudio && directAudio.url) {
      const headers = {
        'User-Agent': 'com.google.android.youtube/19.29.37 (Linux; U; Android 11; US) gzip'
      };
      if (range) headers.Range = range;

      const ytResponse = await axios({
        method: 'GET',
        url: directAudio.url,
        responseType: 'stream',
        headers,
        timeout: 10000
      });

      res.status(ytResponse.status);
      ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach(h => {
        if (ytResponse.headers[h]) res.setHeader(h, ytResponse.headers[h]);
      });

      if (!res.getHeader('content-type')) res.setHeader('Content-Type', directAudio.mimeType || 'audio/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');

      ytResponse.data.pipe(res);

      ytResponse.data.on('error', () => {
        if (!res.headersSent) res.status(500).end();
      });

      req.on('close', () => {
        if (ytResponse.data && typeof ytResponse.data.destroy === 'function') {
          ytResponse.data.destroy();
        }
      });

      return;
    }
  } catch (directErr) {
    console.warn(`Direct Android streaming failed for ${videoId}:`, directErr.message);
  }

  // STRATEGY 3: Invidious Direct Audio Redirect (itag 140 = 128k AAC/M4A)
  for (const mirror of INVIDIOUS_INSTANCES) {
    try {
      const invidiousUrl = `${mirror}/latest_version?id=${videoId}&itag=140`;
      const invHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };
      if (range) invHeaders.Range = range;

      const invResponse = await axios({
        method: 'GET',
        url: invidiousUrl,
        responseType: 'stream',
        headers: invHeaders,
        timeout: 6000,
        maxRedirects: 5
      });

      if (invResponse.status === 200 || invResponse.status === 206) {
        res.status(invResponse.status);
        ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach(h => {
          if (invResponse.headers[h]) res.setHeader(h, invResponse.headers[h]);
        });

        if (!res.getHeader('content-type')) res.setHeader('Content-Type', 'audio/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');

        invResponse.data.pipe(res);

        invResponse.data.on('error', () => {
          if (!res.headersSent) res.status(500).end();
        });

        req.on('close', () => {
          if (invResponse.data && typeof invResponse.data.destroy === 'function') {
            invResponse.data.destroy();
          }
        });

        return;
      }
    } catch (invErr) {
      // Try next mirror
    }
  }

  // STRATEGY 4: Piped API Audio Stream Proxies
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
        res.setHeader('Access-Control-Allow-Origin', '*');

        audioProxy.data.pipe(res);

        audioProxy.data.on('error', () => {
          if (!res.headersSent) res.status(500).end();
        });

        req.on('close', () => {
          if (audioProxy.data && typeof audioProxy.data.destroy === 'function') {
            audioProxy.data.destroy();
          }
        });

        return;
      }
    } catch (err) {
      // Try next piped mirror
    }
  }

  if (!res.headersSent) {
    return res.status(500).json({ error: 'Failed to extract audio stream for this track' });
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
    console.error('Proxy stream error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to proxy audio stream' });
    }
  }
}
