import axios from 'axios';
import { searchJioSaavn } from './jiosaavnService.js';
import { searchYouTube } from './youtubeService.js';

/**
 * Parses a Spotify URL to determine type (track, playlist, album) and ID
 */
export function parseSpotifyUrl(urlOrId) {
  if (!urlOrId) return null;
  const str = urlOrId.trim();

  // If already pure ID
  if (/^[a-zA-Z0-9]{22}$/.test(str)) {
    return { type: 'track', id: str };
  }

  // Handle spotify URI e.g. spotify:track:4cOdK2wGLETKBW3PvgPWqT
  const uriMatch = str.match(/spotify:(track|playlist|album):([a-zA-Z0-9]+)/);
  if (uriMatch) {
    return { type: uriMatch[1], id: uriMatch[2] };
  }

  // Handle URL e.g. https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
  const urlMatch = str.match(/open\.spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
  if (urlMatch) {
    return { type: urlMatch[1], id: urlMatch[2] };
  }

  return null;
}

/**
 * Scrapes metadata from Spotify Embed pages (Zero auth required)
 */
export async function getSpotifyMetadata(urlOrId) {
  const parsed = parseSpotifyUrl(urlOrId);
  if (!parsed) {
    throw new Error('Invalid Spotify URL or identifier provided');
  }

  const { type, id } = parsed;
  const embedUrl = `https://open.spotify.com/embed/${type}/${id}`;

  try {
    const res = await axios.get(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      },
      timeout: 7000
    });

    const html = res.data;
    // Extract __NEXT_DATA__ payload
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!match) {
      // Fallback to oEmbed for basic track info
      return await getSpotifyOEmbed(urlOrId, parsed);
    }

    const nextData = JSON.parse(match[1]);
    const entityData = nextData?.props?.pageProps?.state?.data?.entity;

    if (!entityData) {
      return await getSpotifyOEmbed(urlOrId, parsed);
    }

    if (type === 'track') {
      const track = {
        title: entityData.name || entityData.title,
        artist: entityData.artists?.map(a => a.name).join(', ') || entityData.artist_name || 'Spotify Artist',
        album: entityData.album?.name || '',
        duration: Math.round((entityData.duration_ms || 0) / 1000),
        thumbnailUrl: entityData.coverArt?.sources?.[0]?.url || entityData.album?.cover_art?.sources?.[0]?.url || '',
        spotifyUrl: `https://open.spotify.com/track/${id}`,
        type: 'track'
      };
      return { type: 'track', tracks: [track] };
    }

    if (type === 'playlist' || type === 'album') {
      const rawTrackList = entityData.trackList || entityData.tracks || [];
      const tracks = rawTrackList.map(t => ({
        title: t.title || t.name,
        artist: t.subtitle || t.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
        album: entityData.title || entityData.name || '',
        duration: Math.round((t.duration || t.duration_ms || 0) / 1000),
        thumbnailUrl: entityData.coverArt?.sources?.[0]?.url || '',
        spotifyUrl: t.uri ? `https://open.spotify.com/track/${t.uri.split(':').pop()}` : '',
        type: 'track'
      }));

      return {
        type,
        title: entityData.title || entityData.name || 'Spotify Playlist',
        description: entityData.subtitle || entityData.description || '',
        thumbnailUrl: entityData.coverArt?.sources?.[0]?.url || '',
        totalTracks: tracks.length,
        tracks
      };
    }
  } catch (err) {
    console.error('Spotify embed scraper failed:', err.message);
    return await getSpotifyOEmbed(urlOrId, parsed);
  }
}

/**
 * Fallback to Spotify public oEmbed
 */
async function getSpotifyOEmbed(url, parsed) {
  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=https://open.spotify.com/${parsed.type}/${parsed.id}`;
    const res = await axios.get(oembedUrl, { timeout: 5000 });
    const data = res.data;

    return {
      type: parsed.type,
      title: data.title,
      thumbnailUrl: data.thumbnail_url,
      tracks: [
        {
          title: data.title,
          artist: data.author_name || 'Spotify Artist',
          album: 'Spotify',
          duration: 0,
          thumbnailUrl: data.thumbnail_url,
          spotifyUrl: `https://open.spotify.com/${parsed.type}/${parsed.id}`,
          type: 'track'
        }
      ]
    };
  } catch (err) {
    throw new Error('Could not fetch metadata from Spotify link');
  }
}

/**
 * Resolves a Spotify track metadata into an immediately playable stream from JioSaavn or YouTube
 */
export async function resolveSpotifyTrackToStream(spotifyTrack) {
  const searchQuery = `${spotifyTrack.title} ${spotifyTrack.artist}`;

  // 1. Try JioSaavn first for 320kbps direct CDN streaming
  try {
    const saavnResults = await searchJioSaavn(searchQuery, 3);
    if (saavnResults && saavnResults.length > 0) {
      const match = saavnResults[0];
      return {
        ...match,
        spotifyMatched: true,
        originalSpotifyTrack: spotifyTrack
      };
    }
  } catch (err) {
    // Continue to YouTube
  }

  // 2. Fallback to YouTube
  try {
    const ytResults = await searchYouTube(searchQuery, 3);
    if (ytResults && ytResults.length > 0) {
      const match = ytResults[0];
      return {
        ...match,
        spotifyMatched: true,
        originalSpotifyTrack: spotifyTrack
      };
    }
  } catch (err) {
    // Return null
  }

  return null;
}
