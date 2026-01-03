/**
 * Command Handlers
 * 
 * Handles Telegram bot commands:
 * - /start - Welcome message
 * - /help - Help documentation
 * - /status - System status
 * - /skills - Available skills
 */

const logger = require('../utils/logger');
const { AI_PROVIDER, OLLAMA_MODEL, OPENAI_MODEL } = require('../services/ai-providers');

// Load configuration
const path = require('path');
const ARDEN_ROOT = path.resolve(__dirname, '../..');
const config = require(path.join(ARDEN_ROOT, 'config/arden.json'));

// Environment variables
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;  // Max 10 requests per minute per user

/**
 * Handle /start command
 */
async function handleStart(bot, msg) {
  const chatId = msg.chat.id;
  
  logger.system.info('/start command received', { 
    userId: msg.from.id,
    username: msg.from.username 
  });

  await bot.sendMessage(chatId,
    '👋 Welcome to ARDEN!\n\n' +
    'I\'m your AI Routine Daily Engagement Nexus.\n\n' +
    'You can:\n' +
    '• Send me text messages\n' +
    '• Send me voice messages\n' +
    '• Ask me questions\n' +
    '• Request tasks\n\n' +
    'Commands:\n' +
    '/help - Show this message\n' +
    '/status - Check system status\n' +
    '/skills - List available skills\n'
  );
}

/**
 * Handle /help command
 */
async function handleHelp(bot, msg) {
  const chatId = msg.chat.id;
  
  logger.system.info('/help command received', { 
    userId: msg.from.id,
    username: msg.from.username 
  });

  await bot.sendMessage(chatId,
    '📚 ARDEN Help\n\n' +
    'Voice Messages:\n' +
    'Just record and send a voice message. I\'ll transcribe and respond.\n\n' +
    'Text Messages:\n' +
    'Type your question or request naturally.\n\n' +
    'Examples:\n' +
    '• "What\'s on my schedule today?"\n' +
    '• "Summarize this article: [URL]"\n' +
    '• "Create a todo list for my project"\n'
  );
}

/**
 * Handle /status command
 */
async function handleStatus(bot, msg, rateLimitMap) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  logger.system.info('/status command received', { 
    userId: msg.from.id,
    username: msg.from.username 
  });

  const status = {
    voice_enabled: config.voice.enabled,
    stt_provider: config.voice.stt_provider,
    tts_provider: config.voice.tts_provider,
    tts_available: !!ELEVENLABS_API_KEY,
  };
  
  const userRateLimit = rateLimitMap.get(userId);
  const rateLimitInfo = userRateLimit 
    ? `${userRateLimit.count}/${RATE_LIMIT_MAX_REQUESTS} (resets in ${Math.ceil((userRateLimit.resetTime - Date.now()) / 1000)}s)`
    : `0/${RATE_LIMIT_MAX_REQUESTS}`;
  
  let aiProviderInfo = AI_PROVIDER;
  if (AI_PROVIDER === 'ollama') aiProviderInfo += ` (${OLLAMA_MODEL})`;
  if (AI_PROVIDER === 'openai') aiProviderInfo += ` (${OPENAI_MODEL})`;
  
  await bot.sendMessage(chatId,
    '📊 System Status\n\n' +
    `Voice: ${status.voice_enabled ? '✅' : '❌'}\n` +
    `STT: ${status.stt_provider}\n` +
    `TTS: ${status.tts_provider} ${status.tts_available ? '✅' : '❌'}\n` +
    `AI Provider: ${aiProviderInfo}\n` +
    `Rate Limit: ${rateLimitInfo}\n`
  );
}

/**
 * Handle /skills command
 */
async function handleSkills(bot, msg) {
  const chatId = msg.chat.id;
  
  logger.system.info('/skills command received', { 
    userId: msg.from.id,
    username: msg.from.username 
  });

  await bot.sendMessage(chatId,
    '🎯 Available Skills\n\n' +
    '• Daily Planning\n' +
    '• Research & Analysis\n' +
    '• Content Creation\n' +
    '• Task Management\n' +
    '• Information Retrieval\n\n' +
    'Skills are loaded automatically based on your request.'
  );
}

/**
 * Handle unknown commands
 */
async function handleUnknown(bot, msg) {
  const chatId = msg.chat.id;
  
  logger.system.warn('Unknown command received', { 
    userId: msg.from.id,
    username: msg.from.username,
    command: msg.text 
  });

  await bot.sendMessage(chatId, '❓ Unknown command. Use /help for assistance.');
}

/**
 * Route command to appropriate handler
 */
async function handleCommand(bot, msg, rateLimitMap) {
  const command = msg.text.split(' ')[0];

  switch (command) {
    case '/start':
      await handleStart(bot, msg);
      break;
    case '/help':
      await handleHelp(bot, msg);
      break;
    case '/status':
      await handleStatus(bot, msg, rateLimitMap);
      break;
    case '/skills':
      await handleSkills(bot, msg);
      break;
    default:
      await handleUnknown(bot, msg);
  }
}

module.exports = {
  handleCommand,
  handleStart,
  handleHelp,
  handleStatus,
  handleSkills,
  handleUnknown,
};
