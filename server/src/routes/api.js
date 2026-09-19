import { Router } from 'express';
import { searchHandler, trendingHandler } from '../controllers/searchController.js';
import { lyricsHandler } from '../controllers/resolveController.js';
import { audioStreamHandler } from '../controllers/streamController.js';

const router = Router();

// YouTube Search API
router.get('/search', searchHandler);

// YouTube Trending / Popular Music
router.get('/trending', trendingHandler);

// Synchronized & Plain Lyrics
router.get('/lyrics', lyricsHandler);

// Direct Audio Stream Engine
router.get('/stream/:id', audioStreamHandler);

export default router;
