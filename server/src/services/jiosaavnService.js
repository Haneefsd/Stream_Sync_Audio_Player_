import axios from 'axios';
import crypto from 'crypto';

const DES_KEY = Buffer.from('38346591', 'utf8');

const SAAVN_MIRRORS = [
  'https://saavn.dev/api',
  'https://saavn.me',
  'https://jiosaavn-api-privatecvc2.vercel.app'
];

/**
 * Decrypts JioSaavn encrypted_media_url
 */
function decryptMediaUrl(encryptedUrl) {
  if (!encryptedUrl) return null;
  try {
    const decipher = crypto.createDecipheriv('des-ecb', DES_KEY, null);
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(encryptedUrl, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted.trim();
  } catch (err) {
    return null;
  }
}

function buildStreamUrls(rawUrl) {
  if (!rawUrl) return {};
  const cleaned = rawUrl.replace(/_96\.mp4|_160\.mp4|_320\.mp4|_48\.mp4|_12\.mp4|_96\.m4a|_160\.m4a|_320\.m4a|_48\.m4a|_12\.m4a/i, '');
  const ext = rawUrl.includes('.mp4') ? '.mp4' : '.m4a';

  return {
    low: `${cleaned}_96${ext}`,
    medium: `${cleaned}_160${ext}`,
    high: `${cleaned}_320${ext}`,
    default: `${cleaned}_320${ext}`
  };
}

/**
 * Search JioSaavn across active mirrors
 */
export async function searchJioSaavn(query, limit = 20) {
  if (!query || !query.trim()) return [];

  for (const mirror of SAAVN_MIRRORS) {
    try {
      const res = await axios.get(`${mirror}/search/songs`, {
        params: { query: query.trim(), limit },
        headers: { 'Accept': 'application/json' },
        timeout: 4000
      });

      const songs = res.data?.data?.results || res.data?.results || res.data?.data || [];
      if (Array.isArray(songs) && songs.length > 0) {
        return songs.map(formatMirrorSong).filter(t => t.streamUrl);
      }
    } catch (err) {
      // Try next mirror
    }
  }

  // Direct JioSaavn API fallback
  try {
    const res = await axios.get(`https://www.jiosaavn.com/api.php`, {
      params: {
        __call: 'autocomplete.get',
        _format: 'json',
        _marker: '0',
        cc: 'in',
        includeMetaTags: '1',
        query: query.trim()
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 4000
    });

    const songs = res.data?.songs?.data || [];
    return songs.map(s => {
      const img = (s.image || '').replace('50x50', '500x500').replace('150x150', '500x500');
      let streamUrl = '';
      if (s.encrypted_media_url) {
        const dec = decryptMediaUrl(s.encrypted_media_url);
        streamUrl = buildStreamUrls(dec).high || '';
      }
      return {
        id: `jiosaavn_${s.id}`,
        originalId: s.id,
        title: decodeHtml(s.title || s.song),
        artist: decodeHtml(s.description || s.more_info?.primary_artists || 'JioSaavn Artist'),
        album: decodeHtml(s.album || s.more_info?.album || ''),
        duration: Number(s.more_info?.duration) || 0,
        thumbnailUrl: img,
        source: 'jiosaavn',
        maxBitrate: '320 kbps',
        streamUrl: streamUrl,
        downloadUrls: streamUrl ? [{ quality: '320kbps', url: streamUrl }] : []
      };
    });
  } catch (err) {
    return [];
  }
}

/**
 * Get Trending tracks from JioSaavn
 */
export async function getJioSaavnTrending(language = 'hindi,english,punjabi') {
  for (const mirror of SAAVN_MIRRORS) {
    try {
      const res = await axios.get(`${mirror}/modules`, {
        params: { language },
        timeout: 4000
      });

      const trendingSongs = res.data?.data?.trending?.songs || res.data?.trending?.songs || [];
      if (Array.isArray(trendingSongs) && trendingSongs.length > 0) {
        return trendingSongs.map(formatMirrorSong);
      }
    } catch (err) {
      // Try next mirror
    }
  }

  // Top Charts search fallback
  return await searchJioSaavn('Top 50 Hindi English hits', 15);
}

function decodeHtml(html) {
  if (!html) return '';
  return html
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function formatMirrorSong(song) {
  const downloadUrls = song.downloadUrl || [];
  const highQuality = downloadUrls.find(d => d.quality === '320kbps')?.url ||
                      downloadUrls.find(d => d.quality === '160kbps')?.url ||
                      downloadUrls[downloadUrls.length - 1]?.url ||
                      song.url || '';

  const images = song.image || [];
  const highResImage = Array.isArray(images) 
    ? (images.find(i => i.quality === '500x500')?.url || images[images.length - 1]?.url || '')
    : (typeof images === 'string' ? images : '');

  const primaryArtists = song.artists?.primary?.map(a => a.name).join(', ') ||
                         song.primaryArtists ||
                         song.artist ||
                         'Artist';

  return {
    id: `jiosaavn_${song.id}`,
    originalId: song.id,
    title: decodeHtml(song.name || song.title),
    artist: decodeHtml(primaryArtists),
    album: decodeHtml(song.album?.name || song.album || ''),
    duration: Number(song.duration) || 0,
    thumbnailUrl: highResImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
    source: 'jiosaavn',
    maxBitrate: '320 kbps',
    streamUrl: highQuality,
    downloadUrls: downloadUrls.map(d => ({ quality: d.quality, url: d.url }))
  };
}
