import ytSearch from 'yt-search';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

/**
 * Parses ISO 8601 duration into seconds
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
async function searchViaApi(query, limit = 24) {
  const searchUrl = 'https://www.googleapis.com/youtube/v3/search';
  const res = await axios.get(searchUrl, {
    params: {
      key: YOUTUBE_API_KEY,
      part: 'snippet',
      q: `${query.trim()}`,
      type: 'video',
      videoCategoryId: '10',
      maxResults: limit
    },
    timeout: 6000
  });

  const items = res.data?.items || [];
  if (items.length === 0) return [];

  const videoIds = items.map(i => i.id?.videoId).filter(Boolean).join(',');
  let durationMap = {};

  try {
    const detailsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        key: YOUTUBE_API_KEY,
        part: 'contentDetails,snippet',
        id: videoIds
      },
      timeout: 6000
    });

    (detailsRes.data?.items || []).forEach(item => {
      durationMap[item.id] = parseIsoDuration(item.contentDetails?.duration);
    });
  } catch (err) {}

  return items.map(item => {
    const videoId = item.id?.videoId;
    const snippet = item.snippet;
    const thumbnail = snippet.thumbnails?.high?.url || 
                      snippet.thumbnails?.medium?.url || 
                      snippet.thumbnails?.default?.url;

    return {
      id: `track_${videoId}`,
      originalId: videoId,
      title: snippet.title,
      artist: snippet.channelTitle || 'Artist',
      album: 'Single',
      duration: durationMap[videoId] || 0,
      thumbnailUrl: thumbnail,
      source: 'stream'
    };
  });
}

/**
 * Scraper fallback
 */
async function searchViaScraper(query, limit = 24) {
  const searchResults = await ytSearch({ query: `${query.trim()} audio`, page: 1 });
  const videos = (searchResults.videos || []).slice(0, limit);

  return videos.map(video => ({
    id: `track_${video.videoId}`,
    originalId: video.videoId,
    title: video.title,
    artist: video.author?.name || 'Artist',
    album: 'Single',
    duration: video.seconds || 0,
    thumbnailUrl: video.thumbnail || video.image,
    source: 'stream'
  }));
}

/**
 * Unified Search
 */
export async function searchYouTube(query, limit = 24) {
  if (!query || !query.trim()) return [];

  if (YOUTUBE_API_KEY && YOUTUBE_API_KEY !== 'your_youtube_api_key_here') {
    try {
      const results = await searchViaApi(query, limit);
      if (results.length > 0) return results;
    } catch (err) {}
  }

  try {
    return await searchViaScraper(query, limit);
  } catch (err) {
    return [];
  }
}

const TRENDING_POOLS = [
  { title: 'Aditya Rikhari & Anuv Jain Essentials', query: 'Aditya Rikhari Anuv Jain' },
  { title: 'Top Global Viral Chartbusters', query: 'popular hits music 2024' },
  { title: 'Indie Vibes & Acoustic Hits', query: 'Aditya Rikhari Prateek Kuhad Anuv Jain' },
  { title: 'Trending Bollywood Chartbusters', query: 'Arijit Singh Pritam Bollywood Hits' },
  { title: 'Global Pop & Billboard Top 50', query: 'billboard hot 100 music hits' },
  { title: 'Late Night Chill & Lo-Fi Beats', query: 'lofi chill beats study sleep' },
  { title: 'High-Energy Punjabi Waves', query: 'Punjabi Top Hits AP Dhillon Karan Aujla' },
  { title: 'Acoustic Soul & Melodies', query: 'acoustic songs unplugged hits' }
];

/**
 * Get Dynamic Trending Mix that rotates on every refresh
 */
export async function getYouTubeTrending(limit = 24) {
  const selectedPool = TRENDING_POOLS[Math.floor(Math.random() * TRENDING_POOLS.length)];
  const tracks = await searchYouTube(selectedPool.query, limit);

  return {
    sectionTitle: selectedPool.title,
    tracks
  };
}
