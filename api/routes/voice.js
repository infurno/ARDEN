/**
 * Voice Routes
 * 
 * Handles voice recording, STT, and TTS for web interface
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const { speechToText } = require('../services/stt');
const { textToSpeech } = require('../services/tts');

// Ensure we're working from the correct directory
const ARDEN_ROOT = path.resolve(__dirname, '../..');

// Configure multer for file uploads
const VOICE_DIR = path.join(ARDEN_ROOT, 'voice/recordings');
const upload = multer({
  dest: VOICE_DIR,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Ensure voice directory exists
fs.mkdir(VOICE_DIR, { recursive: true }).catch(err => {
  logger.voice.error('Failed to create voice directory', { error: err.message });
});

/**
 * POST /api/voice/stt
 * Convert speech to text
 */
router.post('/stt', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No audio file provided'
    });
  }

  const audioPath = req.file.path;
  const userId = req.session?.userId || 'web-user';

  logger.voice.info('STT request received', {
    userId,
    filename: req.file.originalname,
    size: req.file.size
  });

  try {
    // Transcribe audio
    const transcription = await speechToText(audioPath);

    logger.voice.info('STT successful', {
      userId,
      transcriptionLength: transcription.length
    });

    // Clean up audio file
    await fs.unlink(audioPath).catch(err => {
      logger.voice.warn('Failed to cleanup audio file', {
        audioPath,
        error: err.message
      });
    });

    return res.json({
      success: true,
      transcription: transcription,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.voice.error('STT error', {
      userId,
      error: error.message
    });

    // Clean up audio file on error
    await fs.unlink(audioPath).catch(() => {});

    return res.status(500).json({
      success: false,
      error: 'Speech-to-text failed',
      details: error.message
    });
  }
});

/**
 * POST /api/voice/tts
 * Convert text to speech
 */
router.post('/tts', async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Text is required'
    });
  }

  const userId = req.session?.userId || 'web-user';

  logger.voice.info('TTS request received', {
    userId,
    textLength: text.length
  });

  try {
    // Generate speech
    const audioPath = await textToSpeech(text);

    if (!audioPath) {
      throw new Error('TTS generation failed - no audio file produced');
    }

    logger.voice.info('TTS successful', {
      userId,
      audioPath
    });

    // Read audio file
    const audioData = await fs.readFile(audioPath);

    // Clean up audio file
    await fs.unlink(audioPath).catch(err => {
      logger.voice.warn('Failed to cleanup TTS file', {
        audioPath,
        error: err.message
      });
    });

    // Send audio file
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioData.length
    });

    return res.send(audioData);

  } catch (error) {
    logger.voice.error('TTS error', {
      userId,
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Text-to-speech failed',
      details: error.message
    });
  }
});

module.exports = router;
