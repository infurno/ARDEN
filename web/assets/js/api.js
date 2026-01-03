/**
 * ARDEN API Client
 * 
 * Handles all API communication with ARDEN backend
 */

const API_BASE = '/api';

class ArdenAPI {
    /**
     * Make authenticated API request
     */
    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include session cookie
        };
        
        const response = await fetch(url, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
            redirect: 'manual' // Don't follow redirects automatically
        });
        
        // Handle redirects (session expired)
        if (response.type === 'opaqueredirect' || response.status === 302 || response.status === 301) {
            window.location.href = '/login.html';
            throw new Error('Session expired');
        }
        
        // Handle unauthorized
        if (response.status === 401) {
            window.location.href = '/login.html';
            throw new Error('Unauthorized');
        }
        
        // Check content type before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            // Not JSON response, probably HTML redirect
            console.error('Unexpected content type:', contentType);
            window.location.href = '/login.html';
            throw new Error('Session expired');
        }
        
        // Parse JSON response
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            // Failed to parse JSON - likely got HTML instead
            console.error('Failed to parse JSON response:', jsonError);
            console.error('Response status:', response.status);
            console.error('Content-Type:', response.headers.get('content-type'));
            
            // Session likely expired
            window.location.href = '/login.html';
            throw new Error('Session expired - please log in again');
        }
        
        if (!response.ok) {
            throw new Error(data.error || data.message || 'Request failed');
        }
        
        return data;
    }
    
    /**
     * Authentication
     */
    async login(token) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    }
    
    async logout() {
        return this.request('/auth/logout', {
            method: 'POST',
        });
    }
    
    async verifyAuth() {
        return this.request('/auth/verify');
    }
    
    /**
     * Chat
     */
    async sendMessage(message, sessionId = null) {
        return this.request('/chat', {
            method: 'POST',
            body: JSON.stringify({ message, sessionId }),
        });
    }
    
    async getChatHistory(sessionId = null, limit = 50) {
        const params = new URLSearchParams();
        if (sessionId) params.append('sessionId', sessionId);
        if (limit) params.append('limit', limit);
        
        return this.request(`/chat/history?${params.toString()}`);
    }
    
    async clearChat(sessionId = null) {
        const params = new URLSearchParams();
        if (sessionId) params.append('sessionId', sessionId);
        
        return this.request(`/chat/clear?${params.toString()}`, {
            method: 'DELETE',
        });
    }
    
    /**
     * Status
     */
    async getStatus() {
        return this.request('/status');
    }
    
    async getHealth() {
        return this.request('/status/health');
    }
}

// Create global API instance
const api = new ArdenAPI();
