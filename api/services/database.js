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
  
  // Skills execution tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS skill_executions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_id TEXT NOT NULL,
      session_id TEXT,
      user_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      success INTEGER DEFAULT 1,
      execution_time_ms INTEGER,
      error_message TEXT,
      metadata TEXT
    )
  `);
  
  // API usage tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      session_id TEXT,
      user_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      prompt_tokens INTEGER DEFAULT 0,
      completion_tokens INTEGER DEFAULT 0,
      total_tokens INTEGER DEFAULT 0,
      estimated_cost_usd REAL DEFAULT 0,
      request_type TEXT,
      success INTEGER DEFAULT 1,
      error_message TEXT
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
    
    CREATE INDEX IF NOT EXISTS idx_skill_executions_skill
    ON skill_executions(skill_id, timestamp);
    
    CREATE INDEX IF NOT EXISTS idx_skill_executions_user
    ON skill_executions(user_id, timestamp);
    
    CREATE INDEX IF NOT EXISTS idx_skill_executions_timestamp
    ON skill_executions(timestamp);
    
    CREATE INDEX IF NOT EXISTS idx_api_usage_provider
    ON api_usage(provider, timestamp);
    
    CREATE INDEX IF NOT EXISTS idx_api_usage_user
    ON api_usage(user_id, timestamp);
    
    CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp
    ON api_usage(timestamp);
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
 * Get all active sessions with details
 */
function getActiveSessions() {
  const stmt = db.prepare(`
    SELECT 
      session_id,
      user_id,
      authenticated,
      created_at,
      expires_at,
      last_activity,
      data
    FROM sessions
    WHERE expires_at > ?
    ORDER BY last_activity DESC
  `);
  
  const sessions = stmt.all(Date.now());
  
  // Parse session data and calculate activity
  return sessions.map(session => {
    const sessionData = session.data ? JSON.parse(session.data) : {};
    const now = Date.now();
    const createdDate = new Date(session.created_at);
    const lastActivityDate = new Date(session.last_activity);
    const expiresDate = new Date(session.expires_at);
    
    // Calculate session duration
    const durationMs = session.last_activity - session.created_at;
    const durationMinutes = Math.floor(durationMs / 60000);
    
    // Determine session source/type
    let source = 'web';
    if (sessionData.source) {
      source = sessionData.source;
    } else if (session.user_id && session.user_id.includes('telegram')) {
      source = 'telegram';
    }
    
    // Check if session is idle
    const idleMs = now - session.last_activity;
    const idleMinutes = Math.floor(idleMs / 60000);
    const isIdle = idleMs > 5 * 60 * 1000; // Idle if no activity for 5 minutes
    
    return {
      sessionId: session.session_id,
      userId: session.user_id,
      authenticated: Boolean(session.authenticated),
      source,
      createdAt: session.created_at,
      createdDate: createdDate.toISOString(),
      lastActivity: session.last_activity,
      lastActivityDate: lastActivityDate.toISOString(),
      expiresAt: session.expires_at,
      expiresDate: expiresDate.toISOString(),
      durationMinutes,
      idleMinutes,
      isIdle,
      ipAddress: sessionData.ipAddress || null,
      userAgent: sessionData.userAgent || null
    };
  });
}

/**
 * Skills Execution Tracking
 */

// Record skill execution
function recordSkillExecution(skillId, userId, sessionId, success, executionTimeMs, errorMessage = null, metadata = {}) {
  const stmt = db.prepare(`
    INSERT INTO skill_executions (skill_id, session_id, user_id, timestamp, success, execution_time_ms, error_message, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const timestamp = Date.now();
  const result = stmt.run(
    skillId,
    sessionId,
    userId,
    timestamp,
    success ? 1 : 0,
    executionTimeMs,
    errorMessage,
    JSON.stringify(metadata)
  );
  
  logger.system.info('Skill execution recorded', {
    skillId,
    userId,
    success,
    executionTimeMs,
    executionId: result.lastInsertRowid
  });
  
  return {
    id: result.lastInsertRowid,
    timestamp
  };
}

// Get skill execution statistics
function getSkillExecutionStats(skillId = null, period = '30d') {
  const periodMs = parsePeriod(period);
  const since = Date.now() - periodMs;
  
  let query;
  let params;
  
  if (skillId) {
    // Stats for specific skill
    query = `
      SELECT 
        skill_id,
        COUNT(*) as total_executions,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_executions,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_executions,
        AVG(execution_time_ms) as avg_execution_time_ms,
        MAX(timestamp) as last_execution,
        MIN(timestamp) as first_execution
      FROM skill_executions
      WHERE skill_id = ? AND timestamp > ?
      GROUP BY skill_id
    `;
    params = [skillId, since];
  } else {
    // Stats for all skills
    query = `
      SELECT 
        skill_id,
        COUNT(*) as total_executions,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_executions,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_executions,
        AVG(execution_time_ms) as avg_execution_time_ms,
        MAX(timestamp) as last_execution,
        MIN(timestamp) as first_execution
      FROM skill_executions
      WHERE timestamp > ?
      GROUP BY skill_id
      ORDER BY total_executions DESC
    `;
    params = [since];
  }
  
  const stmt = db.prepare(query);
  const results = stmt.all(...params);
  
  // Calculate success rate and format dates
  return results.map(row => ({
    skillId: row.skill_id,
    totalExecutions: row.total_executions,
    successfulExecutions: row.successful_executions,
    failedExecutions: row.failed_executions,
    successRate: row.total_executions > 0 ? (row.successful_executions / row.total_executions * 100).toFixed(1) : 0,
    avgExecutionTimeMs: row.avg_execution_time_ms ? Math.round(row.avg_execution_time_ms) : null,
    lastExecution: row.last_execution,
    firstExecution: row.first_execution
  }));
}

