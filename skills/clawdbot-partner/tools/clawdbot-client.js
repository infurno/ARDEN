const fs = require('fs');
const path = require('path');

class ClawdbotClient {
    constructor() {
        this.config = this.loadConfig();
    }

    loadConfig() {
        const ardenDir = path.resolve(__dirname, '../../..');
        const configFile = path.join(ardenDir, 'config', 'arden.json');
        
        if (!fs.existsSync(configFile)) {
            throw new Error(`Configuration file not found: ${configFile}`);
        }

        const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        
        if (!config.clawdbot_partnership) {
            throw new Error('Clawdbot partnership configuration missing in config/arden.json');
        }

        return config.clawdbot_partnership;
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

        const response = await fetch(`${this.config.api_url}/partnership/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.api_key}`,
                'X-ARDEN-Request': 'partnership'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Clawdbot API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    async getStatus(requestId) {
        const response = await fetch(`${this.config.api_url}/partnership/request/${requestId}/status`, {
            headers: {
                'Authorization': `Bearer ${this.config.api_key}`,
                'X-ARDEN-Request': 'partnership'
            }
        });

        if (!response.ok) {
            throw new Error(`Clawdbot API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    async getCapabilities() {
        const response = await fetch(`${this.config.api_url}/partnership/capabilities`, {
            headers: {
                'Authorization': `Bearer ${this.config.api_key}`,
                'X-ARDEN-Request': 'partnership'
            }
        });

        if (!response.ok) {
            throw new Error(`Clawdbot API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    async syncContext(context) {
        const payload = {
            context: context,
            source: 'arden',
            timestamp: new Date().toISOString()
        };

        const response = await fetch(`${this.config.api_url}/partnership/context/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.api_key}`,
                'X-ARDEN-Request': 'partnership'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Clawdbot API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    async receiveContext(platform = null) {
        let url = `${this.config.api_url}/partnership/context/receive`;
        if (platform) {
            url += `?platform=${platform}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${this.config.api_key}`,
                'X-ARDEN-Request': 'partnership'
            }
        });

        if (!response.ok) {
            throw new Error(`Clawdbot API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    // Health check for partnership
    async healthCheck() {
        try {
            const response = await fetch(`${this.config.api_url}/partnership/health`, {
                headers: {
                    'Authorization': `Bearer ${this.config.api_key}`,
                    'X-ARDEN-Request': 'partnership'
                }
            });

            if (response.ok) {
                const result = await response.json();
                return { healthy: true, ...result };
            } else {
                return { healthy: false, error: `HTTP ${response.status}` };
            }
        } catch (error) {
            return { healthy: false, error: error.message };
        }
    }

    // Get supported platforms and capabilities
    getSupportedPlatforms() {
        return this.config.supported_platforms || ['whatsapp', 'telegram', 'discord', 'slack'];
    }

    isAutomationEnabled() {
        return this.config.automation_enabled !== false;
    }

    getCollaborationMode() {
        return this.config.collaboration_mode || 'bidirectional';
    }
}

module.exports = ClawdbotClient;