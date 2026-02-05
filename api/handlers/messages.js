/**
 * Message Handler
 * 
 * Main message routing and processing:
 * - Routes to command handler for commands
 * - Routes to voice handler for voice messages
 * - Processes text messages with AI
 * - Handles authorization and rate limiting
 */

const logger = require('../utils/logger');
const { checkRateLimit } = require('../utils/rate-limiter');
const { handleCommand } = require('./commands');
const { handleVoiceMessage } = require('./voice');
const { executeArden } = require('../services/ai-providers');
const { logInteraction } = require('../services/session');

// Load configuration
const path = require('path');
const ARDEN_ROOT = path.resolve(__dirname, '../..');
const config = require(path.join(ARDEN_ROOT, 'config/arden.json'));

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;  // Max 10 requests per minute per user

/**
 * Check if user is authorized
 */
function isAuthorized(userId) {
  // If no allowed_users configured, allow everyone
  if (!config.telegram.allowed_users || config.telegram.allowed_users.length === 0) {
    return true;
  }
  return config.telegram.allowed_users.includes(userId);
}

/**
 * Escape special characters for Telegram Markdown
 */
function escapeMarkdown(text) {
  // Escape special Markdown characters for Telegram
  return text
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
}

/**
 * Handle text message
 */
async function handleTextMessage(bot, msg, prompt) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;

  logger.user.info('Processing text message', { userId, username, prompt });

  try {
    // Send typing indicator
    await bot.sendChatAction(chatId, 'typing');

    // Execute ARDEN
    const ardenResponse = await executeArden(prompt);

    // Log interaction
    await logInteraction(userId, username, prompt, ardenResponse);

    // Send text response without Markdown parsing to avoid parsing errors
    // Plain text is more reliable for AI-generated responses
    await bot.sendMessage(chatId, ardenResponse, {
      disable_web_page_preview: true
    });

    logger.user.info('Text message processing complete', { userId });

  } catch (error) {
    logger.user.error('Error processing text message', { 
      userId, 
      error: error.message 
    });
    await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
}

/**
 * Main message handler
 */
async function handleMessage(bot, msg, rateLimitMap) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;

  logger.system.info('Message received', { 
    userId, 
    username, 
    type: msg.voice ? 'voice' : 'text',
    text: msg.text || '[voice message]'
  });

  // Check if user is allowed (if restriction is enabled)
  if (!isAuthorized(userId)) {
    logger.rateLimit.warn('Unauthorized user attempted access', { userId, username });
    await bot.sendMessage(chatId, '❌ Unauthorized. Contact the administrator.');
    return;
  }

  // Rate limiting check
  const rateCheck = checkRateLimit(userId, rateLimitMap, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS);
  if (!rateCheck.allowed) {
    logger.rateLimit.warn('Rate limit exceeded', { userId, waitTime: rateCheck.waitTime });
    await bot.sendMessage(
      chatId,
      `⏱️ Rate limit exceeded. Please wait ${rateCheck.waitTime} seconds before sending another message.\n\n` +
      `Limit: ${RATE_LIMIT_MAX_REQUESTS} requests per minute.`
    );
    return;
  }

  // Log remaining requests for user awareness (only on first few requests)
  if (rateCheck.remaining <= 3) {
    logger.rateLimit.info('Rate limit warning', { 
      userId, 
      remaining: rateCheck.remaining 
    });
  }

  // Route to appropriate handler
  if (msg.voice) {
    await handleVoiceMessage(bot, msg);
  } else if (msg.text) {
    // Handle commands
    if (msg.text.startsWith('/')) {
      await handleCommand(bot, msg, rateLimitMap);
    } else {
      // Handle regular text messages
      await handleTextMessage(bot, msg, msg.text);
    }
  }
}

module.exports = {
  handleMessage,
  handleTextMessage,
  isAuthorized,
};
