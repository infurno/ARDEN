/**
 * Text-to-Speech Service
 * 
 * Handles conversion of text to speech using multiple providers:
 * - ElevenLabs (premium, high quality)
 * - Edge TTS (free, Microsoft)
 * - Piper (free, self-hosted)
 * - OpenAI TTS (affordable, high quality)
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const logger = require('../utils/logger');
const db = require('./database');

// Ensure we're working from the correct directory
const ARDEN_ROOT = path.resolve(__dirname, '../..');

// Load configuration
const config = require(path.join(ARDEN_ROOT, 'config/arden.json'));

// Environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Paths
const RESPONSE_DIR = path.join(ARDEN_ROOT, 'voice/responses');

/**
 * ElevenLabs TTS
 */
async function ttsElevenLabs(text, userId = 'system', sessionId = null) {
  if (!ELEVENLABS_API_KEY) {
    logger.voice.warn('ElevenLabs API key not set, skipping TTS');
    return null;
  }

  logger.voice.info('Using ElevenLabs TTS', { 
    textLength: text.length,
    voiceId: config.voice.tts_config.voice_id 
  });

  try {
    const voiceId = config.voice.tts_config.voice_id;
    const modelId = config.voice.tts_config.model || 'eleven_turbo_v2_5';
    
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: modelId,
        voice_settings: {
          stability: config.voice.tts_config.stability,
          similarity_boost: config.voice.tts_config.similarity_boost,
        },
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    const outputPath = path.join(RESPONSE_DIR, `response_${Date.now()}.mp3`);
    await fs.writeFile(outputPath, response.data);
    
    // Track API usage (characters = tokens for TTS)
    const characterCount = text.length;
    db.recordApiUsage(
      'elevenlabs',
      modelId,
      userId,
      sessionId,
      characterCount, // prompt_tokens = character count
      0,              // completion_tokens = 0 for TTS
      'tts',
      true,
      null
    );
    
    logger.voice.info('ElevenLabs TTS successful', { 
      outputPath, 
      characters: characterCount,
      model: modelId
    });
    return outputPath;
  } catch (error) {
    // Track failed API call
    db.recordApiUsage(
      'elevenlabs',
      config.voice.tts_config.model || 'eleven_turbo_v2_5',
      userId,
      sessionId,
      0,
      0,
      'tts',
      false,
      error.message
    );
    
    logger.voice.error('ElevenLabs TTS error', { 
      error: error.message,
      status: error.response?.status 
    });
    throw error;
  }
}

/**
 * Edge TTS (Microsoft - FREE)
 */
async function ttsEdge(text) {
  const voice = config.voice.tts_config.voice || 'en-US-AriaNeural';
  const outputPath = path.join(RESPONSE_DIR, `response_${Date.now()}.mp3`);
  
  // Try multiple possible locations for edge-tts
  const possiblePaths = [
    path.join(ARDEN_ROOT, 'venv/bin/edge-tts'),
    path.join(process.env.HOME, '.local/bin/edge-tts'),
    'edge-tts' // Use PATH
  ];
  
  let edgeTtsPath = 'edge-tts'; // Default to PATH
  for (const testPath of possiblePaths) {
    try {
      await fs.access(testPath);
      edgeTtsPath = testPath;
      break;
    } catch (err) {
      // Try next path
    }
  }

  logger.voice.info('Using Edge TTS', { voice, textLength: text.length, path: edgeTtsPath });

  return new Promise((resolve, reject) => {
    const command = `"${edgeTtsPath}" --voice "${voice}" --text "${text.replace(/"/g, '\\"')}" --write-media "${outputPath}"`;

    exec(command, (error) => {
      if (error) {
        logger.voice.error('Edge TTS error', { error: error.message });
        reject(new Error('Edge TTS failed. Make sure it is installed (pip install edge-tts).'));
        return;
      }
      logger.voice.info('Edge TTS successful', { outputPath });
      resolve(outputPath);
    });
  });
}

/**
 * Piper TTS (Self-hosted - FREE)
 */
