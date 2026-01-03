/**
 * ARDEN Web Server
 * 
 * Express server for ARDEN web interface
 * Provides REST API and serves static HTML/CSS/JS
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const statusRoutes = require('./routes/status');
const voiceRoutes = require('./routes/voice');

// Import middleware
const { requireAuth } = require('./middleware/auth');

// Initialize Express app
const app = express();

// Configuration
const PORT = process.env.WEB_PORT || 3001;
const HOST = process.env.WEB_HOST || '127.0.0.1';
const SESSION_SECRET = process.env.SESSION_SECRET || 'arden-web-secret-change-in-production';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS - allow LAN access
app.use(cors({
  origin: true, // Allow all origins for LAN access
  credentials: true
}));

// Session middleware
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Request logging
app.use((req, res, next) => {
  logger.system.info('HTTP Request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Serve static files (web interface)
const webDir = path.join(__dirname, '../web');
app.use(express.static(webDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', requireAuth, chatRoutes);
app.use('/api/status', requireAuth, statusRoutes);
app.use('/api/voice', requireAuth, voiceRoutes);

// Root redirect
app.get('/', (req, res) => {
  if (req.session && req.session.authenticated) {
    res.redirect('/dashboard.html');
  } else {
    res.redirect('/login.html');
  }
});

// 404 handler
app.use((req, res) => {
  logger.system.warn('404 Not Found', { path: req.path });
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.system.error('Server error', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });
  
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log('');
  console.log('🌐 ARDEN Web Interface Started');
  console.log('================================');
  console.log(`URL: http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('Available at:');
  console.log(`  http://localhost:${PORT}`);
  console.log(`  http://127.0.0.1:${PORT}`);
  console.log('');
  
  logger.system.info('ARDEN Web Server started', {
    port: PORT,
    host: HOST
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.system.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.system.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
