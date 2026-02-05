/**
 * Test Fixtures
 * 
 * Mock data and helpers for testing
 */

const path = require('path');
const fs = require('fs').promises;

/**
 * Mock audio file path (OGG format)
 */
const MOCK_AUDIO_FILE = path.join(__dirname, 'test-audio.ogg');

/**
 * Mock transcription results
 */
const MOCK_TRANSCRIPTIONS = {
  'hello world': 'Hello world',
  'weather query': 'What is the weather today?',
  'note taking': 'Take a note: Remember to call John',
};

/**
 * Create a mock audio file for testing
 * (Creates an empty file with OGG extension)
 */
async function createMockAudioFile() {
  await fs.writeFile(MOCK_AUDIO_FILE, Buffer.from(''));
  return MOCK_AUDIO_FILE;
}

/**
 * Clean up mock audio file
 */
async function cleanupMockAudioFile() {
  try {
    await fs.unlink(MOCK_AUDIO_FILE);
  } catch (error) {
    // File might not exist, ignore
  }
}

/**
 * Mock configuration object
 */
const MOCK_CONFIG = {
  voice: {
    enabled: true,
    stt_provider: 'local-whisper',
    stt_config: {
      model: 'base',
      language: 'en'
    },
    tts_provider: 'edge-tts',
    tts_config: {
      voice: 'en-US-AriaNeural'
    }
  },
  telegram: {
    enabled: true,
    allowed_users: []
  },
  api: {
    port: 3000,
    host: '0.0.0.0'
  }
};

module.exports = {
  MOCK_AUDIO_FILE,
  MOCK_TRANSCRIPTIONS,
  MOCK_CONFIG,
  createMockAudioFile,
  cleanupMockAudioFile,
};
