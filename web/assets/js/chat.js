/**
 * Chat Interface Handler
 * 
 * Manages chat UI and interactions
 */

let sessionId = null;
let ttsEnabled = false;
let currentAudio = null;

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const sendText = document.getElementById('send-text');
    const sendSpinner = document.getElementById('send-spinner');
    const messagesContainer = document.getElementById('messages');
    const clearButton = document.getElementById('clear-chat');
    const logoutButton = document.getElementById('logout-button');
    const ttsToggle = document.getElementById('tts-toggle');
    const ttsIconOff = document.getElementById('tts-icon-off');
    const ttsIconOn = document.getElementById('tts-icon-on');
    const ttsStatus = document.getElementById('tts-status');
    
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
    
    // Setup WebSocket listeners for real-time updates
    setupWebSocketListeners();
    
    // Load chat history
    await loadChatHistory();
    
    // Load TTS preference from localStorage
    const savedTtsEnabled = localStorage.getItem('ardenTtsEnabled');
    if (savedTtsEnabled === 'true') {
        ttsEnabled = true;
        updateTtsUI();
    }
    
    // Set loading state
    function setLoading(loading) {
        if (loading) {
            sendButton.disabled = true;
            sendText.textContent = 'Sending...';
            sendSpinner.classList.remove('hidden');
            messageInput.disabled = true;
        } else {
            sendButton.disabled = false;
            sendText.textContent = 'Send';
            sendSpinner.classList.add('hidden');
            messageInput.disabled = false;
            messageInput.focus();
        }
    }
    
    // Add message to UI
    function addMessage(type, content, timestamp) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type === 'user' ? 'ml-auto' : 'mr-auto'} max-w-3xl`;
        
        const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="rounded-lg p-4 ${type === 'user' ? 'tn-bg-primary' : 'tn-bg-surface'}">
                <div class="flex items-start justify-between mb-1">
                    <span class="text-xs font-semibold ${type === 'user' ? 'tn-text-inverse' : 'tn-text-secondary'}">
                        ${type === 'user' ? 'You' : 'ARDEN'}
                    </span>
                    <span class="text-xs ${type === 'user' ? 'tn-text-inverse' : 'tn-text-tertiary'}">${time}</span>
                </div>
                <div class="whitespace-pre-wrap break-words ${type === 'user' ? 'tn-text-inverse' : 'tn-text-main'}">${escapeHtml(content)}</div>
            </div>
        `;
        
        // Remove welcome message if present
        const welcome = messagesContainer.querySelector('.text-center');
        if (welcome) {
            welcome.remove();
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.classList.add('active');
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
    
    // Hide typing indicator
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.classList.remove('active');
        }
    }
    
    // Load chat history
    async function loadChatHistory() {
        try {
            const history = await api.getChatHistory(sessionId);
            
            if (history.messages && history.messages.length > 0) {
                // Clear welcome message
                messagesContainer.innerHTML = '';
                
                // Add messages
                history.messages.forEach(msg => {
                    addMessage('user', msg.user, msg.timestamp);
                    addMessage('arden', msg.arden, msg.timestamp);
                });
                
                sessionId = history.sessionId;
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    }
    
    // Setup WebSocket listeners
    function setupWebSocketListeners() {
        // Listen for WebSocket connection status
        if (window.wsClient) {
            wsClient.on('connected', () => {
                console.log('WebSocket connected for chat');
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
            
            // Listen for incoming chat messages (for multi-device sync in future)
            wsClient.on('chat_message', (data) => {
                console.log('Received chat message via WebSocket:', data);
                // Could be used for multi-device synchronization
                // For now, we're using HTTP responses
            });
        }
    }
    
    // Update connection status indicator
    function updateConnectionStatus(connected) {
        const statusIndicator = document.getElementById('status-indicator');
        if (!statusIndicator) return;
        
        const dot = statusIndicator.querySelector('.w-2');
        const text = statusIndicator.querySelector('span');
        
        if (connected) {
            dot.style.backgroundColor = '#9ece6a'; // Tokyo Night green
            text.textContent = 'Connected';
        } else {
            dot.style.backgroundColor = '#f7768e'; // Tokyo Night red
            text.textContent = 'Disconnected';
        }
    }
    
    // Update TTS UI
    function updateTtsUI() {
        if (ttsEnabled) {
            ttsIconOff.classList.add('hidden');
            ttsIconOn.classList.remove('hidden');
            ttsStatus.textContent = 'TTS On';
            ttsToggle.classList.add('tn-accent');
            ttsToggle.classList.remove('tn-text-secondary');
        } else {
            ttsIconOff.classList.remove('hidden');
            ttsIconOn.classList.add('hidden');
            ttsStatus.textContent = 'TTS Off';
            ttsToggle.classList.remove('tn-accent');
            ttsToggle.classList.add('tn-text-secondary');
        }
    }
    
    // Play ARDEN response with TTS
    async function playArdenResponse(text) {
        if (!ttsEnabled) return;
        
        try {
            // Stop any currently playing audio
            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
            }
            
            console.log('Getting TTS for:', text.substring(0, 50) + '...');
            const audioBlob = await getTextToSpeech(text);
            currentAudio = playAudio(audioBlob);
            
        } catch (error) {
            console.error('Failed to play TTS:', error);
            // Don't show error to user, just continue silently
        }
    }
    
    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const message = messageInput.value.trim();
        if (!message) return;
        
        // Add user message immediately
        addMessage('user', message, new Date().toISOString());
        
        // Clear input
        messageInput.value = '';
        setLoading(true);
        
        // Show typing indicator
        showTypingIndicator();
        
        try {
            const response = await api.sendMessage(message, sessionId);
            
            // Hide typing indicator
            hideTypingIndicator();
            
            // Store session ID
            if (response.sessionId) {
                sessionId = response.sessionId;
            }
            
            // Add ARDEN response
            addMessage('arden', response.response, response.timestamp);
            
            // Play TTS if enabled
            await playArdenResponse(response.response);
            
        } catch (error) {
            // Hide typing indicator on error
            hideTypingIndicator();
            
            console.error('Chat error:', error);
            addMessage('arden', `Error: ${error.message}`, new Date().toISOString());
        } finally {
            setLoading(false);
        }
    });
    
    // Clear chat
    clearButton.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to clear the chat history?')) {
            return;
        }
        
        try {
            await api.clearChat(sessionId);
            messagesContainer.innerHTML = `
                <div class="text-center py-8 tn-text-tertiary">
                    <p class="text-lg">👋 Welcome! Start a conversation with ARDEN.</p>
                    <p class="text-sm mt-2">Try asking about your TODOs, notes, or anything else.</p>
                </div>
            `;
            sessionId = null;
        } catch (error) {
            console.error('Failed to clear chat:', error);
            alert('Failed to clear chat');
        }
    });
    
    // Logout
    logoutButton.addEventListener('click', async () => {
        try {
            await api.logout();
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
    
    // TTS Toggle
    ttsToggle.addEventListener('click', () => {
        ttsEnabled = !ttsEnabled;
        localStorage.setItem('ardenTtsEnabled', ttsEnabled.toString());
        updateTtsUI();
        
        // Stop any playing audio when disabling
        if (!ttsEnabled && currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        
        console.log('TTS', ttsEnabled ? 'enabled' : 'disabled');
    });
    
    // Voice Recording
    const voiceButton = document.getElementById('voice-button');
    const micIcon = document.getElementById('mic-icon');
    const recordingIcon = document.getElementById('recording-icon');
    const voiceRecorder = new VoiceRecorder();
    let isRecording = false;
    
    // Check if voice recording is supported
    if (!VoiceRecorder.isSupported()) {
        voiceButton.disabled = true;
        voiceButton.title = 'Voice recording not supported in this browser';
        voiceButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
    
    // Voice button - hold to record
    voiceButton.addEventListener('mousedown', async (e) => {
        e.preventDefault();
        if (isRecording || !VoiceRecorder.isSupported()) return;
        
        try {
            await voiceRecorder.startRecording();
            isRecording = true;
            
            // Update UI
            voiceButton.style.backgroundColor = '#f7768e'; // Tokyo Night danger red
            voiceButton.style.borderColor = '#f7768e';
            micIcon.classList.add('hidden');
            recordingIcon.classList.remove('hidden');
            messageInput.placeholder = 'Recording... Release to send';
            
        } catch (error) {
            console.error('Failed to start recording:', error);
            
            // Show user-friendly error message
            let errorMessage = 'Failed to access microphone. ';
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage += 'Please allow microphone access in your browser settings.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'No microphone device found.';
            } else if (error.name === 'NotReadableError') {
                errorMessage += 'Microphone is already in use by another application.';
            } else {
                errorMessage += error.message;
            }
            
            // Show error in chat
            addMessage('arden', errorMessage, new Date().toISOString());
        }
    });
    
    // Stop recording on mouse up or leave
    const stopRecording = async () => {
        if (!isRecording) return;
        
        try {
            const audioBlob = await voiceRecorder.stopRecording();
            isRecording = false;
            
            // Reset UI
            voiceButton.style.backgroundColor = '#414868'; // Tokyo Night border
            voiceButton.style.borderColor = '#414868';
            micIcon.classList.remove('hidden');
            recordingIcon.classList.add('hidden');
            messageInput.placeholder = 'Type your message or use voice...';
            
            // Show processing message
            setLoading(true);
            sendText.textContent = 'Transcribing...';
            
            // Transcribe audio
            const transcription = await sendAudioForTranscription(audioBlob);
            
            console.log('Transcription:', transcription);
            
            // Send transcription as message
            messageInput.value = transcription;
            sendText.textContent = 'Sending...';
            
            // Add user message
            addMessage('user', transcription, new Date().toISOString());
            
            // Show typing indicator
            showTypingIndicator();
            
            // Send to ARDEN
            const response = await api.sendMessage(transcription, sessionId);
            
            // Hide typing indicator
            hideTypingIndicator();
            
            if (response.sessionId) {
                sessionId = response.sessionId;
            }
            
            // Add ARDEN response
            addMessage('arden', response.response, response.timestamp);
            
            // Play TTS if enabled
            await playArdenResponse(response.response);
            
            // Clear input
            messageInput.value = '';
            
        } catch (error) {
            // Hide typing indicator on error
            hideTypingIndicator();
            
            console.error('Voice message error:', error);
            addMessage('arden', `Voice error: ${error.message}`, new Date().toISOString());
        } finally {
            setLoading(false);
        }
    };
    
    voiceButton.addEventListener('mouseup', stopRecording);
    voiceButton.addEventListener('mouseleave', stopRecording);
    
    // Also support touch events for mobile
    voiceButton.addEventListener('touchstart', async (e) => {
        e.preventDefault();
        voiceButton.dispatchEvent(new MouseEvent('mousedown'));
    });
    
    voiceButton.addEventListener('touchend', async (e) => {
        e.preventDefault();
        await stopRecording();
    });
    
    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Focus input
    messageInput.focus();
});
