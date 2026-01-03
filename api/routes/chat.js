/**
 * Chat Routes
 * 
 * Handles chat messages with ARDEN AI
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { executeArden } = require('../services/ai-providers');
const { logInteraction } = require('../services/session');

// In-memory chat history (per session)
const chatSessions = new Map();

/**
 * POST /api/chat
 * Send a message to ARDEN
 */
router.post('/', async (req, res) => {
  const { message, sessionId } = req.body;
  
  if (!message || message.trim() === '') {
    return res.status(400).json({ 
      success: false, 
      error: 'Message is required' 
    });
  }
  
  const currentSessionId = sessionId || req.sessionID;
  const userId = req.session?.userId || 'web-user';
  
  logger.user.info('Chat message received', {
    sessionId: currentSessionId,
    messageLength: message.length
  });
  
  try {
    // Execute ARDEN
    const response = await executeArden(message);
    
    // Log interaction
    await logInteraction(userId, 'web', message, response);
    
    // Store in session history
    if (!chatSessions.has(currentSessionId)) {
      chatSessions.set(currentSessionId, []);
    }
    
    const history = chatSessions.get(currentSessionId);
    const chatEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      user: message,
      arden: response
    };
    
    history.push(chatEntry);
    
    // Keep only last 100 messages per session
    if (history.length > 100) {
      history.shift();
    }
    
    logger.user.info('Chat response sent', {
      sessionId: currentSessionId,
      responseLength: response.length
    });
    
    return res.json({
      success: true,
      response: response,
      sessionId: currentSessionId,
      timestamp: chatEntry.timestamp,
      messageId: chatEntry.id
    });
    
  } catch (error) {
    logger.user.error('Chat error', {
      error: error.message,
      sessionId: currentSessionId
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to process message',
      details: error.message
    });
  }
});

/**
 * GET /api/chat/history
 * Get chat history for current session
 */
router.get('/history', (req, res) => {
  const sessionId = req.query.sessionId || req.sessionID;
  const limit = parseInt(req.query.limit) || 50;
  
  const history = chatSessions.get(sessionId) || [];
  
  // Return most recent messages
  const recentHistory = history.slice(-limit);
  
  logger.system.info('Chat history requested', {
    sessionId,
    messageCount: recentHistory.length
  });
  
  return res.json({
    success: true,
    sessionId,
    messages: recentHistory,
    total: history.length
  });
});

/**
 * DELETE /api/chat/clear
 * Clear chat history for current session
 */
router.delete('/clear', (req, res) => {
  const sessionId = req.query.sessionId || req.sessionID;
  
  if (chatSessions.has(sessionId)) {
    chatSessions.delete(sessionId);
    
    logger.system.info('Chat history cleared', { sessionId });
    
    return res.json({
      success: true,
      message: 'Chat history cleared'
    });
  }
  
  return res.json({
    success: true,
    message: 'No history to clear'
  });
});

module.exports = router;
