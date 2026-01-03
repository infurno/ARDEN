/**
 * Dashboard Handler
 * 
 * Manages dashboard UI and status updates
 */

document.addEventListener('DOMContentLoaded', async () => {
    const logoutButton = document.getElementById('logout-button');
    const refreshButton = document.getElementById('refresh-status');
    
    // Check authentication
    try {
        const authStatus = await api.verifyAuth();
        if (!authStatus.authenticated) {
            window.location.href = '/login.html';
            return;
        }
    } catch (error) {
        window.location.href = '/login.html';
        return;
    }
    
    // Load initial status
    await loadStatus();
    await loadAnalytics();
    await loadActiveSessions();
    await loadSkillsAnalytics();
    await loadApiCosts();
    
    // Setup WebSocket listeners for real-time updates
    setupWebSocketListeners();
    
    // Auto-refresh every 30 seconds
    setInterval(loadStatus, 30000);
    setInterval(loadAnalytics, 60000); // Refresh analytics every minute
    setInterval(loadActiveSessions, 30000); // Refresh sessions every 30 seconds
    setInterval(loadSkillsAnalytics, 60000); // Refresh skills analytics every minute
    setInterval(loadApiCosts, 60000); // Refresh API costs every minute
    
    // Trends period change handler
    const trendsPeriodSelect = document.getElementById('trends-period');
    if (trendsPeriodSelect) {
        trendsPeriodSelect.addEventListener('change', async (e) => {
            await loadTrends(e.target.value);
        });
    }
    
    // Skills period change handler
    const skillsPeriodSelect = document.getElementById('skills-period');
    if (skillsPeriodSelect) {
        skillsPeriodSelect.addEventListener('change', async (e) => {
            await loadSkillsAnalytics(e.target.value);
        });
    }
    
    // API costs period change handler
    const costsPeriodSelect = document.getElementById('costs-period');
    if (costsPeriodSelect) {
        costsPeriodSelect.addEventListener('change', async (e) => {
            await loadApiCosts(e.target.value);
        });
    }
    
    // Refresh sessions button
    const refreshSessionsButton = document.getElementById('refresh-sessions');
    if (refreshSessionsButton) {
        refreshSessionsButton.addEventListener('click', async () => {
            refreshSessionsButton.textContent = 'Refreshing...';
            refreshSessionsButton.disabled = true;
            await loadActiveSessions();
            refreshSessionsButton.textContent = 'Refresh';
            refreshSessionsButton.disabled = false;
        });
    }
    
    // Load analytics data
    async function loadAnalytics() {
        try {
            // Load overall analytics
            const analytics = await api.getAnalytics();
            
            if (analytics.success) {
                const stats = analytics.stats;
                
                // Update analytics cards
                document.getElementById('analytics-total-messages').textContent = stats.totalMessages;
                document.getElementById('analytics-user-messages').textContent = stats.userMessages;
                document.getElementById('analytics-assistant-messages').textContent = stats.assistantMessages;
                document.getElementById('analytics-total-sessions').textContent = stats.totalSessions;
                document.getElementById('analytics-active-sessions').textContent = stats.activeSessions;
                document.getElementById('analytics-avg-duration').textContent = stats.avgSessionDurationMinutes;
            }
            
            // Load recent message stats (last 7 days)
            const messageStats = await api.getMessageStats('7d');
            if (messageStats.success) {
                document.getElementById('analytics-recent-messages').textContent = messageStats.stats.total || 0;
            }
            
            // Load usage trends
            const period = document.getElementById('trends-period')?.value || '30d';
            await loadTrends(period);
            
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    }
    
    // Load and render usage trends
    async function loadTrends(period = '30d') {
        try {
            const trendsData = await api.getUsageTrends(period);
            
            if (trendsData.success && trendsData.trends.length > 0) {
                renderTrendsChart(trendsData.trends);
            } else {
                document.getElementById('trends-chart').innerHTML = 
                    '<div class="text-center py-8" style="color: #9aa5ce;">No data available</div>';
            }
        } catch (error) {
            console.error('Failed to load trends:', error);
            document.getElementById('trends-chart').innerHTML = 
                '<div class="text-center py-8" style="color: #f7768e;">Failed to load trends</div>';
        }
    }
    
    // Render simple text-based chart
    function renderTrendsChart(trends) {
        const container = document.getElementById('trends-chart');
        
        if (trends.length === 0) {
            container.innerHTML = '<div class="text-center py-8" style="color: #9aa5ce;">No activity yet</div>';
            return;
        }
        
        // Find max for scaling
        const maxMessages = Math.max(...trends.map(t => t.message_count));
        const maxScale = Math.max(maxMessages, 1);
        
        let html = '<div class="space-y-2">';
        
        trends.forEach(trend => {
            const percentage = (trend.message_count / maxScale) * 100;
            const barColor = trend.message_count > 0 ? '#7aa2f7' : '#414868';
            
            html += `
                <div class="flex items-center space-x-3">
                    <div class="text-xs w-24" style="color: #9aa5ce;">${trend.date}</div>
                    <div class="flex-1 h-6 bg-surface rounded-full overflow-hidden" style="border: 1px solid #414868;">
                        <div class="h-full flex items-center justify-end px-2 text-xs font-medium transition-all" 
                             style="width: ${percentage}%; background-color: ${barColor}; color: #1a1b26;">
                            ${trend.message_count > 0 ? trend.message_count : ''}
                        </div>
                    </div>
                    <div class="text-xs w-16 text-right" style="color: #565f89;">${trend.unique_sessions} sessions</div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    // Load and render active sessions
    async function loadActiveSessions() {
        try {
            const response = await api.getActiveSessions();
            
            if (response.success) {
                renderActiveSessions(response.sessions, response.webSocketConnections);
            } else {
                document.getElementById('sessions-list').innerHTML = 
                    '<div class="text-center py-8" style="color: #f7768e;">Failed to load sessions</div>';
            }
        } catch (error) {
            console.error('Failed to load active sessions:', error);
            document.getElementById('sessions-list').innerHTML = 
                '<div class="text-center py-8" style="color: #f7768e;">Error loading sessions</div>';
        }
    }
    
    // Render active sessions list
    function renderActiveSessions(sessions, wsCount) {
        const container = document.getElementById('sessions-list');
        
        if (sessions.length === 0) {
            container.innerHTML = '<div class="text-center py-8" style="color: #9aa5ce;">No active sessions</div>';
            return;
        }
        
        let html = `
            <div class="mb-4 text-sm" style="color: #9aa5ce;">
                <span style="color: #c0caf5; font-weight: 600;">${sessions.length}</span> active session${sessions.length !== 1 ? 's' : ''} 
                | <span style="color: #9ece6a; font-weight: 600;">${wsCount}</span> WebSocket connection${wsCount !== 1 ? 's' : ''}
            </div>
            <div class="space-y-3 max-h-96 overflow-y-auto">
        `;
        
        sessions.forEach(session => {
            const idleBadge = session.isIdle 
                ? '<span class="text-xs px-2 py-0.5 rounded" style="background: #414868; color: #9aa5ce;">Idle</span>'
                : '<span class="text-xs px-2 py-0.5 rounded" style="background: #9ece6a; color: #1a1b26;">Active</span>';
            
            const wsBadge = session.hasWebSocket
                ? '<span class="text-xs px-2 py-0.5 rounded" style="background: #7aa2f7; color: #1a1b26;">🔌 Connected</span>'
                : '';
            
            const sourceBadge = {
                'web': '<span class="text-xs px-2 py-0.5 rounded" style="background: #bb9af7; color: #1a1b26;">🌐 Web</span>',
                'telegram': '<span class="text-xs px-2 py-0.5 rounded" style="background: #7dcfff; color: #1a1b26;">✈️ Telegram</span>',
                'api': '<span class="text-xs px-2 py-0.5 rounded" style="background: #e0af68; color: #1a1b26;">🔧 API</span>'
            }[session.source] || '<span class="text-xs px-2 py-0.5 rounded" style="background: #565f89; color: #c0caf5;">❓ Unknown</span>';
            
            const authBadge = session.authenticated
                ? '<span class="text-xs">🔐</span>'
                : '<span class="text-xs">🔓</span>';
            
            const sessionIdShort = session.sessionId.substring(0, 16) + '...';
            const lastActivityTime = formatRelativeTime(session.lastActivity);
            const durationText = session.durationMinutes < 1 ? '<1 min' : `${session.durationMinutes} min`;
            
            html += `
                <div class="p-4 rounded-lg" style="background: #1a1b26; border: 1px solid #414868;">
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex items-center space-x-2">
                            ${authBadge}
                            <span class="font-mono text-sm" style="color: #c0caf5;" title="${session.sessionId}">${sessionIdShort}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            ${idleBadge}
                        </div>
                    </div>
                    <div class="space-y-1 text-xs" style="color: #9aa5ce;">
                        <div class="flex items-center space-x-2">
                            <span>User:</span>
                            <span style="color: #c0caf5;">${session.userId}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            ${sourceBadge}
                            ${wsBadge}
                        </div>
                        <div class="flex items-center justify-between mt-2">
                            <span>Duration: <span style="color: #e0af68;">${durationText}</span></span>
                            <span>Last seen: <span style="color: #7aa2f7;">${lastActivityTime}</span></span>
                        </div>
                        ${session.idleMinutes > 0 ? `<div style="color: #565f89;">Idle: ${session.idleMinutes} min</div>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    // Format relative time
    function formatRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 60) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }
    
    // Load and render skills analytics
    async function loadSkillsAnalytics(period = '30d') {
        try {
            const response = await api.getSkillStats(period);
            
            if (response.success) {
                renderSkillsAnalytics(response.stats);
            } else {
                document.getElementById('skills-analytics').innerHTML = 
                    '<div class="text-center py-8" style="color: #f7768e;">Failed to load skills analytics</div>';
            }
        } catch (error) {
            console.error('Failed to load skills analytics:', error);
            document.getElementById('skills-analytics').innerHTML = 
                '<div class="text-center py-8" style="color: #f7768e;">Error loading skills analytics</div>';
        }
    }
    
    // Render skills analytics
    function renderSkillsAnalytics(stats) {
        const container = document.getElementById('skills-analytics');
        
        if (stats.length === 0) {
            container.innerHTML = '<div class="text-center py-8" style="color: #9aa5ce;">No skill executions yet</div>';
            return;
        }
        
        let html = '<div class="space-y-4">';
        
        stats.forEach(skill => {
            const successRate = parseFloat(skill.successRate);
            const successColor = successRate >= 90 ? '#9ece6a' : successRate >= 70 ? '#e0af68' : '#f7768e';
            const lastUsed = skill.lastExecution ? formatRelativeTime(skill.lastExecution) : 'Never';
            const avgTime = skill.avgExecutionTimeMs ? `${skill.avgExecutionTimeMs}ms` : 'N/A';
            
            html += `
                <div class="p-4 rounded-lg" style="background: #1a1b26; border: 1px solid #414868;">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h5 class="font-semibold text-lg" style="color: #c0caf5;">${escapeHtml(skill.skillId)}</h5>
                            <div class="text-xs mt-1" style="color: #565f89;">Last used: ${lastUsed}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold" style="color: #7aa2f7;">${skill.totalExecutions}</div>
                            <div class="text-xs" style="color: #9aa5ce;">executions</div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-3 text-sm">
                        <div class="text-center p-2 rounded" style="background: #24283b;">
                            <div class="font-bold" style="color: ${successColor};">${successRate}%</div>
                            <div class="text-xs" style="color: #9aa5ce;">Success</div>
                        </div>
                        <div class="text-center p-2 rounded" style="background: #24283b;">
                            <div class="font-bold" style="color: #9ece6a;">${skill.successfulExecutions}</div>
                            <div class="text-xs" style="color: #9aa5ce;">Successful</div>
                        </div>
                        <div class="text-center p-2 rounded" style="background: #24283b;">
                            <div class="font-bold" style="color: #f7768e;">${skill.failedExecutions}</div>
                            <div class="text-xs" style="color: #9aa5ce;">Failed</div>
                        </div>
                    </div>
                    
                    ${skill.avgExecutionTimeMs ? `
                        <div class="mt-3 text-xs" style="color: #9aa5ce;">
                            Avg execution time: <span style="color: #e0af68;">${avgTime}</span>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    // Escape HTML helper
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Load and render API costs
    async function loadApiCosts(period = '30d') {
        try {
            const response = await api.getApiCosts(period);
            
            if (response.success) {
                renderApiCosts(response.costs);
            } else {
                document.getElementById('api-costs-container').innerHTML = 
                    '<div class="text-center py-8" style="color: #f7768e;">Failed to load API costs</div>';
            }
        } catch (error) {
            console.error('Failed to load API costs:', error);
            document.getElementById('api-costs-container').innerHTML = 
                '<div class="text-center py-8" style="color: #f7768e;">Error loading API costs</div>';
        }
    }
    
    // Render API costs
    function renderApiCosts(costs) {
        const container = document.getElementById('api-costs-container');
        
        if (!costs || costs.length === 0) {
            container.innerHTML = '<div class="text-center py-8" style="color: #9aa5ce;">No API usage yet</div>';
            return;
        }
        
        // Calculate totals
        const totalCost = costs.reduce((sum, cost) => sum + parseFloat(cost.totalCost), 0);
        const totalTokens = costs.reduce((sum, cost) => sum + parseInt(cost.totalTokens), 0);
        const totalCalls = costs.reduce((sum, cost) => sum + parseInt(cost.totalCalls), 0);
        
        let html = `
            <div class="mb-6 p-4 rounded-lg" style="background: #1a1b26; border: 2px solid #7aa2f7;">
                <h4 class="font-semibold mb-4" style="color: #c0caf5;">Total Usage</h4>
                <div class="grid grid-cols-3 gap-4">
                    <div class="text-center">
                        <div class="text-3xl font-bold" style="color: #f7768e;">$${totalCost.toFixed(4)}</div>
                        <div class="text-xs mt-1" style="color: #9aa5ce;">Total Cost</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold" style="color: #7aa2f7;">${totalTokens.toLocaleString()}</div>
                        <div class="text-xs mt-1" style="color: #9aa5ce;">Total Tokens</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold" style="color: #9ece6a;">${totalCalls}</div>
                        <div class="text-xs mt-1" style="color: #9aa5ce;">API Calls</div>
                    </div>
                </div>
            </div>
            
            <div class="space-y-4">
        `;
        
        costs.forEach(cost => {
            const costValue = parseFloat(cost.totalCost);
            const costColor = costValue === 0 ? '#9aa5ce' : '#f7768e';
            const successRate = parseFloat(cost.successRate);
            const successColor = successRate >= 90 ? '#9ece6a' : successRate >= 70 ? '#e0af68' : '#f7768e';
            
            html += `
                <div class="p-4 rounded-lg" style="background: #1a1b26; border: 1px solid #414868;">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h5 class="font-semibold text-lg" style="color: #c0caf5;">${escapeHtml(cost.provider)}</h5>
                            <div class="text-sm mt-1" style="color: #7aa2f7;">${escapeHtml(cost.model)}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold" style="color: ${costColor};">$${costValue.toFixed(4)}</div>
                            <div class="text-xs" style="color: #9aa5ce;">${cost.totalCalls} calls</div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-4 gap-3 text-sm">
                        <div class="text-center p-2 rounded" style="background: #24283b;">
                            <div class="font-bold" style="color: #bb9af7;">${parseInt(cost.totalTokens).toLocaleString()}</div>
                            <div class="text-xs" style="color: #9aa5ce;">Tokens</div>
                        </div>
                        <div class="text-center p-2 rounded" style="background: #24283b;">
                            <div class="font-bold" style="color: #7dcfff;">${parseInt(cost.promptTokens).toLocaleString()}</div>
                            <div class="text-xs" style="color: #9aa5ce;">Prompt</div>
                        </div>
                        <div class="text-center p-2 rounded" style="background: #24283b;">
                            <div class="font-bold" style="color: #e0af68;">${parseInt(cost.completionTokens).toLocaleString()}</div>
                            <div class="text-xs" style="color: #9aa5ce;">Completion</div>
                        </div>
                        <div class="text-center p-2 rounded" style="background: #24283b;">
                            <div class="font-bold" style="color: ${successColor};">${successRate}%</div>
                            <div class="text-xs" style="color: #9aa5ce;">Success</div>
                        </div>
                    </div>
                    
                    ${costValue === 0 ? `
                        <div class="mt-3 text-xs text-center p-2 rounded" style="background: #24283b; color: #9ece6a;">
                            ✓ Free (Local/Self-hosted)
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    // Load status from API
    async function loadStatus() {
        try {
            const status = await api.getStatus();
            
            // Update system status
            document.getElementById('system-status-text').textContent = 
                status.status.charAt(0).toUpperCase() + status.status.slice(1);
            document.getElementById('system-uptime').textContent = 
                `Uptime: ${status.uptimeFormatted}`;
            document.getElementById('system-status-icon').textContent = 
                status.status === 'running' ? '✓' : '●';
            document.getElementById('system-status-icon').style.color = 
                status.status === 'running' ? '#10b981' : '#ef4444';
            
            // Update AI provider
            document.getElementById('ai-provider').textContent = 
                status.ai.provider.toUpperCase();
            document.getElementById('ai-model').textContent = 
                `Model: ${status.ai.model}`;
            
            // Update notes count
            document.getElementById('notes-count').textContent = status.stats.notes;
            
            // Update TODOs
            document.getElementById('todos-active').textContent = status.stats.todos.unchecked;
            document.getElementById('todos-total').textContent = 
                `${status.stats.todos.total} total`;
            
            // Update voice config
            document.getElementById('voice-enabled').textContent = 
                status.voice.enabled ? '✓ Enabled' : '✗ Disabled';
            document.getElementById('voice-stt').textContent = status.voice.stt;
            document.getElementById('voice-tts').textContent = status.voice.tts;
            
            // Update version and timestamp
            document.getElementById('version').textContent = status.version;
            document.getElementById('last-updated').textContent = 
                new Date(status.timestamp).toLocaleTimeString();
            
            // Update status indicator (will be overridden by WebSocket if connected)
            updateConnectionStatus(true);
            
        } catch (error) {
            console.error('Failed to load status:', error);
            
            // Update status indicator to show error
            updateConnectionStatus(false);
        }
    }
    
    // Setup WebSocket listeners for real-time updates
    function setupWebSocketListeners() {
        if (window.wsClient) {
            wsClient.on('connected', () => {
                console.log('WebSocket connected for dashboard');
                updateConnectionStatus(true);
            });
            
            wsClient.on('disconnected', () => {
                console.log('WebSocket disconnected');
                updateConnectionStatus(false);
            });
            
            wsClient.on('reconnect_failed', () => {
                console.error('WebSocket reconnection failed');
                updateConnectionStatus(false);
            });
            
            // Listen for status updates
            wsClient.on('status_update', (data) => {
                console.log('Received status update via WebSocket:', data);
                // Reload status when we get an update
                loadStatus();
            });
            
            // Listen for analytics updates
            wsClient.on('analytics_update', (data) => {
                console.log('Received analytics update via WebSocket:', data);
                // Reload analytics when we get an update
                loadAnalytics();
            });
        }
    }
    
    // Update connection status indicator
    function updateConnectionStatus(connected) {
        const statusIndicator = document.getElementById('status-indicator');
        if (!statusIndicator) return;
        
        const dot = statusIndicator.querySelector('div');
        const text = statusIndicator.querySelector('span');
        
        if (connected) {
            dot.className = 'w-2 h-2 bg-green-500 rounded-full animate-pulse';
            text.textContent = 'Connected';
        } else {
            dot.className = 'w-2 h-2 bg-red-500 rounded-full';
            text.textContent = 'Disconnected';
        }
    }
    
    // Refresh button
    refreshButton.addEventListener('click', async () => {
        refreshButton.textContent = 'Refreshing...';
        refreshButton.disabled = true;
        
        await loadStatus();
        
        refreshButton.textContent = 'Refresh Status';
        refreshButton.disabled = false;
    });
    
    // Logout button
    logoutButton.addEventListener('click', async () => {
        try {
            await api.logout();
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
});
