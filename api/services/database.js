/**
 * Database Service
 * 
 * Manages SQLite database for persistent storage:
 * - User sessions (login state, expiration)
 * - Chat history (messages, conversations)
 * - User preferences
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const ARDEN_ROOT = path.resolve(__dirname, '../..');
const DB_DIR = path.join(ARDEN_ROOT, 'data');
const DB_PATH = path.join(DB_DIR, 'arden.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  logger.system.info('Created database directory', { path: DB_DIR });
}

// Initialize database connection
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

logger.system.info('Database initialized', { path: DB_PATH });

/**
 * Initialize database schema
 */
function initializeSchema() {
  logger.system.info('Initializing database schema');
  
  // Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      authenticated INTEGER DEFAULT 0,
      data TEXT,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      last_activity INTEGER NOT NULL
    )
  `);
  
  // Chat messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      role TEXT NOT NULL,
      message TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    )
  `);
  
  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_expires 
    ON sessions(expires_at);
    
    CREATE INDEX IF NOT EXISTS idx_sessions_user 
    ON sessions(user_id);
    
    CREATE INDEX IF NOT EXISTS idx_chat_session 
    ON chat_messages(session_id, timestamp);
    
    CREATE INDEX IF NOT EXISTS idx_chat_user 
    ON chat_messages(user_id, timestamp);
  `);
  
  logger.system.info('Database schema initialized');
}

// Initialize schema on startup
initializeSchema();

/**
 * Session Management
 */

// Create or update session
function saveSession(sessionId, userId, authenticated, expiresAt, data = {}) {
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO sessions (session_id, user_id, authenticated, data, created_at, expires_at, last_activity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(session_id) DO UPDATE SET
      authenticated = excluded.authenticated,
      data = excluded.data,
      expires_at = excluded.expires_at,
      last_activity = excluded.last_activity
  `);
  
  stmt.run(sessionId, userId, authenticated ? 1 : 0, JSON.stringify(data), now, expiresAt, now);
  
  logger.system.info('Session saved', { sessionId, userId, authenticated });
}

// Get session by ID
function getSession(sessionId) {
  const stmt = db.prepare(`
    SELECT * FROM sessions 
    WHERE session_id = ? AND expires_at > ?
  `);
  
  const session = stmt.get(sessionId, Date.now());
  
  if (session) {
    session.authenticated = Boolean(session.authenticated);
    session.data = session.data ? JSON.parse(session.data) : {};
  }
  
  return session;
}

// Update session activity
function updateSessionActivity(sessionId) {
  const stmt = db.prepare(`
    UPDATE sessions 
    SET last_activity = ? 
    WHERE session_id = ?
  `);
  
  stmt.run(Date.now(), sessionId);
}

// Delete session
function deleteSession(sessionId) {
  const stmt = db.prepare('DELETE FROM sessions WHERE session_id = ?');
  const result = stmt.run(sessionId);
  
  logger.system.info('Session deleted', { sessionId, deleted: result.changes });
  return result.changes > 0;
}

// Clean up expired sessions
function cleanupExpiredSessions() {
  const stmt = db.prepare('DELETE FROM sessions WHERE expires_at <= ?');
  const result = stmt.run(Date.now());
  
  if (result.changes > 0) {
    logger.system.info('Expired sessions cleaned up', { count: result.changes });
  }
  
  return result.changes;
}

/**
 * Chat History Management
 */

// Save chat message
function saveChatMessage(sessionId, userId, role, message) {
  const stmt = db.prepare(`
    INSERT INTO chat_messages (session_id, user_id, timestamp, role, message)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const timestamp = Date.now();
  const result = stmt.run(sessionId, userId, timestamp, role, message);
  
  logger.user.info('Chat message saved', { 
    sessionId, 
    userId, 
    role, 
    messageId: result.lastInsertRowid 
  });
  
  return {
    id: result.lastInsertRowid,
    timestamp,
    role,
    message
  };
}

// Get chat history for session
function getChatHistory(sessionId, limit = 50, offset = 0) {
  const stmt = db.prepare(`
    SELECT id, timestamp, role, message
    FROM chat_messages
    WHERE session_id = ?
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `);
  
  const messages = stmt.all(sessionId, limit, offset);
  
  // Reverse to get chronological order
  return messages.reverse();
}

// Get chat history count for session
function getChatHistoryCount(sessionId) {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM chat_messages
    WHERE session_id = ?
  `);
  
  const result = stmt.get(sessionId);
  return result.count;
}

// Clear chat history for session
function clearChatHistory(sessionId) {
  const stmt = db.prepare('DELETE FROM chat_messages WHERE session_id = ?');
  const result = stmt.run(sessionId);
  
  logger.system.info('Chat history cleared', { sessionId, deleted: result.changes });
  return result.changes;
}

