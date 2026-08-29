import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend clients
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Range', 'Authorization'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type']
}));

app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'StreamSync Audio Engine',
    timestamp: new Date().toISOString()
  });
});

// Mount API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled express route error:', err.message);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// Prevent unhandled promise / stream socket rejections from crashing the process
process.on('uncaughtException', (err) => {
  console.error('Captured uncaught exception (server kept running):', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Captured unhandled promise rejection (server kept running):', reason?.message || reason);
});

app.listen(PORT, () => {
  console.log(`🎵 StreamSync Stateless Audio Server listening on port ${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👉 Unified search: http://localhost:${PORT}/api/search?q=Aditya+Rikhari+Anuv+Jain`);
});
