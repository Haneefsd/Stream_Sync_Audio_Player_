import { Router } from 'express';
import { searchHandler, trendingHandler } from '../controllers/searchController.js';
import { streamHandler } from '../controllers/streamController.js';
import { resolveSpotifyHandler, batchResolveHandler, lyricsHandler } from '../controllers/resolveController.js';

const router = Router();

// Unified Search across JioSaavn & YouTube
router.get('/search', searchHandler);

// Trending / Top Charts
router.get('/trending', trendingHandler);

// YouTube Audio Stream Pipeline
router.get('/stream', streamHandler);

// Spotify Resolver
router.get('/resolve', resolveSpotifyHandler);
router.post('/resolve/batch', batchResolveHandler);

// Synchronized & Plain Lyrics
router.get('/lyrics', lyricsHandler);

export default router;
