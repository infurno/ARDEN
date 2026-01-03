/**
 * WebSocket Service
 * Provides real-time bidirectional communication between server and clients
 */

const WebSocket = require('ws');
const logger = require('../utils/logger');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // sessionId -> { ws, userId, connectedAt, clientId }
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    logger.system.info('WebSocket server initialized', { path: '/ws' });
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    const clientId = this.generateClientId();
    let sessionId = null;
    let userId = null;

    logger.system.info('WebSocket client connected', { clientId });

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message, clientId);

        // Store session info from auth message
        if (message.type === 'auth') {
          // Support both data.sessionId and root sessionId
          sessionId = message.data?.sessionId || message.sessionId;
          userId = message.data?.userId || message.userId || 'unknown';
          this.clients.set(sessionId, {
            ws,
            userId,
            clientId,
            connectedAt: Date.now()
          });
          logger.system.info('WebSocket authenticated', { clientId, sessionId, userId });
        }
      } catch (error) {
        logger.system.error('WebSocket message error', { 
          clientId, 
          error: error.message 
        });
      }
    });

    // Handle connection close
    ws.on('close', () => {
      if (sessionId) {
        this.clients.delete(sessionId);
      }
      logger.system.info('WebSocket client disconnected', { clientId, sessionId });
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.system.error('WebSocket error', { 
        clientId, 
        sessionId,
        error: error.message 
      });
    });

    // Send welcome message
    this.sendToClient(ws, {
      type: 'connected',
      clientId,
      timestamp: Date.now()
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  handleMessage(ws, message, clientId) {
    logger.system.info('WebSocket message received', { 
      clientId, 
      type: message.type 
    });

    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: Date.now() });
        break;
      
      case 'auth':
        // Authentication handled in connection handler
        const authSessionId = message.data?.sessionId || message.sessionId;
        this.sendToClient(ws, { 
          type: 'auth',
          data: { 
            success: true,
            sessionId: authSessionId
          },
          timestamp: Date.now()
        });
        break;
      
      case 'subscribe':
        // Client wants to subscribe to specific channels
        this.sendToClient(ws, { 
          type: 'subscribed', 
          channels: message.channels,
          timestamp: Date.now()
        });
        break;
      
      default:
        logger.system.warn('Unknown WebSocket message type', { 
          type: message.type, 
          clientId 
        });
    }
  }

  /**
   * Send message to specific client
   */
  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Send message to client by session ID
   */
  sendToSession(sessionId, data) {
    const clientInfo = this.clients.get(sessionId);
    if (clientInfo && clientInfo.ws) {
      this.sendToClient(clientInfo.ws, data);
      return true;
    }
    return false;
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(data) {
    let sent = 0;
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
        sent++;
      }
    });
    logger.system.debug('Broadcasted message', { recipients: sent });
    return sent;
  }

  /**
   * Broadcast to specific channel subscribers
   */
  broadcastToChannel(channel, data) {
    // For now, broadcast to all
    // Can be enhanced to track channel subscriptions
    return this.broadcast({ ...data, channel });
  }

  /**
   * Send chat message notification
   */
  notifyChatMessage(sessionId, message) {
    return this.sendToSession(sessionId, {
      type: 'chat_message',
      message,
      timestamp: Date.now()
    });
  }

  /**
   * Send status update notification
   */
  notifyStatusUpdate(data) {
    return this.broadcast({
      type: 'status_update',
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Send note update notification
   */
  notifyNoteUpdate(data) {
    return this.broadcast({
      type: 'note_update',
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Send TODO update notification
   */
  notifyTodoUpdate(data) {
    return this.broadcast({
      type: 'todo_update',
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Send analytics update notification
   */
  notifyAnalyticsUpdate(data) {
    return this.broadcast({
      type: 'analytics_update',
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Send custom notification
   */
  notify(sessionId, type, data) {
    return this.sendToSession(sessionId, {
      type,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.wss ? this.wss.clients.size : 0,
      authenticatedConnections: this.clients.size,
      uptime: process.uptime()
    };
  }

  /**
   * Get active WebSocket connections with details
   */
  getActiveConnections() {
    const connections = [];
    this.clients.forEach((clientInfo, sessionId) => {
      const now = Date.now();
      const connectedDuration = now - clientInfo.connectedAt;
      const connectedMinutes = Math.floor(connectedDuration / 60000);
      
      connections.push({
        sessionId,
        userId: clientInfo.userId,
        clientId: clientInfo.clientId,
        connectedAt: clientInfo.connectedAt,
        connectedMinutes,
        isOpen: clientInfo.ws.readyState === 1 // WebSocket.OPEN
      });
    });
    return connections;
  }

  /**
   * Close all connections
   */
  close() {
    if (this.wss) {
      this.wss.clients.forEach((ws) => {
        ws.close();
      });
      this.wss.close();
      logger.system.info('WebSocket server closed');
    }
  }
}

// Create singleton instance
const wsService = new WebSocketService();

module.exports = wsService;
