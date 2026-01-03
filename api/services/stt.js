/**
 * Speech-to-Text Service
 * 
 * Handles conversion of voice messages to text using multiple providers:
 * - Local Whisper (via Python venv)
 * - OpenAI Whisper API
 * 
 * Includes automatic fallback from local to OpenAI if local fails.
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

// Ensure we're working from the correct directory
const ARDEN_ROOT = path.resolve(__dirname, '../..');

// Load configuration
const config = require(path.join(ARDEN_ROOT, 'config/arden.json'));

// Environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Convert voice message to text using Local Whisper
 */
async function speechToTextLocal(filePath) {
  const whisperPath = path.join(ARDEN_ROOT, 'venv/bin/whisper');
  const model = config.voice.stt_config.model || 'base';
  const language = config.voice.stt_config.language || 'en';

  logger.voice.info('Using local Whisper', { model, language, filePath });

  return new Promise((resolve, reject) => {
    const command = `"${whisperPath}" "${filePath}" --model ${model} --language ${language} --output_format txt --output_dir /tmp`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        logger.voice.error('Local Whisper error', { error: error.message, stderr });
        reject(new Error(`Local Whisper failed: ${error.message}`));
        return;
      }

      // Whisper saves output as filename.txt
      const baseName = path.basename(filePath, path.extname(filePath));
      const outputFile = `/tmp/${baseName}.txt`;

      fs.readFile(outputFile)
        .then(content => {
          // Clean up temp file
          fs.unlink(outputFile).catch(err => {
            logger.voice.warn('Failed to cleanup temp file', { outputFile, error: err.message });
          });
          const transcription = content.toString().trim();
          logger.voice.info('Local Whisper transcription successful', { 
            length: transcription.length,
            preview: transcription.substring(0, 50) 
          });
          resolve(transcription);
        })
        .catch(err => {
          logger.voice.error('Error reading Whisper output', { outputFile, error: err.message });
          reject(new Error(`Failed to read Whisper output: ${err.message}`));
        });
    });
  });
}

/**
 * Convert voice message to text using OpenAI Whisper API
 */
async function speechToTextOpenAI(filePath) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  logger.voice.info('Using OpenAI Whisper API', { filePath });

  const formData = new FormData();
  formData.append('file', await fs.readFile(filePath), {
    filename: path.basename(filePath),
    contentType: 'audio/ogg',
  });
  formData.append('model', 'whisper-1');
  formData.append('language', config.voice.stt_config.language || 'en');

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const transcription = response.data.text;
    logger.voice.info('OpenAI Whisper transcription successful', { 
      length: transcription.length,
      preview: transcription.substring(0, 50)
    });
    return transcription;
  } catch (error) {
    logger.voice.error('OpenAI Whisper API error', { 
      error: error.message,
      status: error.response?.status 
    });
    throw error;
  }
}

/**
 * Convert voice message to text with automatic fallback
 * Tries local Whisper first, falls back to OpenAI API if local fails
 */
async function speechToText(filePath) {
  const provider = config.voice.stt_provider || 'local-whisper';
  
  logger.voice.info('Starting speech-to-text', { provider, filePath });

  try {
    // Try primary provider first
    if (provider === 'openai-whisper') {
      return await speechToTextOpenAI(filePath);
    } else {
      return await speechToTextLocal(filePath);
    }
  } catch (error) {
    logger.voice.error(`Primary STT provider (${provider}) failed`, { error: error.message });
    
    // Try fallback if available
    if (provider === 'local-whisper' && OPENAI_API_KEY) {
      logger.voice.info('Falling back to OpenAI Whisper API...');
      try {
        const result = await speechToTextOpenAI(filePath);
        logger.voice.info('Fallback successful');
        return result;
      } catch (fallbackError) {
        logger.voice.error('Fallback to OpenAI also failed', { error: fallbackError.message });
        throw new Error('All speech-to-text providers failed. Please check your configuration.');
      }
    } else if (provider === 'openai-whisper') {
      // No fallback for OpenAI provider (local Whisper might not be installed)
      throw new Error(`OpenAI Whisper failed and no fallback available: ${error.message}`);
    } else {
      throw new Error(`Speech-to-text failed: ${error.message}. Consider setting OPENAI_API_KEY for fallback.`);
    }
  }
}

module.exports = {
  speechToText,
  speechToTextLocal,
  speechToTextOpenAI,
};
