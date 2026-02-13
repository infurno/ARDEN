/**
 * Base Adapter
 * 
 * Abstract base class for all ARDEN platform adapters.
 * Provides common lifecycle, config validation, rate limiting,
 * auth checking, and message processing pipeline.
 * 
 * Subclasses must implement:
 *   - name (getter)        - Adapter identifier (e.g. 'telegram', 'discord')
 *   - _initClient()        - Set up platform SDK client
 *   - _registerHandlers()  - Bind platform event handlers
 *   - _startClient()       - Connect / begin polling
 *   - _stopClient()        - Graceful disconnect
 *   - _sendResponse(ctx, text) - Deliver response to the user
 *   - _sendTyping(ctx)     - Show typing indicator (optional)
 */

const path = require('path');
const logger = require('../utils/logger');
const { validateConfig } = require('../utils/config-validator');
const { checkRateLimit } = require('../utils/rate-limiter');
const { executeArden } = require('../services/ai-providers');
const { logInteraction } = require('../services/session');

// Resolve paths once
const ARDEN_ROOT = path.resolve(__dirname, '../..');

class BaseAdapter {
  constructor(options = {}) {
    if (new.target === BaseAdapter) {
      throw new Error('BaseAdapter is abstract and cannot be instantiated directly');
    }

    this.root = ARDEN_ROOT;
    this.config = require(path.join(ARDEN_ROOT, 'config/arden.json'));
    this.rateLimitMap = new Map();
    this.rateLimitWindowMs = options.rateLimitWindowMs || 60000;
    this.rateLimitMaxRequests = options.rateLimitMaxRequests || 10;
    this._running = false;
  }

  // ── Abstract interface ───────────────────────────────────────────

  /** @returns {string} Adapter name used in logs and config keys */
  get name() {
    throw new Error('Subclass must implement get name()');
  }

  /** Initialise the platform client (SDK object, HTTP server, etc.) */
  async _initClient() {
    throw new Error('Subclass must implement _initClient()');
  }

  /** Register event listeners on the platform client */
  async _registerHandlers() {
    throw new Error('Subclass must implement _registerHandlers()');
  }

  /** Start the client (connect, begin polling, listen on port, etc.) */
  async _startClient() {
    throw new Error('Subclass must implement _startClient()');
  }

  /** Stop the client gracefully */
  async _stopClient() {
    throw new Error('Subclass must implement _stopClient()');
  }

  /**
   * Send a text response back to the user on this platform.
   * @param {Object} ctx - Platform-specific context (message, channel, etc.)
   * @param {string} text - The response text
   */
  async _sendResponse(ctx, text) {
    throw new Error('Subclass must implement _sendResponse()');
  }

  /**
   * Show a typing / processing indicator (optional override).
   * @param {Object} ctx - Platform-specific context
   */
  async _sendTyping(/* ctx */) {
    // Default no-op; override for platforms that support it
  }

  // ── Lifecycle ────────────────────────────────────────────────────

  /**
   * Full startup sequence: validate config -> init client -> register
   * handlers -> start client -> register shutdown hooks.
   */
  async start() {
    logger.system.info(`[${this.name}] Starting adapter...`);

    // 1. Validate config
    this._validateConfig();

    // 2. Init client
    await this._initClient();

    // 3. Register handlers
    await this._registerHandlers();

    // 4. Start client
    await this._startClient();
    this._running = true;

    // 5. Shutdown hooks
    this._registerShutdownHooks();

    logger.system.info(`[${this.name}] Adapter started`);
  }

  /**
   * Graceful shutdown.
   */
  async stop() {
    if (!this._running) return;
    logger.system.info(`[${this.name}] Stopping adapter...`);
    this._running = false;
    await this._stopClient();
    logger.system.info(`[${this.name}] Adapter stopped`);
  }

  // ── Shared helpers ───────────────────────────────────────────────

  /**
   * Validate arden.json at startup (shared across all adapters).
   * Logs warnings but only exits on hard errors.
   */
  _validateConfig() {
    logger.system.info(`[${this.name}] Validating configuration...`);
    try {
      validateConfig(this.config);
      logger.system.info(`[${this.name}] Configuration valid`);
    } catch (error) {
      logger.system.error(`[${this.name}] Configuration invalid`, { error: error.message });
      process.exit(1);
    }
  }

  /**
   * Check rate-limit for a user.
   * @param {string|number} userId
   * @returns {{ allowed: boolean, remaining: number, waitTime?: number }}
   */
  checkRateLimit(userId) {
    return checkRateLimit(
      userId,
      this.rateLimitMap,
      this.rateLimitWindowMs,
      this.rateLimitMaxRequests,
    );
  }

  /**
   * Check if a user is authorised based on adapter-specific config.
   * Override if the adapter stores allowed_users differently.
   * @param {string|number} userId
   * @returns {boolean}
   */
  isAuthorized(userId) {
    const adapterConfig = this.config[this.name];
    if (!adapterConfig || !adapterConfig.allowed_users || adapterConfig.allowed_users.length === 0) {
      return true; // no restriction
    }
    return adapterConfig.allowed_users.includes(userId);
  }

  /**
   * Core message processing pipeline shared by all adapters.
   * 
   * @param {Object} ctx        - Platform-specific context passed to _sendResponse / _sendTyping
   * @param {string} userId     - Unique user identifier on this platform
   * @param {string} username   - Human-readable username
   * @param {string} text       - The user's message text
   * @param {Object} [meta={}]  - Optional metadata (sessionId, channelId, etc.)
   * @returns {string|null}     - The ARDEN response, or null if blocked
   */
  async processMessage(ctx, userId, username, text, meta = {}) {
    const tag = `[${this.name}]`;

    // 1. Auth
    if (!this.isAuthorized(userId)) {
      logger.system.warn(`${tag} Unauthorized user`, { userId, username });
      await this._sendResponse(ctx, 'Sorry, you are not authorized to use this bot.');
      return null;
    }

    // 2. Rate limit
    const rl = this.checkRateLimit(userId);
    if (!rl.allowed) {
      logger.system.warn(`${tag} Rate limit exceeded`, { userId, waitTime: rl.waitTime });
      await this._sendResponse(ctx, `Rate limit exceeded. Please wait ${rl.waitTime} seconds.`);
      return null;
    }

    // 3. Typing indicator
    await this._sendTyping(ctx);

    // 4. Execute ARDEN
    logger.user.info(`${tag} Processing message`, { userId, username, promptLength: text.length });
    try {
      const sessionId = meta.sessionId || `${this.name}-${userId}`;
      const response = await executeArden(text, userId, sessionId);

      // 5. Log interaction
      await logInteraction(userId, username, text, response);

      // 6. Deliver response
      await this._sendResponse(ctx, response);

      logger.user.info(`${tag} Response sent`, { userId, responseLength: response.length });
      return response;
    } catch (error) {
      logger.system.error(`${tag} Error processing message`, {
        userId,
        username,
        error: error.message,
      });
      await this._sendResponse(ctx, 'Sorry, I encountered an error processing your message. Please try again.');
      return null;
    }
  }

  // ── Internal ─────────────────────────────────────────────────────

  _registerShutdownHooks() {
    const shutdown = async (signal) => {
      logger.system.info(`[${this.name}] ${signal} received`);
      await this.stop();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }
}

module.exports = BaseAdapter;