// Get recent skill executions (execution history)
function getSkillExecutionHistory(skillId = null, limit = 50) {
  let query;
  let params;
  
  if (skillId) {
    query = `
      SELECT 
        id,
        skill_id,
        user_id,
        session_id,
        timestamp,
        success,
        execution_time_ms,
        error_message,
        metadata
      FROM skill_executions
      WHERE skill_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `;
    params = [skillId, limit];
  } else {
    query = `
      SELECT 
        id,
        skill_id,
        user_id,
        session_id,
        timestamp,
        success,
        execution_time_ms,
        error_message,
        metadata
      FROM skill_executions
      ORDER BY timestamp DESC
      LIMIT ?
    `;
    params = [limit];
  }
  
  const stmt = db.prepare(query);
  const results = stmt.all(...params);
  
  return results.map(row => ({
    id: row.id,
    skillId: row.skill_id,
    userId: row.user_id,
    sessionId: row.session_id,
    timestamp: row.timestamp,
    timestampDate: new Date(row.timestamp).toISOString(),
    success: Boolean(row.success),
    executionTimeMs: row.execution_time_ms,
    errorMessage: row.error_message,
    metadata: row.metadata ? JSON.parse(row.metadata) : {}
  }));
}

// Get skill usage trends over time
function getSkillUsageTrends(period = '30d') {
  const periodMs = parsePeriod(period);
  const since = Date.now() - periodMs;
  
  const stmt = db.prepare(`
    SELECT 
      DATE(timestamp / 1000, 'unixepoch') as date,
      skill_id,
      COUNT(*) as execution_count,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_count
    FROM skill_executions
    WHERE timestamp > ?
    GROUP BY date, skill_id
    ORDER BY date ASC, execution_count DESC
  `);
  
  return stmt.all(since);
}

// Get most popular skills
function getMostPopularSkills(limit = 10, period = '30d') {
  const periodMs = parsePeriod(period);
  const since = Date.now() - periodMs;
  
  const stmt = db.prepare(`
    SELECT 
      skill_id,
      COUNT(*) as execution_count,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_count,
      COUNT(DISTINCT user_id) as unique_users,
      MAX(timestamp) as last_used
    FROM skill_executions
    WHERE timestamp > ?
    GROUP BY skill_id
    ORDER BY execution_count DESC
    LIMIT ?
  `);
  
  return stmt.all(since, limit);
}

/**
 * API Usage Tracking
 */

// Model pricing (USD per 1K tokens)
const MODEL_PRICING = {
  // OpenAI
  'gpt-4': { prompt: 0.03, completion: 0.06 },
  'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
  'gpt-4o': { prompt: 0.0025, completion: 0.01 },
  'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
  'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
  
  // Anthropic Claude
  'claude-3-opus': { prompt: 0.015, completion: 0.075 },
  'claude-3-sonnet': { prompt: 0.003, completion: 0.015 },
  'claude-3-haiku': { prompt: 0.00025, completion: 0.00125 },
  'claude-3-5-sonnet': { prompt: 0.003, completion: 0.015 },
  
  // Ollama (local - free)
  'ollama': { prompt: 0, completion: 0 },
  
  // LM Studio (local - free)
  'lmstudio': { prompt: 0, completion: 0 }
};

// Calculate cost based on model and tokens
function calculateCost(model, promptTokens, completionTokens) {
  // Normalize model name
  const normalizedModel = model.toLowerCase();
  
  // Find matching pricing
  let pricing = MODEL_PRICING[normalizedModel];
  
  // If exact match not found, try partial match
  if (!pricing) {
    for (const [key, value] of Object.entries(MODEL_PRICING)) {
      if (normalizedModel.includes(key)) {
        pricing = value;
        break;
      }
    }
  }
  
  // Default to free if no pricing found
  if (!pricing) {
    pricing = { prompt: 0, completion: 0 };
  }
  
  // Calculate cost (pricing is per 1K tokens)
  const promptCost = (promptTokens / 1000) * pricing.prompt;
  const completionCost = (completionTokens / 1000) * pricing.completion;
  
  return promptCost + completionCost;
}

