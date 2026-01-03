/**
 * SQLite Session Store for express-session
 * 
 * Provides persistent session storage using SQLite database
 */

const session = require('express-session');
const { saveSession, getSession, deleteSession, updateSessionActivity } = require('./database');
const logger = require('../utils/logger');

class SQLiteSessionStore extends session.Store {
  constructor(options = {}) {
    super(options);
    this.ttl = options.ttl || 86400000; // Default: 24 hours in milliseconds
    logger.system.info('SQLite session store initialized', { ttl: this.ttl });
  }

  /**
   * Get session by ID
   */
  get(sessionId, callback) {
    try {
      const session = getSession(sessionId);
      
      if (session) {
        // Update last activity
        updateSessionActivity(sessionId);
        
        // Return session data
        const sessionData = {
          cookie: session.data.cookie || {},
          authenticated: session.authenticated,
          userId: session.user_id,
          ...session.data
        };
        
        callback(null, sessionData);
      } else {
        callback(null, null);
      }
    } catch (error) {
      logger.system.error('Failed to get session', { sessionId, error: error.message });
      callback(error);
    }
  }

  /**
   * Save/update session
   */
  set(sessionId, sessionData, callback) {
    try {
      const userId = sessionData.userId || sessionData.user_id || 'web-user';
      const authenticated = Boolean(sessionData.authenticated);
      const maxAge = sessionData.cookie?.maxAge || this.ttl;
      const expiresAt = Date.now() + maxAge;
      
      saveSession(sessionId, userId, authenticated, expiresAt, sessionData);
      
      callback(null);
    } catch (error) {
      logger.system.error('Failed to save session', { sessionId, error: error.message });
      callback(error);
    }
  }

  /**
   * Delete session
   */
  destroy(sessionId, callback) {
    try {
      deleteSession(sessionId);
      callback(null);
    } catch (error) {
      logger.system.error('Failed to destroy session', { sessionId, error: error.message });
      callback(error);
    }
  }

  /**
   * Update session expiration (touch)
   */
  touch(sessionId, sessionData, callback) {
    try {
      const maxAge = sessionData.cookie?.maxAge || this.ttl;
      const expiresAt = Date.now() + maxAge;
      const userId = sessionData.userId || sessionData.user_id || 'web-user';
      const authenticated = Boolean(sessionData.authenticated);
      
      saveSession(sessionId, userId, authenticated, expiresAt, sessionData);
      
      callback(null);
    } catch (error) {
      logger.system.error('Failed to touch session', { sessionId, error: error.message });
      callback(error);
    }
  }
}

module.exports = SQLiteSessionStore;
