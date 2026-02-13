/**
 * ARDEN Web Server  (entry-point)
 * 
 * Two modes:
 *   1. Adapter mode (default) -- uses api/adapters/web.js via the
 *      unified adapter lifecycle.
 *   2. Legacy mode -- original standalone code, activated with
 *      ARDEN_LEGACY_WEB=1  (kept for rollback safety).
 * 
 * Express server for ARDEN web interface
 * Provides REST API and serves static HTML/CSS/JS
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// ── Adapter mode (default) ─────────────────────────────────────
if (!process.env.ARDEN_LEGACY_WEB) {
  const { WebAdapter } = require('./adapters');
  const adapter = new WebAdapter();
  adapter.start().catch((err) => {
    console.error('Failed to start Web adapter:', err);
    process.exit(1);
  });
  return;
}

// ── Legacy mode (ARDEN_LEGACY_WEB=1) ───────────────────────────
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
const notesRoutes = require('./routes/notes');
const todosRoutes = require('./routes/todos');
const analyticsRoutes = require('./routes/analytics');
const skillsRoutes = require('./routes/skills');
const settingsRoutes = require('./routes/settings');
const sessionsRoutes = require('./routes/sessions');
const memoryRoutes = require('./routes/memory');
const clawdbotPartnershipRoutes = require('./routes/clawdbot-partnership');

// Import middleware
const { requireAuth } = require('./middleware/auth');

// Import persistent session store
const SQLiteSessionStore = require('./services/session-store');

// Import WebSocket service
const wsService = require('./services/websocket');

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

// Session middleware with persistent SQLite store
app.use(session({
  store: new SQLiteSessionStore({
    ttl: 24 * 60 * 60 * 1000 // 24 hours
  }),
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

// Serve note attachments (images, etc.)
const notesAttachmentsDir = path.join(process.env.HOME, 'Notes', 'attachments');
app.use('/attachments', express.static(notesAttachmentsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', requireAuth, chatRoutes);
app.use('/api/status', requireAuth, statusRoutes);
app.use('/api/voice', requireAuth, voiceRoutes);
app.use('/api/notes', requireAuth, notesRoutes);
app.use('/api/todos', requireAuth, todosRoutes);
app.use('/api/analytics', requireAuth, analyticsRoutes);
app.use('/api/skills', requireAuth, skillsRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);
app.use('/api/sessions', requireAuth, sessionsRoutes);
app.use('/api/memory', requireAuth, memoryRoutes);
app.use('/api/clawdbot-partnership', requireAuth, clawdbotPartnershipRoutes);
app.use('/api/webhooks', clawdbotPartnershipRoutes); // Webhooks don't require auth

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
const server = app.listen(PORT, HOST, () => {
  console.log('ARDEN Web Interface Started (legacy mode)');
  console.log(`URL: http://${HOST}:${PORT}`);
  
  logger.system.info('ARDEN Web Server started (legacy mode)', {
    port: PORT,
    host: HOST
  });
});

// Initialize WebSocket server
wsService.initialize(server);
logger.system.info('WebSocket server initialized', {
  path: '/ws'
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.system.info('SIGTERM received, shutting down gracefully');
  wsService.close();
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.system.info('SIGINT received, shutting down gracefully');
  wsService.close();
  server.close(() => {
    process.exit(0);
  });
});
