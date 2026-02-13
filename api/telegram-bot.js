#!/usr/bin/env node

/**
 * ARDEN Telegram Bot  (entry-point)
 *
 * Two modes:
 *   1. Adapter mode (default) -- uses api/adapters/telegram.js via the
 *      unified adapter lifecycle (start / stop / processMessage).
 *   2. Legacy mode -- original standalone code, activated with
 *      ARDEN_LEGACY_TELEGRAM=1  (kept for rollback safety).
 *
 * Setup:
 * 1. Create a bot with @BotFather on Telegram
 * 2. Set TELEGRAM_BOT_TOKEN environment variable
 * 3. Set OPENAI_API_KEY for Whisper STT
 * 4. Set ELEVENLABS_API_KEY for TTS (optional)
 * 5. Run: node telegram-bot.js
 */

const path = require('path');

// Ensure we're working from the correct directory
const ARDEN_ROOT = path.resolve(__dirname, '..');
process.chdir(ARDEN_ROOT);

// Load environment variables from .env file
require('dotenv').config({ path: path.join(ARDEN_ROOT, '.env') });

// ── Adapter mode (default) ─────────────────────────────────────
if (!process.env.ARDEN_LEGACY_TELEGRAM) {
  const { TelegramAdapter } = require('./adapters');
  const adapter = new TelegramAdapter();
  adapter.start().catch((err) => {
    console.error('Failed to start Telegram adapter:', err);
    process.exit(1);
  });
  return;
}

// ── Legacy mode (ARDEN_LEGACY_TELEGRAM=1) ──────────────────────
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs').promises;

const config = require(path.join(ARDEN_ROOT, 'config/arden.json'));
const logger = require('./utils/logger');
const { validateConfig } = require('./utils/config-validator');
const { handleMessage } = require('./handlers/messages');
const { AI_PROVIDER, OLLAMA_MODEL, OPENAI_MODEL } = require('./services/ai-providers');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!TELEGRAM_BOT_TOKEN) {
  logger.system.error('TELEGRAM_BOT_TOKEN environment variable not set');
  process.exit(1);
}

const sttProvider = config.voice.stt_provider || 'local-whisper';
if (sttProvider === 'openai-whisper' && !OPENAI_API_KEY) {
  logger.system.error('OPENAI_API_KEY required for OpenAI Whisper');
  process.exit(1);
}

if (AI_PROVIDER === 'openai' && !OPENAI_API_KEY) {
  logger.system.error('OPENAI_API_KEY required when AI_PROVIDER=openai');
  process.exit(1);
}

logger.system.info('Validating configuration...');
let configValidation;
try {
  validateConfig(config);
  configValidation = { valid: true, errors: [], warnings: [] };
} catch (error) {
  configValidation = { valid: false, errors: [error.message], warnings: [] };
}

if (!configValidation.valid) {
  logger.system.error('Configuration validation failed', { 
    errors: configValidation.errors,
    warnings: configValidation.warnings 
  });
  configValidation.errors.forEach(error => {
    logger.system.error(`Config error: ${error}`);
  });
  configValidation.warnings.forEach(warning => {
    logger.system.warn(`Config warning: ${warning}`);
  });
  process.exit(1);
}

if (configValidation.warnings && configValidation.warnings.length > 0) {
  configValidation.warnings.forEach(warning => {
    logger.system.warn(`Config warning: ${warning}`);
  });
}

logger.system.info('Configuration validation passed', { 
  errors: 0,
  warnings: configValidation.warnings ? configValidation.warnings.length : 0
});

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
const rateLimitMap = new Map();

const VOICE_DIR = path.join(ARDEN_ROOT, 'voice/recordings');
const RESPONSE_DIR = path.join(ARDEN_ROOT, 'voice/responses');

async function initDirectories() {
  await fs.mkdir(VOICE_DIR, { recursive: true });
  await fs.mkdir(RESPONSE_DIR, { recursive: true });
  logger.system.info('Directories initialized', { VOICE_DIR, RESPONSE_DIR });
}

bot.on('message', async (msg) => {
  await handleMessage(bot, msg, rateLimitMap);
});

bot.on('polling_error', (error) => {
  logger.system.error('Polling error', { error: error.message, code: error.code });
});

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

(async () => {
  try {
    await initDirectories();
    
    logger.system.info('ARDEN Telegram Bot started (legacy mode)', {
      workingDirectory: ARDEN_ROOT,
      aiProvider: AI_PROVIDER,
      aiModel: AI_PROVIDER === 'ollama' ? OLLAMA_MODEL : AI_PROVIDER === 'openai' ? OPENAI_MODEL : 'N/A',
      voiceEnabled: config.voice.enabled,
      sttProvider: config.voice.stt_provider,
      ttsProvider: config.voice.tts_provider,
    });

    console.log('ARDEN Telegram Bot started (legacy mode)');
    console.log(`AI Provider: ${AI_PROVIDER}`);
    console.log(`Voice enabled: ${config.voice.enabled}`);
  } catch (error) {
    logger.system.error('Failed to initialize bot', { error: error.message });
    process.exit(1);
  }
})();
