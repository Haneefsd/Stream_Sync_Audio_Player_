import { Router } from 'express';
import { searchHandler, trendingHandler } from '../controllers/searchController.js';
import { streamHandler, proxyStreamHandler } from '../controllers/streamController.js';
import { resolveSpotifyHandler, batchResolveHandler, lyricsHandler } from '../controllers/resolveController.js';

const router = Router();

// Unified Search across JioSaavn & YouTube
router.get('/search', searchHandler);

// Trending / Top Charts
router.get('/trending', trendingHandler);

// YouTube Audio Stream Pipeline
router.get('/stream', streamHandler);

// Universal CDN Audio Proxy
router.get('/proxy-stream', proxyStreamHandler);

// Spotify Resolver
router.get('/resolve', resolveSpotifyHandler);
router.post('/resolve/batch', batchResolveHandler);

// Synchronized & Plain Lyrics
router.get('/lyrics', lyricsHandler);

export default router;
