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
    
    // Auto-refresh every 30 seconds
    setInterval(loadStatus, 30000);
    
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
            
            // Update status indicator
            const statusIndicator = document.getElementById('status-indicator');
            statusIndicator.querySelector('span').textContent = 'Connected';
            statusIndicator.querySelector('div').className = 'w-2 h-2 bg-green-500 rounded-full animate-pulse';
            
        } catch (error) {
            console.error('Failed to load status:', error);
            
            // Update status indicator to show error
            const statusIndicator = document.getElementById('status-indicator');
            statusIndicator.querySelector('span').textContent = 'Error';
            statusIndicator.querySelector('div').className = 'w-2 h-2 bg-red-500 rounded-full';
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
