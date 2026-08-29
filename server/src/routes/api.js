import { Router } from 'express';
import { searchHandler, trendingHandler } from '../controllers/searchController.js';
import { lyricsHandler } from '../controllers/resolveController.js';

const router = Router();

// YouTube Search API
router.get('/search', searchHandler);

// YouTube Trending / Popular Music
router.get('/trending', trendingHandler);

// Synchronized & Plain Lyrics
router.get('/lyrics', lyricsHandler);

export default router;
