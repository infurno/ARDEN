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
    
    // Setup WebSocket listeners for real-time updates
    setupWebSocketListeners();
    
    // Auto-refresh every 30 seconds
    setInterval(loadStatus, 30000);
    setInterval(loadAnalytics, 60000); // Refresh analytics every minute
    
    // Trends period change handler
    const trendsPeriodSelect = document.getElementById('trends-period');
    if (trendsPeriodSelect) {
        trendsPeriodSelect.addEventListener('change', async (e) => {
            await loadTrends(e.target.value);
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
