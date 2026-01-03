/**
 * Analytics Routes
 * Provides statistics and analytics data
 */

const express = require('express');
const router = express.Router();
const db = require('../services/database');
const wsService = require('../services/websocket');
const logger = require('../utils/logger');

// GET /api/analytics - Get analytics overview
router.get('/', async (req, res) => {
  try {
    const stats = db.getAnalyticsStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.system.error('Failed to get analytics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to load analytics'
    });
  }
});

// GET /api/analytics/messages - Get message statistics
router.get('/messages', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const messageStats = db.getMessageStats(period);
    
    res.json({
      success: true,
      stats: messageStats
    });
  } catch (error) {
    logger.system.error('Failed to get message stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to load message statistics'
    });
  }
});

// GET /api/analytics/sessions - Get session statistics
router.get('/sessions', async (req, res) => {
  try {
    const sessionStats = db.getSessionStats();
    
    res.json({
      success: true,
      stats: sessionStats
    });
  } catch (error) {
    logger.system.error('Failed to get session stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to load session statistics'
    });
  }
});

// GET /api/analytics/trends - Get usage trends over time
router.get('/trends', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const trends = db.getUsageTrends(period);
    
    res.json({
      success: true,
      trends
    });
  } catch (error) {
    logger.system.error('Failed to get usage trends', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to load usage trends'
    });
  }
});

// GET /api/analytics/active-sessions - Get active sessions with details
router.get('/active-sessions', async (req, res) => {
  try {
    const sessions = db.getActiveSessions();
    const wsConnections = wsService.getActiveConnections();
    
    // Merge WebSocket connection info with session data
    const sessionsWithWs = sessions.map(session => {
      const wsConnection = wsConnections.find(ws => ws.sessionId === session.sessionId);
      return {
        ...session,
        hasWebSocket: !!wsConnection,
        wsConnectedAt: wsConnection?.connectedAt || null,
        wsConnectedMinutes: wsConnection?.connectedMinutes || null
      };
    });
    
    res.json({
      success: true,
      sessions: sessionsWithWs,
      totalSessions: sessionsWithWs.length,
      webSocketConnections: wsConnections.length
    });
  } catch (error) {
    logger.system.error('Failed to get active sessions', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to load active sessions'
    });
  }
});

module.exports = router;
