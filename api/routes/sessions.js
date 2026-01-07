/**
 * Session Management Routes
 * 
 * Provides endpoints for viewing and managing active sessions
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const db = require('../services/database');

/**
 * GET /api/sessions
 * Get all active sessions with details
 */
router.get('/', (req, res) => {
  try {
    const sessions = db.getActiveSessions();
    const currentSessionId = req.sessionID;
    
    // Mark current session and add message count
    const enrichedSessions = sessions.map(session => {
      // Get message count for this session
      const messageCount = db.getChatHistoryCount(session.sessionId) || 0;
      
      return {
        ...session,
        isCurrent: session.sessionId === currentSessionId,
        messageCount
      };
    });
    
    // Calculate statistics
    const stats = {
      total: enrichedSessions.length,
      active: enrichedSessions.filter(s => !s.isIdle).length,
      idle: enrichedSessions.filter(s => s.isIdle).length,
      web: enrichedSessions.filter(s => s.source === 'web').length,
      telegram: enrichedSessions.filter(s => s.source === 'telegram').length
    };
    
    logger.system.info('Sessions retrieved', {
      total: stats.total,
      userId: req.session?.userId || 'unknown'
    });
    
    res.json({
      success: true,
      sessions: enrichedSessions,
      stats
    });
  } catch (error) {
    logger.system.error('Error retrieving sessions', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sessions'
    });
  }
});

/**
 * GET /api/sessions/stats
 * Get session statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = db.getSessionStats();
    
    logger.system.info('Session stats retrieved', {
      userId: req.session?.userId || 'unknown'
    });
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.system.error('Error retrieving session stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve session statistics'
    });
  }
});

/**
 * DELETE /api/sessions/:sessionId
 * Delete a specific session
 */
router.delete('/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const currentSessionId = req.sessionID;
    
    // Prevent deleting current session
    if (sessionId === currentSessionId) {
      logger.system.warn('Attempt to delete current session', {
        sessionId,
        userId: req.session?.userId || 'unknown'
      });
      
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your current session'
      });
    }
    
    // Delete the session
    const deleted = db.deleteSession(sessionId);
    
    if (deleted) {
      logger.system.info('Session deleted via API', {
        sessionId,
        deletedBy: req.session?.userId || 'unknown'
      });
      
      res.json({
        success: true,
        message: 'Session deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
  } catch (error) {
    logger.system.error('Error deleting session', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to delete session'
    });
  }
});

/**
 * DELETE /api/sessions
 * Delete all sessions except current one
 */
router.delete('/', (req, res) => {
  try {
    const currentSessionId = req.sessionID;
    const sessions = db.getActiveSessions();
    
    let deletedCount = 0;
    sessions.forEach(session => {
      if (session.sessionId !== currentSessionId) {
        const deleted = db.deleteSession(session.sessionId);
        if (deleted) {
          deletedCount++;
        }
      }
    });
    
    logger.system.info('Multiple sessions deleted via API', {
      count: deletedCount,
      deletedBy: req.session?.userId || 'unknown'
    });
    
    res.json({
      success: true,
      message: `${deletedCount} session(s) deleted successfully`,
      deletedCount
    });
  } catch (error) {
    logger.system.error('Error deleting sessions', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to delete sessions'
    });
  }
});

/**
 * POST /api/sessions/cleanup
 * Manually trigger cleanup of expired sessions
 */
router.post('/cleanup', (req, res) => {
  try {
    const cleanedCount = db.cleanupExpiredSessions();
    
    logger.system.info('Manual session cleanup triggered', {
      count: cleanedCount,
      userId: req.session?.userId || 'unknown'
    });
    
    res.json({
      success: true,
      message: `${cleanedCount} expired session(s) cleaned up`,
      cleanedCount
    });
  } catch (error) {
    logger.system.error('Error cleaning up sessions', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup sessions'
    });
  }
});

module.exports = router;
