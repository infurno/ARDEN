#!/usr/bin/env node

/**
 * ARDEN Discord Bot  (entry-point)
 *
 * Two modes:
 *   1. Adapter mode (default) -- uses api/adapters/discord.js via the
 *      unified adapter lifecycle.
 *   2. Legacy mode -- original standalone code, activated with
 *      ARDEN_LEGACY_DISCORD=1  (kept for rollback safety).
 *
 * Setup:
 * 1. Create a Discord application at https://discord.com/developers/applications
 * 2. Create a bot under the application
 * 3. Enable MESSAGE CONTENT INTENT in Bot settings
 * 4. Set DISCORD_BOT_TOKEN environment variable
 * 5. Invite bot to your server with appropriate permissions
 * 6. Run: node discord-bot.js
 */

const path = require('path');

// Ensure we're working from the correct directory
const ARDEN_ROOT = path.resolve(__dirname, '..');
process.chdir(ARDEN_ROOT);

// Load environment variables from .env file
require('dotenv').config({ path: path.join(ARDEN_ROOT, '.env') });

// ── Adapter mode (default) ─────────────────────────────────────
if (!process.env.ARDEN_LEGACY_DISCORD) {
  const { DiscordAdapter } = require('./adapters');
  const adapter = new DiscordAdapter();
  adapter.start().catch((err) => {
    console.error('Failed to start Discord adapter:', err);
    process.exit(1);
  });
  return;
}

// ── Legacy mode (ARDEN_LEGACY_DISCORD=1) ───────────────────────

