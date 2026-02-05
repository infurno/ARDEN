/**
 * Clawdbot Partnership Routes
 * Provides API endpoints for bidirectional ARDEN-Clawdbot communication
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const path = require('path');
const logger = require('../utils/logger');
const ClawdbotClient = require('../services/clawdbot-partnership-client');

const ARDEN_ROOT = path.resolve(__dirname, '../..');

// Middleware to verify Clawdbot webhook signatures
function verifyClawdbotWebhook(req, res, next) {
  const signature = req.headers['x-clawdbot-signature'];
  const secret = process.env.CLAWDBOT_WEBHOOK_SECRET || req.app.get('clawdbotWebhookSecret');
  
  if (!signature || !secret) {
    return res.status(401).json({
      success: false,
      error: 'Webhook verification failed'
    });
  }
  
  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto.createHmac('sha256', secret)
                                 .update(payload)
                                 .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).json({
      success: false,
      error: 'Invalid webhook signature'
    });
  }
  
  next();
}

// Middleware for ARDEN-Clawdbot partnership authentication
function verifyPartnership(req, res, next) {
  const ardenHeader = req.headers['x-arden-request'];
  if (ardenHeader !== 'partnership') {
    return res.status(401).json({
      success: false,
      error: 'Invalid partnership request'
    });
  }
  
  // Add Clawdbot client to request for easy access
  req.clawdbotClient = new ClawdbotClient();
  next();
}

// POST /api/clawdbot-partnership/request - Send request to Clawdbot
router.post('/request', verifyPartnership, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { action, platform, content, metadata = {} } = req.body;
    
    if (!action || !platform || !content) {
      return res.status(400).json({
        success: false,
        error: 'Action, platform, and content are required'
      });
    }
    
    logger.system.info('Sending partnership request to Clawdbot', { 
      action, platform, content, metadata 
    });
    
    const client = new ClawdbotClient();
    const result = await client.sendRequest(action, platform, content, metadata);
    
    const executionTime = Date.now() - startTime;
    
    logger.system.info('Partnership request sent successfully', { 
      requestId: result.request_id,
      executionTime 
    });
    
    res.json({
      success: true,
      request: result,
      executionTimeMs: executionTime
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    logger.system.error('Failed to send partnership request', { 
      error: error.message,
      executionTime 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/clawdbot-partnership/request/:requestId/status - Get request status
router.get('/request/:requestId/status', verifyPartnership, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { requestId } = req.params;
    
    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required'
      });
    }
    
    logger.system.info('Fetching partnership request status', { requestId });
    
    const client = new ClawdbotClient();
    const request = await client.getStatus(requestId);
    
    const executionTime = Date.now() - startTime;
    
    logger.system.info('Request status retrieved', { 
      requestId,
      status: request.status,
      executionTime 
    });
    
    res.json({
      success: true,
      request,
      executionTimeMs: executionTime
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    logger.system.error('Failed to fetch request status', { 
      requestId: req.params.requestId,
      error: error.message,
      executionTime 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/clawdbot-partnership/capabilities - Get Clawdbot capabilities
router.get('/capabilities', verifyPartnership, async (req, res) => {
  const startTime = Date.now();
  
  try {
    logger.system.info('Fetching Clawdbot partnership capabilities');
    
    const client = new ClawdbotClient();
    const capabilities = await client.getCapabilities();
    
    const executionTime = Date.now() - startTime;
    
    logger.system.info('Capabilities retrieved successfully', { 
      platforms: capabilities.supported_platforms?.length || 0,
      executionTime 
    });
    
    res.json({
      success: true,
      capabilities,
      executionTimeMs: executionTime
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    logger.system.error('Failed to fetch capabilities', { 
      error: error.message,
      executionTime 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/clawdbot-partnership/context/sync - Sync context to Clawdbot
router.post('/context/sync', verifyPartnership, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { context, sync_type = 'delta' } = req.body;
    
    if (!context) {
      return res.status(400).json({
        success: false,
        error: 'Context data is required'
      });
    }
    
    logger.system.info('Syncing context to Clawdbot', { 
      sync_type,
      context_keys: Object.keys(context)
    });
    
    const client = new ClawdbotClient();
    const result = await client.syncContext(context, sync_type);
    
    const executionTime = Date.now() - startTime;
    
    logger.system.info('Context synced successfully', { 
      syncId: result.sync_id,
      executionTime 
    });
    
    res.json({
      success: true,
      sync: result,
      executionTimeMs: executionTime
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    logger.system.error('Failed to sync context', { 
      error: error.message,
      executionTime 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/clawdbot-partnership/context/receive - Receive context from Clawdbot
router.get('/context/receive', verifyPartnership, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { platform, since } = req.query;
    
    logger.system.info('Receiving context from Clawdbot', { 
      platform: platform || 'all',
      since 
    });
    
    const client = new ClawdbotClient();
    const context = await client.receiveContext(platform);
    
    const executionTime = Date.now() - startTime;
    
    logger.system.info('Context received successfully', { 
      itemCount: context.items_count || 0,
      executionTime 
    });
    
    res.json({
      success: true,
      context,
      executionTimeMs: executionTime
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    logger.system.error('Failed to receive context', { 
      error: error.message,
      executionTime 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/clawdbot-partnership/health - Partnership health check
router.get('/health', verifyPartnership, async (req, res) => {
  const startTime = Date.now();
  
  try {
    logger.system.debug('Checking Clawdbot partnership health');
    
    const client = new ClawdbotClient();
    const health = await client.healthCheck();
    
    const executionTime = Date.now() - startTime;
    
    res.json({
      success: true,
      health: {
        ...health,
        check_time: new Date().toISOString(),
        response_time_ms: executionTime
      }
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    logger.system.error('Partnership health check failed', { 
      error: error.message,
      executionTime 
    });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/webhooks/clawdbot - Handle Clawdbot webhooks (reverse direction)
router.post('/webhooks/clawdbot', verifyClawdbotWebhook, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { event, request_id, status, result, timestamp } = req.body;
    
    if (!event) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook payload'
      });
    }
    
    logger.system.info('Processing Clawdbot webhook', { 
      event,
      requestId: request_id,
      status 
    });
    
    // Process different event types
    switch (event) {
      case 'request.updated':
        // Update local request cache
        logger.system.info('Request status updated', { 
          requestId: request_id,
          newStatus: status 
        });
        break;
        
      case 'context.updated':
        // Update local context store
        logger.system.info('Context updated by Clawdbot', { 
          syncId: result?.sync_id 
        });
        break;
        
      case 'partnership.status_changed':
        // Handle partnership status changes
        logger.system.warning('Partnership status changed', { 
          status,
          reason: result?.reason 
        });
        break;
        
      default:
        logger.system.info('Unknown webhook event', { event });
    }
    
    // Store webhook event for audit/log
    const webhookEvent = {
      event,
      request_id,
      status,
      result,
      timestamp,
      received_at: new Date().toISOString()
    };
    
    // TODO: Store webhook event in database or file system
    
    const executionTime = Date.now() - startTime;
    
    res.json({
      success: true,
      message: 'Webhook processed successfully',
      executionTimeMs: executionTime
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    logger.system.error('Failed to process Clawdbot webhook', { 
      error: error.message,
      executionTime 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook'
    });
  }
});

module.exports = router;