/**
 * Chat Routes
 * 
 * Handles chat messages with ARDEN AI
 * Messages are persisted to SQLite database
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { executeArden } = require('../services/ai-providers');
const { logInteraction } = require('../services/session');
const { executeSkillIfDetected } = require('../services/skill-executor');
const wsService = require('../services/websocket');
const { 
  saveChatMessage, 
  getChatHistory, 
  getChatHistoryCount, 
  clearChatHistory 
} = require('../services/database');

/**
 * POST /api/chat
 * Send a message to ARDEN
 */
router.post('/', async (req, res) => {
  logger.system.info('=== CHAT POST REQUEST RECEIVED ===', {
    hasBody: !!req.body,
    bodyKeys: Object.keys(req.body || {}),
    message: req.body?.message?.substring(0, 50),
    isAuthenticated: req.session?.authenticated,
    sessionID: req.sessionID
  });
  
  const { message, sessionId } = req.body;
  
  if (!message || message.trim() === '') {
    logger.system.warn('Empty message received');
    return res.status(400).json({ 
      success: false, 
      error: 'Message is required' 
    });
  }
  
  const currentSessionId = sessionId || req.sessionID;
  const userId = req.session?.userId || req.sessionID; // Use session ID as user ID if not set
  
  logger.user.info('Chat message received', {
    sessionId: currentSessionId,
    userId,
    messageLength: message.length,
    messagePreview: message.substring(0, 100)
  });
  
  try {
    // Save user message to database
    const userMsg = saveChatMessage(currentSessionId, userId, 'user', message);
    
    // First, check if this is a skill request (weather, notes, etc.)
    const skillResponse = await executeSkillIfDetected(message);
    
    let response;
    if (skillResponse) {
      // Skill was executed, use its output
      response = skillResponse;
      logger.system.info('Skill executed', { sessionId: currentSessionId });
    } else {
      // No skill detected, use AI
      response = await executeArden(message, userId, currentSessionId);
    }
    
    // Save AI response to database
    const aiMsg = saveChatMessage(currentSessionId, userId, 'assistant', response);
    
    // Log interaction to file (for backup/analysis)
    await logInteraction(userId, 'web', message, response);
    
    // Send WebSocket notification for real-time updates
    wsService.notifyChatMessage(currentSessionId, {
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
      messageId: null
    });
    
    logger.user.info('Chat response sent', {
      sessionId: currentSessionId,
      responseLength: response.length
    });
    
    return res.json({
      success: true,
      response: response,
      sessionId: currentSessionId,
      timestamp: new Date().toISOString(),
      messageId: null
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
  const offset = parseInt(req.query.offset) || 0;
  
  try {
    const messages = getChatHistory(sessionId, limit, offset);
    const total = getChatHistoryCount(sessionId);
    
    // Transform database format to API format
    const formattedMessages = [];
    for (let i = 0; i < messages.length; i += 2) {
      const userMsg = messages[i];
      const aiMsg = messages[i + 1];
      
      if (userMsg && userMsg.role === 'user') {
        formattedMessages.push({
          id: userMsg.id,
          timestamp: new Date(userMsg.timestamp).toISOString(),
          user: userMsg.message,
          arden: aiMsg ? aiMsg.message : ''
        });
      }
    }
    
    logger.system.info('Chat history requested', {
      sessionId,
      messageCount: formattedMessages.length,
      total
    });
    
    return res.json({
      success: true,
      sessionId,
      messages: formattedMessages,
      total: Math.ceil(total / 2) // Divide by 2 since we store user + assistant separately
    });
  } catch (error) {
    logger.system.error('Failed to get chat history', {
      sessionId,
      error: error.message
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve chat history'
    });
  }
});

/**
 * DELETE /api/chat/clear
 * Clear chat history for current session
 */
router.delete('/clear', (req, res) => {
  const sessionId = req.query.sessionId || req.sessionID;
  
  try {
    const deleted = clearChatHistory(sessionId);
    
    logger.system.info('Chat history cleared', { sessionId, deleted });
    
    return res.json({
      success: true,
      message: `Chat history cleared (${deleted} messages deleted)`
    });
  } catch (error) {
    logger.system.error('Failed to clear chat history', {
      sessionId,
      error: error.message
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to clear chat history'
    });
  }
});

module.exports = router;
