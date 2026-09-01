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
 * Fisher-Yates array shuffle utility
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

const DEFAULT_TRENDING_POOLS = [
  'Aditya Rikhari Anuv Jain hits songs',
  'popular top hits music 2024',
  'Aditya Rikhari Prateek Kuhad Anuv Jain best songs',
  'Arijit Singh Pritam Bollywood Hits',
  'billboard hot 100 top music hits',
  'lofi chill beats study sleep music',
  'Punjabi Top Hits AP Dhillon Karan Aujla'
];

const CLEAN_SECTION_TITLES = [
  'Trending Hits',
  'Recommended For You',
  'Top Charts & Hits',
  'Discovery Mix',
  'Featured Hits'
];

/**
 * Get Dynamic Trending Mix: Analyzes all past search results, queries multiple sampled terms, 
 * merges & randomly shuffles the tracks without displaying specific search queries in the title.
 */
export async function getYouTubeTrending(historyQuery = '', limit = 24) {
  const sectionTitle = 'Trending Hits';
  let combinedTracks = [];

  if (historyQuery && historyQuery.trim()) {
    const hints = historyQuery.split(',').map(h => h.trim()).filter(Boolean);

    if (hints.length > 0) {
      // Shuffle hints and pick 2-3 random distinct search keywords from past history
      const shuffledHints = shuffleArray(hints);
      const selectedHints = shuffledHints.slice(0, Math.min(3, shuffledHints.length));

      // Fetch results for selected hints
      const searchPromises = selectedHints.map(hint => 
        searchYouTube(`${hint} top songs hits`, Math.ceil(limit / selectedHints.length) + 4)
      );

      const searchResults = await Promise.allSettled(searchPromises);
      searchResults.forEach(res => {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          combinedTracks.push(...res.value);
        }
      });
    }
  }

  // If no history or search yielded few results, supplement from trending pools
  if (combinedTracks.length < 8) {
    const randomPool = DEFAULT_TRENDING_POOLS[Math.floor(Math.random() * DEFAULT_TRENDING_POOLS.length)];
    const fallbackTracks = await searchYouTube(randomPool, limit);
    combinedTracks.push(...fallbackTracks);
  }

  // Deduplicate tracks by id / originalId
  const seenIds = new Set();
  const uniqueTracks = [];
  for (const track of combinedTracks) {
    const trackKey = track.originalId || track.id;
    if (trackKey && !seenIds.has(trackKey)) {
      seenIds.add(trackKey);
      uniqueTracks.push(track);
    }
  }

  // Randomize & slice to desired limit
  const randomizedTracks = shuffleArray(uniqueTracks).slice(0, limit);

  return {
    sectionTitle,
    tracks: randomizedTracks
  };
}
