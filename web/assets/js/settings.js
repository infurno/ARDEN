// Settings page JavaScript
let originalConfig = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    setupEventListeners();
});

// Load settings from API
async function loadSettings() {
    try {
        const response = await apiRequest('/api/settings', {
            method: 'GET'
        });

        if (response.success) {
            originalConfig = response.config;
            populateForm(response.config);
        } else {
            showNotification('Failed to load settings', 'error');
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        showNotification('Error loading settings: ' + error.message, 'error');
    }
}

// Populate form with config data
function populateForm(config) {
    // Voice settings
    document.getElementById('voice-enabled').checked = config.voice?.enabled || false;
    document.getElementById('voice-notifications').checked = config.voice?.notifications || false;
    document.getElementById('stt-provider').value = config.voice?.stt_provider || 'local-whisper';
    document.getElementById('stt-model').value = config.voice?.stt_config?.model || 'base';
    document.getElementById('tts-provider').value = config.voice?.tts_provider || 'edge-tts';
    document.getElementById('tts-voice').value = config.voice?.tts_config?.voice || '';
    document.getElementById('wake-word').value = config.voice?.wake_word || '';

    // API settings
    document.getElementById('api-enabled').checked = config.api?.enabled || false;
    document.getElementById('api-cors').checked = config.api?.cors_enabled || false;
    document.getElementById('api-port').value = config.api?.port || 3000;
    document.getElementById('api-host').value = config.api?.host || '0.0.0.0';
    document.getElementById('rate-limit-window').value = config.api?.rate_limit?.window_ms || 900000;
    document.getElementById('rate-limit-max').value = config.api?.rate_limit?.max_requests || 100;

    // Telegram settings
    document.getElementById('telegram-enabled').checked = config.telegram?.enabled || false;
    if (config.telegram?.allowed_users && Array.isArray(config.telegram.allowed_users)) {
        document.getElementById('telegram-allowed-users').value = config.telegram.allowed_users.join(',');
    }

    // Context settings
    document.getElementById('context-auto-load').checked = config.context?.auto_load_skills || false;
    document.getElementById('context-history').checked = config.context?.history_enabled || false;
    if (config.context?.directories && Array.isArray(config.context.directories)) {
        document.getElementById('context-directories').value = config.context.directories.join('\n');
    }

    // Security settings
    document.getElementById('security-audit').checked = config.security?.audit_logging || false;
    document.getElementById('security-validation').checked = config.security?.command_validation || false;
    if (config.security?.blocked_commands && Array.isArray(config.security.blocked_commands)) {
        document.getElementById('security-blocked').value = config.security.blocked_commands.join('\n');
    }

    // Hooks settings
    document.getElementById('hook-session-start').checked = config.hooks?.session_start || false;
    document.getElementById('hook-pre-tool').checked = config.hooks?.pre_tool_use || false;
    document.getElementById('hook-post-tool').checked = config.hooks?.post_tool_use || false;
    document.getElementById('hook-stop').checked = config.hooks?.stop || false;

    // Routines settings
    document.getElementById('routine-morning-enabled').checked = config.routines?.morning_briefing?.enabled || false;
    document.getElementById('routine-morning-time').value = config.routines?.morning_briefing?.time || '08:00';
    document.getElementById('routine-morning-agent').value = config.routines?.morning_briefing?.agent || 'assistant';
    
    document.getElementById('routine-evening-enabled').checked = config.routines?.evening_review?.enabled || false;
    document.getElementById('routine-evening-time').value = config.routines?.evening_review?.time || '18:00';
    document.getElementById('routine-evening-agent').value = config.routines?.evening_review?.agent || 'analyst';
}

// Get form data as config object
function getFormData() {
    const config = {
        version: originalConfig?.version || '1.0.0',
        name: originalConfig?.name || 'ARDEN',
        description: originalConfig?.description || 'AI Routine Daily Engagement Nexus',
        
        voice: {
            enabled: document.getElementById('voice-enabled').checked,
            stt_provider: document.getElementById('stt-provider').value,
            stt_config: {
                model: document.getElementById('stt-model').value,
                language: originalConfig?.voice?.stt_config?.language || 'en'
            },
            tts_provider: document.getElementById('tts-provider').value,
            tts_config: {
                voice: document.getElementById('tts-voice').value
            },
            wake_word: document.getElementById('wake-word').value,
            notifications: document.getElementById('voice-notifications').checked
        },
        
        api: {
            enabled: document.getElementById('api-enabled').checked,
            port: parseInt(document.getElementById('api-port').value) || 3000,
            host: document.getElementById('api-host').value,
            auth_token_env: originalConfig?.api?.auth_token_env || 'ARDEN_API_TOKEN',
            cors_enabled: document.getElementById('api-cors').checked,
            rate_limit: {
                window_ms: parseInt(document.getElementById('rate-limit-window').value) || 900000,
                max_requests: parseInt(document.getElementById('rate-limit-max').value) || 100
            }
        },
        
        telegram: {
            enabled: document.getElementById('telegram-enabled').checked,
            bot_token_env: originalConfig?.telegram?.bot_token_env || 'TELEGRAM_BOT_TOKEN',
            allowed_users: document.getElementById('telegram-allowed-users').value
                .split(',')
                .map(id => id.trim())
                .filter(id => id.length > 0)
        },
        
        context: {
            directories: document.getElementById('context-directories').value
                .split('\n')
                .map(dir => dir.trim())
                .filter(dir => dir.length > 0),
            auto_load_skills: document.getElementById('context-auto-load').checked,
            history_enabled: document.getElementById('context-history').checked
        },
        
        agents: originalConfig?.agents || {
            default: 'assistant',
            available: ['strategist', 'researcher', 'engineer', 'analyst', 'assistant']
        },
        
        hooks: {
            session_start: document.getElementById('hook-session-start').checked,
            post_tool_use: document.getElementById('hook-post-tool').checked,
            stop: document.getElementById('hook-stop').checked,
            pre_tool_use: document.getElementById('hook-pre-tool').checked
        },
        
        security: {
            audit_logging: document.getElementById('security-audit').checked,
            command_validation: document.getElementById('security-validation').checked,
            allowed_tools: originalConfig?.security?.allowed_tools || ['*'],
            blocked_commands: document.getElementById('security-blocked').value
                .split('\n')
                .map(cmd => cmd.trim())
                .filter(cmd => cmd.length > 0)
        },
        
        routines: {
            morning_briefing: {
                enabled: document.getElementById('routine-morning-enabled').checked,
                time: document.getElementById('routine-morning-time').value,
                agent: document.getElementById('routine-morning-agent').value
            },
            evening_review: {
                enabled: document.getElementById('routine-evening-enabled').checked,
                time: document.getElementById('routine-evening-time').value,
                agent: document.getElementById('routine-evening-agent').value
            }
        }
    };
    
    return config;
}

// Save settings
async function saveSettings() {
    try {
        const config = getFormData();
        
        const response = await apiRequest('/api/settings', {
            method: 'PUT',
            body: JSON.stringify({ config })
        });

        if (response.success) {
            originalConfig = config;
            showNotification('Settings saved successfully', 'success');
        } else {
            showNotification('Failed to save settings: ' + (response.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Error saving settings: ' + error.message, 'error');
    }
}

// Reset form to original values
function resetForm() {
    if (originalConfig) {
        populateForm(originalConfig);
        showNotification('Settings reset to last saved values', 'success');
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('save-notification');
    const messageElement = document.getElementById('notification-message');
    
    messageElement.textContent = message;
    notification.className = 'save-notification ' + type;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Setup event listeners
function setupEventListeners() {
    // Save button
    document.getElementById('save-button').addEventListener('click', async (e) => {
        e.preventDefault();
        await saveSettings();
    });

    // Reset button
    document.getElementById('reset-button').addEventListener('click', (e) => {
        e.preventDefault();
        resetForm();
    });

    // Logout button
    document.getElementById('logout-button').addEventListener('click', () => {
        localStorage.removeItem('ardenToken');
        window.location.href = '/login.html';
    });
}
