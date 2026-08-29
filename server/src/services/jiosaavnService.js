import axios from 'axios';
import crypto from 'crypto';

const DES_KEY = Buffer.from('38346591', 'utf8');

// Official public & self-hosted instances of sumitkolhe/jiosaavn-api
const SUMITKOLHE_SAAVN_MIRRORS = [
  'https://saavn.dev/api',
  'https://jiosaavn-api-privatecvc2.vercel.app',
  'https://saavn.me',
  'https://jiosavan-api.vercel.app',
  'https://jiosaavn-api-sigma.vercel.app'
];

/**
 * Decrypts JioSaavn encrypted_media_url (DES-ECB) as standalone fallback
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

/**
 * Standardizes sumitkolhe/jiosaavn-api song schema to unified StreamSync Track format
 */
export function formatSumitKolheSong(song) {
  if (!song) return null;

  // sumitkolhe/jiosaavn-api provides downloadUrl: [ { quality: '320kbps', url: '...' }, ... ]
  const downloadUrls = Array.isArray(song.downloadUrl) 
    ? song.downloadUrl 
    : (Array.isArray(song.download_url) ? song.download_url : []);

  const highQuality = downloadUrls.find(d => d.quality === '320kbps')?.url ||
                      downloadUrls.find(d => d.quality === '160kbps')?.url ||
                      downloadUrls.find(d => d.quality === '320kbps')?.link ||
                      downloadUrls[downloadUrls.length - 1]?.url ||
                      song.url || 
                      '';

  // sumitkolhe/jiosaavn-api provides image: [ { quality: '500x500', url: '...' }, ... ]
  const images = song.image || [];
  const highResImage = Array.isArray(images)
    ? (images.find(i => i.quality === '500x500')?.url || images.find(i => i.quality === '500x500')?.link || images[images.length - 1]?.url || '')
    : (typeof images === 'string' ? images.replace('150x150', '500x500').replace('50x50', '500x500') : '');

  // Primary artists
  let primaryArtists = 'Artist';
  if (Array.isArray(song.artists?.primary)) {
    primaryArtists = song.artists.primary.map(a => a.name).join(', ');
  } else if (song.primaryArtists) {
    primaryArtists = song.primaryArtists;
  } else if (song.artist) {
    primaryArtists = song.artist;
  }

  const id = song.id || song.song_id || String(Math.random());

  return {
    id: `jiosaavn_${id}`,
    originalId: id,
    title: decodeHtml(song.name || song.title || song.song),
    artist: decodeHtml(primaryArtists),
    album: decodeHtml(song.album?.name || song.album || ''),
    duration: Number(song.duration) || 0,
    year: song.year || song.release_date || '',
    language: song.language || 'hindi',
    hasLyrics: Boolean(song.hasLyrics || song.has_lyrics),
    thumbnailUrl: highResImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
    source: 'jiosaavn',
    maxBitrate: '320 kbps',
    streamUrl: highQuality,
    downloadUrls: downloadUrls.map(d => ({ quality: d.quality, url: d.url || d.link })),
    copyright: song.copyright || song.label || ''
  };
}

/**
 * Search Songs using sumitkolhe/jiosaavn-api (/search/songs)
 */
export async function searchJioSaavn(query, limit = 20, page = 1) {
  if (!query || !query.trim()) return [];

  for (const mirror of SUMITKOLHE_SAAVN_MIRRORS) {
    try {
      const res = await axios.get(`${mirror}/search/songs`, {
        params: { query: query.trim(), page, limit },
        headers: { 'Accept': 'application/json' },
        timeout: 4500
      });

      const songs = res.data?.data?.results || res.data?.results || res.data?.data || [];
      if (Array.isArray(songs) && songs.length > 0) {
        return songs.map(formatSumitKolheSong).filter(t => t && t.streamUrl);
      }
    } catch (err) {
      // Try next mirror
    }
  }

  // Fallback: Direct JioSaavn Autocomplete & Crypt Engine
  try {
    const res = await axios.get('https://www.jiosaavn.com/api.php', {
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
    }).filter(t => t.streamUrl);
  } catch (err) {
    return [];
  }
}

/**
 * Get Song Details by ID or JioSaavn Link (/songs/:id)
 */
export async function getSongDetails(idOrLink) {
  if (!idOrLink) return null;
  const isLink = idOrLink.includes('jiosaavn.com') || idOrLink.startsWith('http');

  for (const mirror of SUMITKOLHE_SAAVN_MIRRORS) {
    try {
      const endpoint = isLink ? `${mirror}/songs?link=${encodeURIComponent(idOrLink)}` : `${mirror}/songs/${idOrLink}`;
      const res = await axios.get(endpoint, { timeout: 4000 });
      const data = res.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        return formatSumitKolheSong(data[0]);
      } else if (data && typeof data === 'object') {
        return formatSumitKolheSong(data);
      }
    } catch (err) {
      // Try next mirror
    }
  }
  return null;
}

/**
 * Get Trending & Modules from sumitkolhe/jiosaavn-api (/modules)
 */
export async function getJioSaavnTrending(language = 'hindi,english,punjabi') {
  for (const mirror of SUMITKOLHE_SAAVN_MIRRORS) {
    try {
      const res = await axios.get(`${mirror}/modules`, {
        params: { language },
        timeout: 4500
      });

      const trendingSongs = res.data?.data?.trending?.songs || res.data?.trending?.songs || [];
      if (Array.isArray(trendingSongs) && trendingSongs.length > 0) {
        return trendingSongs.map(formatSumitKolheSong).filter(t => t && t.streamUrl);
      }
    } catch (err) {
      // Try next mirror
    }
  }

  // Fallback: search top trending
  return await searchJioSaavn('Top 50 Hindi English hits', 15);
}

/**
 * Fetch Lyrics for JioSaavn Song (/lyrics?id=...)
 */
export async function getJioSaavnLyrics(songId) {
  if (!songId) return null;
  const cleanId = songId.replace('jiosaavn_', '');

  for (const mirror of SUMITKOLHE_SAAVN_MIRRORS) {
    try {
      const res = await axios.get(`${mirror}/lyrics`, {
        params: { id: cleanId },
        timeout: 3500
      });
      if (res.data?.data?.lyrics || res.data?.lyrics) {
        return {
          lyrics: res.data?.data?.lyrics || res.data?.lyrics,
          snippet: res.data?.data?.snippet || '',
          copyright: res.data?.data?.copyright || ''
        };
      }
    } catch (err) {
      // Try next mirror
    }
  }
  return null;
}