// Record API usage
function recordApiUsage(provider, model, userId, sessionId, promptTokens, completionTokens, requestType = 'chat', success = true, errorMessage = null) {
  const stmt = db.prepare(`
    INSERT INTO api_usage (provider, model, session_id, user_id, timestamp, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd, request_type, success, error_message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const timestamp = Date.now();
  const totalTokens = promptTokens + completionTokens;
  const estimatedCost = calculateCost(model, promptTokens, completionTokens);
  
  const result = stmt.run(
    provider,
    model,
    sessionId,
    userId,
    timestamp,
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCost,
    requestType,
    success ? 1 : 0,
    errorMessage
  );
  
  logger.system.info('API usage recorded', {
    provider,
    model,
    userId,
    totalTokens,
    estimatedCost: `$${estimatedCost.toFixed(6)}`,
    usageId: result.lastInsertRowid
  });
  
  return {
    id: result.lastInsertRowid,
    timestamp,
    estimatedCost
  };
}

// Get API usage statistics
function getApiUsageStats(period = '30d', provider = null) {
  const periodMs = parsePeriod(period);
  const since = Date.now() - periodMs;
  
  let query;
  let params;
  
  if (provider) {
    query = `
      SELECT 
        provider,
        model,
        COUNT(*) as total_requests,
        SUM(prompt_tokens) as total_prompt_tokens,
        SUM(completion_tokens) as total_completion_tokens,
        SUM(total_tokens) as total_tokens,
        SUM(estimated_cost_usd) as total_cost_usd,
        AVG(estimated_cost_usd) as avg_cost_per_request,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_requests,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_requests
      FROM api_usage
      WHERE provider = ? AND timestamp > ?
      GROUP BY provider, model
    `;
    params = [provider, since];
  } else {
    query = `
      SELECT 
        provider,
        model,
        COUNT(*) as total_requests,
        SUM(prompt_tokens) as total_prompt_tokens,
        SUM(completion_tokens) as total_completion_tokens,
        SUM(total_tokens) as total_tokens,
        SUM(estimated_cost_usd) as total_cost_usd,
        AVG(estimated_cost_usd) as avg_cost_per_request,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_requests,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_requests
      FROM api_usage
      WHERE timestamp > ?
      GROUP BY provider, model
      ORDER BY total_cost_usd DESC
    `;
    params = [since];
  }
  
  const stmt = db.prepare(query);
  return stmt.all(...params);
}

// Get API usage trends over time
function getApiUsageTrends(period = '30d') {
  const periodMs = parsePeriod(period);
  const since = Date.now() - periodMs;
  
  const stmt = db.prepare(`
    SELECT 
      DATE(timestamp / 1000, 'unixepoch') as date,
      provider,
      model,
      COUNT(*) as request_count,
      SUM(total_tokens) as total_tokens,
      SUM(estimated_cost_usd) as total_cost_usd
    FROM api_usage
    WHERE timestamp > ?
    GROUP BY date, provider, model
    ORDER BY date ASC
  `);
  
  return stmt.all(since);
}

// Get total cost summary
function getApiCostSummary(period = '30d') {
  const periodMs = parsePeriod(period);
  const since = Date.now() - periodMs;
  
  const stmt = db.prepare(`
    SELECT 
      SUM(total_tokens) as total_tokens,
      SUM(estimated_cost_usd) as total_cost_usd,
      COUNT(*) as total_requests,
      COUNT(DISTINCT provider) as providers_used,
      AVG(estimated_cost_usd) as avg_cost_per_request
    FROM api_usage
    WHERE timestamp > ?
  `);
  
  return stmt.get(since);
}

// Get recent API usage history
function getApiUsageHistory(limit = 50, provider = null) {
  let query;
  let params;
  
  if (provider) {
    query = `
      SELECT 
        id,
        provider,
        model,
        user_id,
        session_id,
        timestamp,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        estimated_cost_usd,
        request_type,
        success,
        error_message
      FROM api_usage
      WHERE provider = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `;
    params = [provider, limit];
  } else {
    query = `
      SELECT 
        id,
        provider,
        model,
        user_id,
        session_id,
        timestamp,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        estimated_cost_usd,
        request_type,
        success,
        error_message
      FROM api_usage
      ORDER BY timestamp DESC
      LIMIT ?
    `;
    params = [limit];
  }
  
  const stmt = db.prepare(query);
  const results = stmt.all(...params);
  
  return results.map(row => ({
    ...row,
    timestampDate: new Date(row.timestamp).toISOString(),
    success: Boolean(row.success)
  }));
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
  getActiveSessions,
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
  getUsageTrends,
  // Skills execution tracking
  recordSkillExecution,
  getSkillExecutionStats,
  getSkillExecutionHistory,
  getSkillUsageTrends,
  getMostPopularSkills,
  // API usage tracking
  recordApiUsage,
  getApiUsageStats,
  getApiUsageTrends,
  getApiCostSummary,
  getApiUsageHistory
};
