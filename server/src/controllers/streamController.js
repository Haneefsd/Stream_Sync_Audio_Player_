import { getAudioStreamUrl } from '../services/youtubeService.js';
import axios from 'axios';

export async function audioStreamHandler(req, res) {
  try {
    const videoId = req.params.id;
    if (!videoId) {
      return res.status(400).json({ error: 'Missing video ID parameter' });
    }

    const audioUrl = await getAudioStreamUrl(videoId);
    if (!audioUrl) {
      return res.status(500).json({ error: 'Failed to extract audio stream URL' });
    }

    // Forward Range header if present for seeking/scrubbing support
    const reqHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
    };
    if (req.headers.range) {
      reqHeaders.Range = req.headers.range;
    }

    const streamRes = await axios.get(audioUrl, {
      responseType: 'stream',
      headers: reqHeaders,
      validateStatus: (status) => status >= 200 && status < 400
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Accept-Ranges', 'bytes');

    if (streamRes.headers['content-type']) {
      res.setHeader('Content-Type', streamRes.headers['content-type']);
    } else {
      res.setHeader('Content-Type', 'audio/webm');
    }

    if (streamRes.headers['content-length']) {
      res.setHeader('Content-Length', streamRes.headers['content-length']);
    }
    if (streamRes.headers['content-range']) {
      res.setHeader('Content-Range', streamRes.headers['content-range']);
    }

    res.status(streamRes.status);

    streamRes.data.on('error', (err) => {
      console.error('Stream piping error:', err?.message);
      if (!res.headersSent) {
        res.status(500).end();
      }
    });

    streamRes.data.pipe(res);
  } catch (err) {
    console.warn('Stream controller warning:', err?.message);
    if (!res.headersSent) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(404).json({ error: 'Direct audio stream unavailable', fallback: 'youtube', message: err?.message });
    }
  }
}
