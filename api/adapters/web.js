/**
 * Web Adapter
 * 
 * Connects ARDEN to the web interface via Express + WebSocket.
 * Unlike chat adapters (Telegram, Discord), this one serves a full
 * REST API and static web UI. The adapter pattern is used for
 * consistent lifecycle management (start/stop/shutdown hooks).
 * 
 * For HTTP chat, the response is sent via `res.json()` in the route
 * handler, so _sendResponse / processMessage are used for the
 * WebSocket push path and the /api/notify webhook.
 */

const path = require('path');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const BaseAdapter = require('./base');
const logger = require('../utils/logger');

// Import routes
const authRoutes = require('../routes/auth');
const chatRoutes = require('../routes/chat');
const statusRoutes = require('../routes/status');
const voiceRoutes = require('../routes/voice');
const notesRoutes = require('../routes/notes');
const todosRoutes = require('../routes/todos');
const analyticsRoutes = require('../routes/analytics');
const skillsRoutes = require('../routes/skills');
const settingsRoutes = require('../routes/settings');
const sessionsRoutes = require('../routes/sessions');
const memoryRoutes = require('../routes/memory');
const clawdbotPartnershipRoutes = require('../routes/clawdbot-partnership');

// Import middleware & services
const { requireAuth } = require('../middleware/auth');
const SQLiteSessionStore = require('../services/session-store');
const wsService = require('../services/websocket');

class WebAdapter extends BaseAdapter {
  constructor(options = {}) {
    super(options);
    this.app = null;
    this.server = null;
    this.port = process.env.WEB_PORT || 3001;
    this.host = process.env.WEB_HOST || '127.0.0.1';
  }

  get name() {
    return 'web';
  }

  // ── Lifecycle hooks ────────────────────────────────────────────

  async _initClient() {
    this.app = express();

    // Middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
    this.app.use(cors({ origin: true, credentials: true }));

    // Session
    const sessionSecret = process.env.SESSION_SECRET || 'arden-web-secret-change-in-production';
    this.app.use(session({
      store: new SQLiteSessionStore({ ttl: 24 * 60 * 60 * 1000 }),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.system.info('HTTP Request', { method: req.method, path: req.path, ip: req.ip });
      next();
    });

    // Static files
    const webDir = path.join(this.root, 'web');
    this.app.use(express.static(webDir));

    const notesAttDir = path.join(process.env.HOME, 'Notes', 'attachments');
    this.app.use('/attachments', express.static(notesAttDir));
  }

  async _registerHandlers() {
    const app = this.app;

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
    app.use('/api/webhooks', clawdbotPartnershipRoutes);

    // Heartbeat notification webhook (no auth -- called by heartbeat daemon)
    app.post('/api/notify', express.json(), (req, res) => {
      const { message, priority, source } = req.body || {};
      logger.system.info('[web] Heartbeat notification received', { source, priority });
      // Push to connected WebSocket clients
      wsService.broadcast({ type: 'notification', message, priority, source });
      res.json({ success: true });
    });

    // Root redirect
    app.get('/', (req, res) => {
      if (req.session && req.session.authenticated) {
        res.redirect('/dashboard.html');
      } else {
        res.redirect('/login.html');
      }
    });

    // 404
    app.use((req, res) => {
      logger.system.warn('404 Not Found', { path: req.path });
      res.status(404).json({ error: 'Not found' });
    });

    // Error handler
    app.use((err, req, res, _next) => {
      logger.system.error('Server error', { error: err.message, path: req.path });
      res.status(500).json({ error: 'Internal server error', message: err.message });
    });
  }

  async _startClient() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, this.host, () => {
        // Init WebSocket on the same HTTP server
        wsService.initialize(this.server);

        logger.system.info('[web] Server started', { port: this.port, host: this.host });
        console.log('ARDEN Web Adapter started');
        console.log(`  URL: http://${this.host}:${this.port}`);
        resolve();
      });
    });
  }

  async _stopClient() {
    wsService.close();
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => resolve());
      });
    }
  }

  // ── Platform methods (minimal -- routes handle their own responses) ──

  /**
   * Send response over WebSocket (used for push notifications, heartbeat alerts).
   * For normal HTTP chat, the /api/chat route handles res.json() directly.
   */
  async _sendResponse(ctx, text) {
    if (ctx && ctx.ws) {
      ctx.ws.send(JSON.stringify({ type: 'message', content: text }));
    }
    // HTTP responses are handled by Express route handlers
  }

  async _sendTyping(ctx) {
    if (ctx && ctx.ws) {
      ctx.ws.send(JSON.stringify({ type: 'typing' }));
    }
  }
}

module.exports = WebAdapter;
