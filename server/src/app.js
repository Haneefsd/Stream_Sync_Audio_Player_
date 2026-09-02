import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import apiRouter from './routes/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.join(__dirname, '../../client/dist');

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
    service: 'StreamSync YouTube Music Engine',
    timestamp: new Date().toISOString()
  });
});

// Mount API Routes
app.use('/api', apiRouter);

// Serve static client frontend in production (Single-Service Deployment)
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

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
  console.error('Captured uncaught promise rejection (server kept running):', reason?.message || reason);
});

app.listen(PORT, () => {
  console.log(`🎵 StreamSync Server listening on port ${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
  if (fs.existsSync(clientDistPath)) {
    console.log(`🚀 Serving live client frontend from ${clientDistPath}`);
  }
});
