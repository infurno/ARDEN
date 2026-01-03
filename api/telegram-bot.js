#!/usr/bin/env node

/**
 * ARDEN Telegram Voice Bot
 *
 * Enables voice interaction with ARDEN from any device via Telegram.
 * Supports both voice messages and text messages.
 *
 * Setup:
 * 1. Create a bot with @BotFather on Telegram
 * 2. Set TELEGRAM_BOT_TOKEN environment variable
 * 3. Set OPENAI_API_KEY for Whisper STT
 * 4. Set ELEVENLABS_API_KEY for TTS (optional)
 * 5. Run: node telegram-bot.js
 */

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs').promises;
const path = require('path');

// Ensure we're working from the correct directory
// This allows the script to be run from anywhere
const ARDEN_ROOT = path.resolve(__dirname, '..');
process.chdir(ARDEN_ROOT);

// Load environment variables from .env file
require('dotenv').config({ path: path.join(ARDEN_ROOT, '.env') });

// Load configuration
const config = require(path.join(ARDEN_ROOT, 'config/arden.json'));

// Import logger
const logger = require('./utils/logger');

// Import configuration validator
const { validateConfig } = require('./utils/config-validator');

// Import handlers
const { handleMessage } = require('./handlers/messages');

// Import AI provider info for logging
const { AI_PROVIDER, OLLAMA_MODEL, OPENAI_MODEL } = require('./services/ai-providers');

// Environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Validate required environment variables
if (!TELEGRAM_BOT_TOKEN) {
  logger.system.error('TELEGRAM_BOT_TOKEN environment variable not set');
  process.exit(1);
}

// OPENAI_API_KEY only required for OpenAI Whisper STT or OpenAI AI provider
const sttProvider = config.voice.stt_provider || 'local-whisper';
if (sttProvider === 'openai-whisper' && !OPENAI_API_KEY) {
  logger.system.error('OPENAI_API_KEY required for OpenAI Whisper');
  process.exit(1);
}

if (AI_PROVIDER === 'openai' && !OPENAI_API_KEY) {
  logger.system.error('OPENAI_API_KEY required when AI_PROVIDER=openai');
  process.exit(1);
}

// Validate configuration on startup
logger.system.info('Validating configuration...');
const configValidation = validateConfig();

if (!configValidation.valid) {
  logger.system.error('Configuration validation failed', { 
    errors: configValidation.errors,
    warnings: configValidation.warnings 
  });
  
  // Log each error
  configValidation.errors.forEach(error => {
    logger.system.error(`Config error: ${error}`);
  });
  
  // Log warnings but don't exit
  configValidation.warnings.forEach(warning => {
    logger.system.warn(`Config warning: ${warning}`);
  });
  
  process.exit(1);
}

// Log warnings if any
if (configValidation.warnings.length > 0) {
  configValidation.warnings.forEach(warning => {
    logger.system.warn(`Config warning: ${warning}`);
  });
}

logger.system.info('Configuration validation passed', { 
  errors: 0,
  warnings: configValidation.warnings.length 
});

// Initialize bot
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Rate limiting map
const rateLimitMap = new Map(); // userId -> { count, resetTime }

// Paths - now using ARDEN_ROOT for absolute paths
const VOICE_DIR = path.join(ARDEN_ROOT, 'voice/recordings');
const RESPONSE_DIR = path.join(ARDEN_ROOT, 'voice/responses');

// Ensure directories exist
async function initDirectories() {
  await fs.mkdir(VOICE_DIR, { recursive: true });
  await fs.mkdir(RESPONSE_DIR, { recursive: true });
  logger.system.info('Directories initialized', { VOICE_DIR, RESPONSE_DIR });
}

// Bot event handlers
bot.on('message', async (msg) => {
  await handleMessage(bot, msg, rateLimitMap);
});

// Error handling
bot.on('polling_error', (error) => {
  logger.system.error('Polling error', { error: error.message, code: error.code });
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.system.info('Shutting down gracefully...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.system.info('Shutting down gracefully...');
  bot.stopPolling();
  process.exit(0);
});

// Initialize and start
(async () => {
  try {
    await initDirectories();
    
    logger.system.info('ARDEN Telegram Bot started', {
      workingDirectory: ARDEN_ROOT,
      aiProvider: AI_PROVIDER,
      aiModel: AI_PROVIDER === 'ollama' ? OLLAMA_MODEL : AI_PROVIDER === 'openai' ? OPENAI_MODEL : 'N/A',
      voiceEnabled: config.voice.enabled,
      sttProvider: config.voice.stt_provider,
      ttsProvider: config.voice.tts_provider,
    });

    console.log('🤖 ARDEN Telegram Bot started');
    console.log(`📁 Working directory: ${ARDEN_ROOT}`);
    console.log('📱 Send voice or text messages to interact');
    console.log(`AI Provider: ${AI_PROVIDER}`);
    if (AI_PROVIDER === 'ollama') console.log(`Ollama model: ${OLLAMA_MODEL}`);
    if (AI_PROVIDER === 'openai') console.log(`OpenAI model: ${OPENAI_MODEL}`);
    console.log(`Voice enabled: ${config.voice.enabled}`);
    console.log(`STT: ${config.voice.stt_provider}`);
    console.log(`TTS: ${config.voice.tts_provider}`);
  } catch (error) {
    logger.system.error('Failed to initialize bot', { error: error.message });
    process.exit(1);
  }
})();
