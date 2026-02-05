/**
 * Clawdbot Partnership Client Service
 * Provides client interface for ARDEN-Clawdbot bidirectional communication
 */

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const ARDEN_ROOT = path.resolve(__dirname, '../..');
const CONFIG_FILE = path.join(ARDEN_ROOT, 'config', 'arden.json');

class ClawdbotClient {
  constructor() {
    this.config = this.loadConfig();
    this.baseUrl = this.config.api_url;
    this.apiKey = this.config.api_key;
    this.timeout = this.config.timeout || 30000;
    this.retryAttempts = this.config.retry_attempts || 3;
  }

  loadConfig() {
    try {
      if (!fs.existsSync(CONFIG_FILE)) {
        throw new Error(`Configuration file not found: ${CONFIG_FILE}`);
      }

      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      
      if (!config.clawdbot_partnership) {
        throw new Error('Clawdbot partnership configuration missing in config/arden.json');
      }

      return config.clawdbot_partnership;
    } catch (error) {
      logger.system.error('Failed to load Clawdbot partnership configuration', { 
        error: error.message,
        configPath: CONFIG_FILE 
      });
      throw error;
    }
  }

  async makeRequest(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-ARDEN-Request': 'partnership'
      },
      timeout: this.timeout
    };

    const requestOptions = { ...defaultOptions, ...options };

    let attempt = 1;
    while (attempt <= this.retryAttempts) {
      try {
        logger.system.debug('Making Clawdbot API request', { 
          url, 
          method: requestOptions.method || 'GET',
          attempt 
        });

        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Clawdbot API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        
        logger.system.debug('Clawdbot API request successful', { 
          url, 
          status: response.status,
          attempt 
        });

        return data;
      } catch (error) {
        logger.system.warning('Clawdbot API request failed', { 
          url, 
          error: error.message,
          attempt,
          maxAttempts: this.retryAttempts
        });

        if (attempt === this.retryAttempts) {
          throw error;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }
  }

  async sendRequest(action, platform, content, metadata = {}) {
    const payload = {
      action: action,
      platform: platform,
      content: content,
      metadata: metadata,
      source: 'arden',
      timestamp: new Date().toISOString()
    };

    logger.system.info('Sending partnership request to Clawdbot', { 
      action, platform, content, metadata 
    });

    const url = `${this.baseUrl}/partnership/request`;
    const options = {
      method: 'POST',
      body: JSON.stringify(payload)
    };

    const result = await this.makeRequest(url, options);
    
    logger.system.info('Partnership request sent successfully', { 
      requestId: result.request_id,
      action,
      platform 
    });

    return result;
  }

  async getStatus(requestId) {
    if (!requestId) {
      throw new Error('Request ID is required');
    }

    logger.system.debug('Fetching partnership request status', { requestId });

    const url = `${this.baseUrl}/partnership/request/${requestId}/status`;
    const result = await this.makeRequest(url);
    
    logger.system.debug('Request status retrieved', { 
      requestId, 
      status: result.status 
    });

    return result;
  }

  async getCapabilities() {
    logger.system.debug('Fetching Clawdbot partnership capabilities');

    const url = `${this.baseUrl}/partnership/capabilities`;
    const result = await this.makeRequest(url);
    
    logger.system.debug('Capabilities retrieved', { 
      platforms: result.supported_platforms?.length || 0,
      automationEnabled: result.automation_enabled 
    });

    return result;
  }

  async syncContext(context, syncType = 'delta') {
    const payload = {
      context: context,
      sync_type: syncType,
      source: 'arden',
      timestamp: new Date().toISOString()
    };

    logger.system.info('Syncing context to Clawdbot', { 
      syncType,
      contextKeys: Object.keys(context)
    });

    const url = `${this.baseUrl}/partnership/context/sync`;
    const options = {
      method: 'POST',
      body: JSON.stringify(payload)
    };

    const result = await this.makeRequest(url, options);
    
    logger.system.info('Context synced successfully', { 
      syncId: result.sync_id,
      itemsProcessed: result.context_items_processed 
    });

    return result;
  }

  async receiveContext(platform = null, since = null) {
    logger.system.debug('Receiving context from Clawdbot', { 
      platform, 
      since 
    });

    let url = `${this.baseUrl}/partnership/context/receive`;
    const params = new URLSearchParams();
    
    if (platform) {
      params.append('platform', platform);
    }
    
    if (since) {
      params.append('since', since);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const result = await this.makeRequest(url);
    
    logger.system.debug('Context received from Clawdbot', { 
      itemCount: result.items_count || 0,
      lastUpdated: result.last_updated 
    });

    return result;
  }

  // Health check for partnership
  async healthCheck() {
    try {
      const url = `${this.baseUrl}/partnership/health`;
      const result = await this.makeRequest(url);
      
      return { 
        healthy: true, 
        ...result,
        checked_at: new Date().toISOString()
      };
    } catch (error) {
      logger.system.warning('Clawdbot partnership health check failed', { 
        error: error.message 
      });
      return { 
        healthy: false, 
        error: error.message,
        checked_at: new Date().toISOString()
      };
    }
  }

  // Get partnership configuration
  getConfig() {
    return {
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts,
      supportedPlatforms: this.getSupportedPlatforms(),
      automationEnabled: this.isAutomationEnabled(),
      collaborationMode: this.getCollaborationMode()
    };
  }

  // Get supported platforms
  getSupportedPlatforms() {
    return this.config.supported_platforms || ['whatsapp', 'telegram', 'discord', 'slack'];
  }

  // Check if automation is enabled
  isAutomationEnabled() {
    return this.config.automation_enabled !== false;
  }

  // Get collaboration mode
  getCollaborationMode() {
    return this.config.collaboration_mode || 'bidirectional';
  }

  // Validate platform support
  isPlatformSupported(platform) {
    return this.getSupportedPlatforms().includes(platform.toLowerCase());
  }

  // Estimate request completion time based on platform and action
  estimateCompletionTime(platform, action) {
    const estimates = {
      'message': { 'whatsapp': 30, 'telegram': 20, 'discord': 25, 'slack': 20 },
      'delegate': { 'email': 120, 'automation': 60, 'calendar': 90 },
      'collaborate': { 'general': 300, 'research': 600, 'planning': 180 }
    };

    const platformEstimates = estimates[action] || {};
    return platformEstimates[platform] || 60; // Default 1 minute
  }
}

module.exports = ClawdbotClient;