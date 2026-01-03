/**
 * Voice Recording Handler
 * 
 * Handles browser-based voice recording using Web Audio API
 */

class VoiceRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.stream = null;
    }

    /**
     * Check if browser supports voice recording
     */
    static isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    /**
     * Request microphone permission and start recording
     */
    async startRecording() {
        if (this.isRecording) {
            throw new Error('Already recording');
        }

        if (!VoiceRecorder.isSupported()) {
            throw new Error('Voice recording not supported in this browser');
        }

        try {
            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });

            // Create media recorder
            const options = { mimeType: 'audio/webm;codecs=opus' };
            
            // Fallback for Safari
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'audio/webm';
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options.mimeType = 'audio/ogg;codecs=opus';
                    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                        options.mimeType = '';
                    }
                }
            }

            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.audioChunks = [];

            // Collect audio data
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            // Start recording
            this.mediaRecorder.start();
            this.isRecording = true;

            console.log('Recording started');

        } catch (error) {
            console.error('Failed to start recording:', error);
            this.cleanup();
            throw new Error('Failed to access microphone. Please check permissions.');
        }
    }

    /**
     * Stop recording and return audio blob
     */
    async stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) {
            throw new Error('Not currently recording');
        }

        return new Promise((resolve, reject) => {
            this.mediaRecorder.onstop = () => {
                try {
                    // Create blob from recorded chunks
                    const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
                    const audioBlob = new Blob(this.audioChunks, { type: mimeType });
                    
                    console.log('Recording stopped, blob size:', audioBlob.size, 'type:', mimeType);
                    
                    this.cleanup();
                    this.isRecording = false;
                    
                    resolve(audioBlob);
                } catch (error) {
                    reject(error);
                }
            };

            this.mediaRecorder.stop();
        });
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    /**
     * Convert audio blob to file
     */
    static blobToFile(blob, filename = 'recording.webm') {
        return new File([blob], filename, { type: blob.type });
    }
}

/**
 * Send audio to STT API
 */
async function sendAudioForTranscription(audioBlob) {
    const formData = new FormData();
    const audioFile = VoiceRecorder.blobToFile(audioBlob, 'voice-message.webm');
    formData.append('audio', audioFile);

    const response = await fetch('/api/voice/stt', {
        method: 'POST',
        credentials: 'include',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.details || 'Transcription failed');
    }

    const data = await response.json();
    return data.transcription;
}

/**
 * Get TTS audio for text
 */
async function getTextToSpeech(text) {
    const response = await fetch('/api/voice/tts', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.details || 'TTS failed');
    }

    const audioBlob = await response.blob();
    return audioBlob;
}

/**
 * Play audio blob
 */
function playAudio(audioBlob) {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
    };
    
    audio.play().catch(error => {
        console.error('Failed to play audio:', error);
        URL.revokeObjectURL(audioUrl);
    });
    
    return audio;
}