async function ttsPiper(text) {
  const model = config.voice.tts_config.model || 'en_US-amy-medium';
  const modelPath = path.join(
    process.env.HOME,
    `.local/share/piper/models/${model}.onnx`
  );
  const outputPath = path.join(RESPONSE_DIR, `response_${Date.now()}.wav`);

  logger.voice.info('Using Piper TTS', { model, textLength: text.length });

  return new Promise((resolve, reject) => {
    const command = `echo "${text.replace(/"/g, '\\"')}" | piper --model "${modelPath}" --output_file "${outputPath}"`;

    exec(command, (error) => {
      if (error) {
        logger.voice.error('Piper TTS error', { error: error.message });
        reject(new Error('Piper TTS failed. Install with: brew install piper-tts'));
        return;
      }
      logger.voice.info('Piper TTS successful', { outputPath });
      resolve(outputPath);
    });
  });
}

/**
 * OpenAI TTS (Affordable - ~$1/month)
 */
async function ttsOpenAI(text, userId = 'system', sessionId = null) {
  if (!OPENAI_API_KEY) {
    logger.voice.warn('OpenAI API key not set');
    return null;
  }

  const voice = config.voice.tts_config.voice || 'nova';
  const model = config.voice.tts_config.model || 'tts-1';

  logger.voice.info('Using OpenAI TTS', { voice, model, textLength: text.length });

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/audio/speech',
      {
        model,
        input: text,
        voice,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    const outputPath = path.join(RESPONSE_DIR, `response_${Date.now()}.mp3`);
    await fs.writeFile(outputPath, response.data);
    
    // Track API usage (characters = tokens for TTS)
    const characterCount = text.length;
    db.recordApiUsage(
      'openai',
      model,
      userId,
      sessionId,
      characterCount, // prompt_tokens = character count
      0,              // completion_tokens = 0 for TTS
      'tts',
      true,
      null
    );
    
    logger.voice.info('OpenAI TTS successful', { 
      outputPath,
      characters: characterCount,
      model
    });
    return outputPath;
  } catch (error) {
    // Track failed API call
    db.recordApiUsage(
      'openai',
      model,
      userId,
      sessionId,
      0,
      0,
      'tts',
      false,
      error.message
    );
    
    logger.voice.error('OpenAI TTS error', { 
      error: error.message,
      status: error.response?.status 
    });
    throw error;
  }
}

/**
 * Format text for voice output by removing markdown and verbose labels
 * Only returns clean command output unless debug mode is enabled
 */
function formatForVoice(text) {
  // If debug mode is enabled, return the full text with all details
  if (config.voice.debug_mode) {
    logger.voice.info('Voice debug mode enabled, keeping full response');
    return text;
  }

  let cleanText = text;

  // Remove markdown formatting
  cleanText = cleanText
    // Remove bold markers
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove italic markers
    .replace(/\*(.*?)\*/g, '$1')
    // Remove inline code markers
    .replace(/`([^`]+)`/g, '$1')
    // Remove code block markers
    .replace(/```[\s\S]*?```/g, '')
    // Remove command output labels
    .replace(/\*\*Command Output:\*\*/gi, '')
    .replace(/\*\*Command Error:\*\*/gi, 'Error: ')
    // Clean up extra whitespace and newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  logger.voice.info('Formatted text for voice', { 
    originalLength: text.length, 
    cleanedLength: cleanText.length 
  });

  return cleanText;
}

/**
 * Convert text to speech using configured provider
 */
async function textToSpeech(text, userId = 'system', sessionId = null) {
  const provider = config.voice.tts_provider;

  logger.voice.info('Starting text-to-speech', { provider, textLength: text.length });

  try {
    switch (provider) {
      case 'elevenlabs':
        return await ttsElevenLabs(text, userId, sessionId);
      case 'edge-tts':
        return await ttsEdge(text);
      case 'piper':
        return await ttsPiper(text);
      case 'openai-tts':
        return await ttsOpenAI(text, userId, sessionId);
      default:
        logger.voice.warn(`TTS provider '${provider}' not configured, skipping voice response`);
        return null;
    }
  } catch (error) {
    logger.voice.error(`Text-to-speech error with ${provider}`, { error: error.message });
    logger.voice.info('Continuing without voice response...');
    return null;
  }
}

module.exports = {
  textToSpeech,
  formatForVoice,
  ttsElevenLabs,
  ttsEdge,
  ttsPiper,
  ttsOpenAI,
};