const { Client, GatewayIntentBits, Partials, AttachmentBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// Ensure we're working from the correct directory
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

// Import AI provider info for logging
const { AI_PROVIDER, OLLAMA_MODEL, OPENAI_MODEL } = require('./services/ai-providers');

// Environment variables
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Validate required environment variables
if (!DISCORD_BOT_TOKEN) {
  logger.system.error('DISCORD_BOT_TOKEN environment variable not set');
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

// Log warnings if any
if (configValidation.warnings && configValidation.warnings.length > 0) {
  configValidation.warnings.forEach(warning => {
    logger.system.warn(`Config warning: ${warning}`);
  });
}

logger.system.info('Configuration validation passed', { 
  errors: 0,
  warnings: configValidation.warnings ? configValidation.warnings.length : 0
});

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// Import handlers
const { executeArden } = require('./services/ai-providers');
const { logInteraction } = require('./services/session');
const { checkRateLimit } = require('./utils/rate-limiter');

// Rate limiting map
const rateLimitMap = new Map(); // userId -> { count, resetTime }

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;  // Max 10 requests per minute per user

// Paths
const VOICE_DIR = path.join(ARDEN_ROOT, 'voice/recordings');
const RESPONSE_DIR = path.join(ARDEN_ROOT, 'voice/responses');

// Ensure directories exist
async function initDirectories() {
  await fs.mkdir(VOICE_DIR, { recursive: true });
  await fs.mkdir(RESPONSE_DIR, { recursive: true });
  logger.system.info('Directories initialized', { VOICE_DIR, RESPONSE_DIR });
}

/**
 * Check if user is authorized
 */
function isAuthorized(userId) {
  // If no allowed_users configured, allow everyone
  if (!config.discord || !config.discord.allowed_users || config.discord.allowed_users.length === 0) {
    return true;
  }
  return config.discord.allowed_users.includes(userId);
}

/**
 * Handle text message
 */
async function handleTextMessage(message, prompt) {
  const userId = message.author.id;
  const username = message.author.username;

  logger.user.info('Processing Discord text message', { userId, username, prompt });

  try {
    // Send typing indicator
    await message.channel.sendTyping();

    // Execute ARDEN
    const ardenResponse = await executeArden(prompt);

    // Log interaction
    const sessionId = `discord-${userId}`;
    await logInteraction(sessionId, userId, 'text', prompt, ardenResponse);

    // Split long messages (Discord has 2000 char limit)
    if (ardenResponse.length > 2000) {
      const chunks = ardenResponse.match(/[\s\S]{1,2000}/g) || [];
      for (const chunk of chunks) {
        await message.reply(chunk);
      }
    } else {
      await message.reply(ardenResponse);
    }

    logger.user.info('Discord response sent', { userId, username, responseLength: ardenResponse.length });

  } catch (error) {
    logger.system.error('Error processing Discord message', { 
      error: error.message,
      userId,
      username 
    });
    
    await message.reply('Sorry, I encountered an error processing your message. Please try again.');
  }
}

/**
 * Handle Discord commands
 */
async function handleCommand(message, command, args) {
  const userId = message.author.id;
  const username = message.author.username;

  logger.user.info('Processing Discord command', { userId, username, command, args });

  switch (command) {
    case 'help':
      const helpMessage = `
**ARDEN Discord Bot - Help**

**Commands:**
\`!help\` - Show this help message
\`!status\` - Show bot status
\`!ping\` - Check bot responsiveness
\`!clear\` - Clear your conversation history

**Usage:**
Just send me a message and I'll respond!
You can also mention me with @ARDEN

**AI Provider:** ${AI_PROVIDER}
**Model:** ${AI_PROVIDER === 'ollama' ? OLLAMA_MODEL : AI_PROVIDER === 'openai' ? OPENAI_MODEL : 'N/A'}
      `;
      await message.reply(helpMessage);
      break;

    case 'status':
      const statusMessage = `
**ARDEN Status**
✅ Online and ready
**AI Provider:** ${AI_PROVIDER}
**Model:** ${AI_PROVIDER === 'ollama' ? OLLAMA_MODEL : AI_PROVIDER === 'openai' ? OPENAI_MODEL : 'N/A'}
**Voice Enabled:** ${config.voice.enabled ? 'Yes' : 'No'}
**Uptime:** ${Math.floor(process.uptime())} seconds
      `;
      await message.reply(statusMessage);
      break;

    case 'ping':
      const ping = Date.now() - message.createdTimestamp;
      await message.reply(`🏓 Pong! Latency: ${ping}ms`);
      break;

    case 'clear':
      // TODO: Implement conversation history clearing
      await message.reply('Conversation history cleared.');
      break;

    default:
      await message.reply(`Unknown command: \`!${command}\`. Type \`!help\` for available commands.`);
  }
}

/**
 * Handle message event
 */
async function handleMessage(message) {
  // Ignore bot messages
  if (message.author.bot) return;

  const userId = message.author.id;
  const username = message.author.username;

  // Check authorization
  if (!isAuthorized(userId)) {
    logger.system.warn('Unauthorized Discord user', { userId, username });
    await message.reply('Sorry, you are not authorized to use this bot.');
    return;
  }

  // Check rate limit
  const rateLimitResult = checkRateLimit(
    userId,
    rateLimitMap,
    RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS
  );

  if (!rateLimitResult.allowed) {
    logger.system.warn('Discord rate limit exceeded', { 
      userId, 
      username,
      remainingTime: rateLimitResult.remainingTime 
    });
    await message.reply(`Rate limit exceeded. Please wait ${rateLimitResult.waitTime} seconds.`);
    return;
  }

  // Get message content
  const content = message.content.trim();

  // Handle commands (starting with !)
  if (content.startsWith('!')) {
    const args = content.slice(1).trim().split(/\s+/);
    const command = args.shift().toLowerCase();
    await handleCommand(message, command, args);
    return;
  }

  // Handle mentions (bot was mentioned)
  const botMentioned = message.mentions.has(client.user);
  
  // Only respond in DMs or when mentioned in servers
  const isDM = message.channel.type === 1; // DM channel type
  
  if (!isDM && !botMentioned) {
    return; // Ignore messages in servers unless bot is mentioned
  }

  // Remove bot mention from content if present
  let prompt = content;
  if (botMentioned) {
    prompt = content.replace(/<@!?\d+>/g, '').trim();
  }

  if (!prompt) {
    await message.reply('How can I help you?');
    return;
  }

  // Handle text message
  await handleTextMessage(message, prompt);
}

// Discord event handlers
client.on('clientReady', () => {
  logger.system.info('Discord bot ready', {
    username: client.user.tag,
    id: client.user.id,
    guildCount: client.guilds.cache.size
  });
  
  console.log('🤖 ARDEN Discord Bot started');
  console.log(`📁 Working directory: ${ARDEN_ROOT}`);
  console.log(`👤 Logged in as: ${client.user.tag}`);
  console.log(`🌐 Servers: ${client.guilds.cache.size}`);
  console.log(`AI Provider: ${AI_PROVIDER}`);
  if (AI_PROVIDER === 'ollama') console.log(`Ollama model: ${OLLAMA_MODEL}`);
  if (AI_PROVIDER === 'openai') console.log(`OpenAI model: ${OPENAI_MODEL}`);
  console.log(`Voice enabled: ${config.voice.enabled}`);
  
  // Set bot status
  client.user.setPresence({
    activities: [{ name: 'your messages | !help', type: 3 }], // Type 3 = Watching
    status: 'online',
  });
});

client.on('messageCreate', handleMessage);

client.on('error', (error) => {
  logger.system.error('Discord client error', { error: error.message });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.system.info('Shutting down Discord bot gracefully...');
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.system.info('Shutting down Discord bot gracefully...');
  await client.destroy();
  process.exit(0);
});

// Initialize and start
(async () => {
  try {
    await initDirectories();
    
    logger.system.info('Starting ARDEN Discord Bot (legacy mode)', {
      workingDirectory: ARDEN_ROOT,
      aiProvider: AI_PROVIDER,
      aiModel: AI_PROVIDER === 'ollama' ? OLLAMA_MODEL : AI_PROVIDER === 'openai' ? OPENAI_MODEL : 'N/A',
      voiceEnabled: config.voice.enabled,
      sttProvider: config.voice.stt_provider,
      ttsProvider: config.voice.tts_provider,
    });

    // Login to Discord
    await client.login(DISCORD_BOT_TOKEN);

  } catch (error) {
    logger.system.error('Failed to initialize Discord bot', { error: error.message });
    process.exit(1);
  }
})();
