/**
 * WebSocket Client Manager
 * 
 * Manages WebSocket connection to ARDEN backend
 * Provides real-time updates for chat, todos, notes, and analytics
 */

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.heartbeatInterval = null;
    this.isAuthenticated = false;
    this.sessionId = null;
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    console.log(`Connecting to WebSocket: ${wsUrl}`);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.authenticate();
        this.startHeartbeat();
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isAuthenticated = false;
        this.stopHeartbeat();
        this.emit('disconnected');
        this.reconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.reconnect();
    }
  }

  /**
   * Authenticate with the server
   */
  authenticate() {
    // Get session ID from cookie or localStorage
    const sessionId = this.getSessionId();
    const userId = this.getUserId();

    if (sessionId) {
      this.sessionId = sessionId;
      this.send('auth', { sessionId, userId });
    }
  }

  /**
   * Get session ID from storage
   */
  getSessionId() {
    // Try to get from localStorage first
    let sessionId = localStorage.getItem('sessionId');
    
    // If not found, try to extract from cookie
    if (!sessionId) {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'connect.sid') {
          sessionId = value;
          break;
        }
      }
    }

    return sessionId;
  }

  /**
   * Get user ID from storage
   */
  getUserId() {
    return localStorage.getItem('userId') || 'web-user';
  }

  /**
   * Send message to server
   */
  send(type, data = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }

    const message = {
      type,
      data,
      timestamp: new Date().toISOString()
    };

    this.ws.send(JSON.stringify(message));
    return true;
  }

  /**
   * Handle incoming message
   */
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      
      // Handle authentication response
      if (message.type === 'auth') {
        this.isAuthenticated = message.data.success;
        if (this.isAuthenticated) {
          console.log('WebSocket authenticated');
          this.emit('authenticated');
        }
        return;
      }

      // Handle pong response
      if (message.type === 'pong') {
        return; // Just acknowledge, no action needed
      }

      // Emit to registered listeners
      this.emit(message.type, message.data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Register event listener
   */
  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(callback);
  }

  /**
   * Unregister event listener
   */
  off(type, callback) {
    if (!this.listeners.has(type)) return;
    
    const callbacks = this.listeners.get(type);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit event to listeners
   */
  emit(type, data) {
    if (!this.listeners.has(type)) return;
    
    const callbacks = this.listeners.get(type);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in WebSocket listener for ${type}:`, error);
      }
    });
  }

  /**
   * Start heartbeat (ping/pong)
   */
  startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      this.send('ping');
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Reconnect to server with exponential backoff
   */
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      console.log('Attempting to reconnect...');
      this.connect();
    }, delay);
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    console.log('Disconnecting WebSocket');
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to specific event types
   */
  subscribe(types) {
    this.send('subscribe', { types });
  }
}

// Create singleton instance
const wsClient = new WebSocketClient();

// Auto-connect when page loads (after a short delay to ensure DOM is ready)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => wsClient.connect(), 500);
  });
} else {
  setTimeout(() => wsClient.connect(), 500);
}

// Expose globally
window.wsClient = wsClient;
