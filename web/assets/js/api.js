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
    
    async getSystemStats() {
        return this.request('/status/system');
    }
    
    /**
     * TODOs
     */
    async getTodos() {
        return this.request('/todos');
    }
    
    async getTodoCategories() {
        return this.request('/todos/categories');
    }
    
    async createTodoCategory(name) {
        return this.request('/todos/categories', {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    }
    
    async consolidateTodos() {
        return this.request('/todos/consolidate', {
            method: 'POST',
        });
    }
    
    async updateTodo(id, checked) {
        return this.request(`/todos/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ checked }),
        });
    }
    
    async createTodo(text, category = 'personal', targetFile = null) {
        return this.request('/todos', {
            method: 'POST',
            body: JSON.stringify({ text, category, targetFile }),
        });
    }
    
    async deleteTodo(id) {
        return this.request(`/todos/${id}`, {
            method: 'DELETE',
        });
    }
    
    async editTodo(id, text, dueDate = null) {
        return this.request(`/todos/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ text, dueDate }),
        });
    }
    
    /**
     * Analytics
     */
    async getAnalytics() {
        return this.request('/analytics');
    }
    
    async getMessageStats(period = '7d') {
        return this.request(`/analytics/messages?period=${period}`);
    }
    
    async getSessionStats() {
        return this.request('/analytics/sessions');
    }
    
    async getUsageTrends(period = '30d') {
        return this.request(`/analytics/trends?period=${period}`);
    }
    
    async getActiveSessions() {
        return this.request('/analytics/active-sessions');
    }
    
    async getSkillStats(period = '30d', skillId = null) {
        const params = new URLSearchParams({ period });
        if (skillId) params.append('skillId', skillId);
        return this.request(`/analytics/skills?${params.toString()}`);
    }
    
    async getSkillHistory(skillId = null, limit = 50) {
        const params = new URLSearchParams({ limit });
        if (skillId) params.append('skillId', skillId);
        return this.request(`/analytics/skills/history?${params.toString()}`);
    }
    
    async getSkillTrends(period = '30d') {
        return this.request(`/analytics/skills/trends?period=${period}`);
    }
    
    async getPopularSkills(limit = 10, period = '30d') {
        return this.request(`/analytics/skills/popular?limit=${limit}&period=${period}`);
    }
    
    async getApiCostsSummary(period = '30d') {
        return this.request(`/analytics/api-costs?period=${period}`);
    }
    
    async getApiCostsStats(period = '30d', provider = null) {
        const params = new URLSearchParams({ period });
        if (provider) params.append('provider', provider);
        return this.request(`/analytics/api-costs/stats?${params.toString()}`);
    }
    
    async getApiCosts(period = '30d') {
        const response = await this.getApiCostsStats(period);
        if (!response.success) return response;
        
        // Transform API response to match dashboard expectations
        const costs = response.stats.map(stat => ({
            provider: stat.provider,
            model: stat.model,
            totalCalls: stat.total_requests,
            promptTokens: stat.total_prompt_tokens,
            completionTokens: stat.total_completion_tokens,
            totalTokens: stat.total_tokens,
            totalCost: stat.total_cost_usd,
            successRate: ((stat.successful_requests / stat.total_requests) * 100).toFixed(1),
            isLocal: stat.isLocal || false
        }));
        
        return { success: true, costs };
    }
    
    async getApiCostsTrends(period = '30d') {
        return this.request(`/analytics/api-costs/trends?period=${period}`);
    }
    
    async getApiCostsHistory(limit = 50, provider = null) {
        const params = new URLSearchParams({ limit });
        if (provider) params.append('provider', provider);
        return this.request(`/analytics/api-costs/history?${params.toString()}`);
    }
    
    /**
     * Skills
     */
    async getSkills() {
        return this.request('/skills');
    }
    
    async getSkillDetails(skillId) {
        return this.request(`/skills/${skillId}`);
    }
    
    async executeSkill(skillId, params = {}) {
        return this.request(`/skills/${skillId}/execute`, {
            method: 'POST',
            body: JSON.stringify({ params }),
        });
    }
    
    async toggleSkill(skillId) {
        return this.request(`/skills/${skillId}/toggle`, {
            method: 'POST'
        });
    }
    
    async updateSkillConfig(skillId, config) {
        return this.request(`/skills/${skillId}`, {
            method: 'PATCH',
            body: JSON.stringify(config)
        });
    }
}

// Create global API instance
const api = new ArdenAPI();