// Get all sessions for user
function getUserSessions(userId) {
  const stmt = db.prepare(`
    SELECT session_id, authenticated, created_at, expires_at, last_activity
    FROM sessions
    WHERE user_id = ? AND expires_at > ?
    ORDER BY last_activity DESC
  `);
  
  return stmt.all(userId, Date.now());
}

/**
 * Database Statistics
 */
function getStats() {
  const sessionCount = db.prepare('SELECT COUNT(*) as count FROM sessions WHERE expires_at > ?').get(Date.now()).count;
  const messageCount = db.prepare('SELECT COUNT(*) as count FROM chat_messages').get().count;
  const dbSize = fs.statSync(DB_PATH).size;
  
  return {
    sessions: sessionCount,
    messages: messageCount,
    dbSizeBytes: dbSize,
    dbSizeMB: (dbSize / 1024 / 1024).toFixed(2)
  };
}

/**
 * Analytics Functions
 */

// Get overall analytics stats
function getAnalyticsStats() {
  const totalMessages = db.prepare('SELECT COUNT(*) as count FROM chat_messages').get().count;
  const totalSessions = db.prepare('SELECT COUNT(*) as count FROM sessions').get().count;
  const activeSessions = db.prepare('SELECT COUNT(*) as count FROM sessions WHERE expires_at > ?').get(Date.now()).count;
  
  const userMessages = db.prepare('SELECT COUNT(*) as count FROM chat_messages WHERE role = ?').get('user').count;
  const assistantMessages = db.prepare('SELECT COUNT(*) as count FROM chat_messages WHERE role = ?').get('assistant').count;
  
  // Average session duration (in minutes)
  const avgDuration = db.prepare(`
    SELECT AVG(last_activity - created_at) / 60000 as avg_minutes
    FROM sessions
    WHERE last_activity > created_at
  `).get().avg_minutes || 0;
  
  return {
    totalMessages,
    userMessages,
    assistantMessages,
    totalSessions,
    activeSessions,
    avgSessionDurationMinutes: Math.round(avgDuration * 10) / 10
  };
}

// Get message statistics for a time period
function getMessageStats(period) {
  const periodMs = parsePeriod(period);
  const since = Date.now() - periodMs;
  
  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_messages,
      SUM(CASE WHEN role = 'assistant' THEN 1 ELSE 0 END) as assistant_messages
    FROM chat_messages
    WHERE timestamp > ?
  `);
  
  return stmt.get(since);
}

// Get session statistics
function getSessionStats() {
  const now = Date.now();
  
  const stats = {
    total: db.prepare('SELECT COUNT(*) as count FROM sessions').get().count,
    active: db.prepare('SELECT COUNT(*) as count FROM sessions WHERE expires_at > ?').get(now).count,
    authenticated: db.prepare('SELECT COUNT(*) as count FROM sessions WHERE authenticated = 1 AND expires_at > ?').get(now).count
  };
  
  return stats;
}

// Get usage trends over time
function getUsageTrends(period) {
  const periodMs = parsePeriod(period);
  const since = Date.now() - periodMs;
  
  // Group by day
  const stmt = db.prepare(`
    SELECT 
      DATE(timestamp / 1000, 'unixepoch') as date,
      COUNT(*) as message_count,
      COUNT(DISTINCT session_id) as unique_sessions
    FROM chat_messages
    WHERE timestamp > ?
    GROUP BY date
    ORDER BY date ASC
  `);
  
  return stmt.all(since);
}

// Helper to parse period strings like '7d', '30d', '1h'
function parsePeriod(period) {
  const match = period.match(/^(\d+)([hdwm])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch(unit) {
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'w': return value * 7 * 24 * 60 * 60 * 1000;
    case 'm': return value * 30 * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

/**
 * Periodic cleanup (run every hour)
 */
setInterval(() => {
  cleanupExpiredSessions();
}, 60 * 60 * 1000);

// Cleanup on startup
cleanupExpiredSessions();

/**
 * Graceful shutdown
 */
process.on('exit', () => {
  db.close();
  logger.system.info('Database connection closed');
});

process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

module.exports = {
  db,
  // Session methods
  saveSession,
  getSession,
  updateSessionActivity,
  deleteSession,
  cleanupExpiredSessions,
  getUserSessions,
  // Chat methods
  saveChatMessage,
  getChatHistory,
  getChatHistoryCount,
  clearChatHistory,
  // Stats
  getStats,
  // Analytics
  getAnalyticsStats,
  getMessageStats,
  getSessionStats,
  getUsageTrends
};
