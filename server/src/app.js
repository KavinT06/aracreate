const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { createCorsOriginChecker } = require('./config/cors');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(
  cors({
    origin: createCorsOriginChecker(),
    credentials: true,
  })
);
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok' } });
});

// Serve built React client in production
// In the monorepo the server sits at   <root>/server/
// so the built client is at            <root>/client/dist/
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');

if (fs.existsSync(clientIndexPath)) {
  // Serve static assets with caching headers
  app.use(
    '/assets',
    express.static(path.join(clientDistPath, 'assets'), {
      maxAge: '1y',
      immutable: true,
    })
  );
  app.use(express.static(clientDistPath));

  // SPA fallback – send index.html for any non-API route
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    return res.sendFile(clientIndexPath);
  });
} else {
  // Dev / API-only mode
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'aracreate API is running',
      health: '/api/health',
    });
  });
}

app.use(errorHandler);

module.exports = app;