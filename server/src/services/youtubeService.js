import ytSearch from 'yt-search';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

/**
 * Parses ISO 8601 duration (e.g. PT3M45S, PT1H2M30S) into seconds
 */
function parseIsoDuration(durationStr) {
  if (!durationStr) return 0;
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Search tracks using official YouTube Data API v3
 */
async function searchYouTubeViaApi(query, limit = 20) {
  const searchUrl = 'https://www.googleapis.com/youtube/v3/search';
  const res = await axios.get(searchUrl, {
    params: {
      key: YOUTUBE_API_KEY,
      part: 'snippet',
      q: `${query.trim()} audio`,
      type: 'video',
      videoCategoryId: '10', // Music category
      maxResults: limit
    },
    timeout: 5000
  });

  const items = res.data?.items || [];
  if (items.length === 0) return [];

  // Fetch duration and content details
  const videoIds = items.map(i => i.id?.videoId).filter(Boolean).join(',');
  let durationMap = {};

  try {
    const detailsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        key: YOUTUBE_API_KEY,
        part: 'contentDetails,snippet',
        id: videoIds
      },
      timeout: 5000
    });

    (detailsRes.data?.items || []).forEach(item => {
      durationMap[item.id] = parseIsoDuration(item.contentDetails?.duration);
    });
  } catch (err) {
    // Non-critical, duration fallback
  }

  return items.map(item => {
    const videoId = item.id?.videoId;
    const snippet = item.snippet;
    const thumbnail = snippet.thumbnails?.high?.url || 
                      snippet.thumbnails?.medium?.url || 
                      snippet.thumbnails?.default?.url;

    return {
      id: `youtube_${videoId}`,
      originalId: videoId,
      title: snippet.title,
      artist: snippet.channelTitle || 'YouTube Music',
      album: 'YouTube Music',
      duration: durationMap[videoId] || 0,
      thumbnailUrl: thumbnail,
      source: 'youtube',
      maxBitrate: '160 kbps',
      streamUrl: `/api/stream?id=${videoId}`,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`
    };
  });
}

/**
 * Fallback search using yt-search scraper
 */
async function searchYouTubeViaScraper(query, limit = 20) {
  const searchResults = await ytSearch({ query: `${query.trim()} audio`, page: 1 });
  const videos = (searchResults.videos || []).slice(0, limit);

  return videos.map(video => ({
    id: `youtube_${video.videoId}`,
    originalId: video.videoId,
    title: video.title,
    artist: video.author?.name || 'YouTube Music',
    album: 'YouTube Single',
    duration: video.seconds || 0,
    thumbnailUrl: video.thumbnail || video.image,
    source: 'youtube',
    maxBitrate: '160 kbps',
    streamUrl: `/api/stream?id=${video.videoId}`,
    youtubeUrl: video.url
  }));
}

/**
 * Unified YouTube search: Uses official API if key provided, falls back to scraper
 */
export async function searchYouTube(query, limit = 20) {
  if (!query || !query.trim()) return [];

  if (YOUTUBE_API_KEY && YOUTUBE_API_KEY !== 'your_youtube_api_key_here') {
    try {
      const results = await searchYouTubeViaApi(query, limit);
      if (results.length > 0) return results;
    } catch (err) {
      console.warn('YouTube API call failed, falling back to scraper:', err.response?.data?.error?.message || err.message);
    }
  }

  try {
    return await searchYouTubeViaScraper(query, limit);
  } catch (err) {
    console.error('YouTube scraper search failed:', err.message);
    return [];
  }
}

/**
 * Get YouTube Trending / Popular Music tracks
 */
export async function getYouTubeTrending(limit = 20) {
  if (YOUTUBE_API_KEY && YOUTUBE_API_KEY !== 'your_youtube_api_key_here') {
    try {
      const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          key: YOUTUBE_API_KEY,
          part: 'snippet,contentDetails',
          chart: 'mostPopular',
          videoCategoryId: '10', // Music
          maxResults: limit
        },
        timeout: 5000
      });

      const items = res.data?.items || [];
      if (items.length > 0) {
        return items.map(item => ({
          id: `youtube_${item.id}`,
          originalId: item.id,
          title: item.snippet?.title,
          artist: item.snippet?.channelTitle || 'YouTube Music',
          album: 'Trending Hits',
          duration: parseIsoDuration(item.contentDetails?.duration),
          thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
          source: 'youtube',
          maxBitrate: '160 kbps',
          streamUrl: `/api/stream?id=${item.id}`,
          youtubeUrl: `https://www.youtube.com/watch?v=${item.id}`
        }));
      }
    } catch (err) {
      console.warn('YouTube API trending failed, falling back to query:', err.response?.data?.error?.message || err.message);
    }
  }

  const trendingQueries = [
    'top hits music 2024',
    'trending songs billboard',
    'popular songs global playlist',
    'trending pop hindi songs'
  ];
  const query = trendingQueries[Math.floor(Math.random() * trendingQueries.length)];
  return await searchYouTube(query, limit);
}
