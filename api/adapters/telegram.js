/**
 * Telegram Adapter
 * 
 * Connects ARDEN to Telegram via node-telegram-bot-api.
 * Supports text messages, voice messages, and /commands.
 * 
 * The original telegram-bot.js entry-point is preserved for backward
 * compatibility -- it can optionally delegate to this adapter or
 * continue running standalone.
 */

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs').promises;
const path = require('path');
const BaseAdapter = require('./base');
const logger = require('../utils/logger');
const { AI_PROVIDER, OLLAMA_MODEL, OPENAI_MODEL } = require('../services/ai-providers');

// Existing Telegram-specific handlers (reuse, don't rewrite)
const { handleCommand } = require('../handlers/commands');
const { handleVoiceMessage } = require('../handlers/voice');

class TelegramAdapter extends BaseAdapter {
  constructor(options = {}) {
    super(options);
    this.bot = null;

    // Telegram-specific env
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    if (!this.token) {
      logger.system.error('[telegram] TELEGRAM_BOT_TOKEN not set');
      process.exit(1);
    }
  }

  get name() {
    return 'telegram';
  }

  // ── Lifecycle hooks ────────────────────────────────────────────

  async _initClient() {
    this.bot = new TelegramBot(this.token, { polling: true });

    // Ensure voice directories
    const voiceDir = path.join(this.root, 'voice/recordings');
    const responseDir = path.join(this.root, 'voice/responses');
    await fs.mkdir(voiceDir, { recursive: true });
    await fs.mkdir(responseDir, { recursive: true });
  }

  async _registerHandlers() {
    this.bot.on('message', (msg) => this._onMessage(msg));
    this.bot.on('polling_error', (error) => {
      logger.system.error('[telegram] Polling error', { error: error.message, code: error.code });
    });
  }

  async _startClient() {
    logger.system.info('[telegram] Bot started', {
      aiProvider: AI_PROVIDER,
      aiModel: AI_PROVIDER === 'ollama' ? OLLAMA_MODEL : AI_PROVIDER === 'openai' ? OPENAI_MODEL : 'N/A',
      voiceEnabled: this.config.voice.enabled,
      sttProvider: this.config.voice.stt_provider,
      ttsProvider: this.config.voice.tts_provider,
    });

    console.log('ARDEN Telegram Adapter started');
    console.log(`  AI Provider: ${AI_PROVIDER}`);
    console.log(`  Voice: ${this.config.voice.enabled ? 'enabled' : 'disabled'}`);
  }

  async _stopClient() {
    if (this.bot) {
      this.bot.stopPolling();
    }
  }

  // ── Platform methods ───────────────────────────────────────────

  async _sendResponse(ctx, text) {
    await this.bot.sendMessage(ctx.chatId, text, {
      disable_web_page_preview: true,
    });
  }

  async _sendTyping(ctx) {
    await this.bot.sendChatAction(ctx.chatId, 'typing');
  }

  // ── Message routing ────────────────────────────────────────────

  async _onMessage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;

    // Voice messages -- delegate to existing specialised handler
    if (msg.voice) {
      // Auth + rate-limit still apply
      if (!this.isAuthorized(userId)) {
        await this.bot.sendMessage(chatId, 'Unauthorized. Contact the administrator.');
        return;
      }
      const rl = this.checkRateLimit(userId);
      if (!rl.allowed) {
        await this.bot.sendMessage(chatId, `Rate limit exceeded. Wait ${rl.waitTime}s.`);
        return;
      }
      await handleVoiceMessage(this.bot, msg);
      return;
    }

    // Slash commands
    if (msg.text && msg.text.startsWith('/')) {
      await handleCommand(this.bot, msg, this.rateLimitMap);
      return;
    }

    // Regular text -- goes through the shared pipeline
    if (msg.text) {
      const ctx = { chatId };
      await this.processMessage(ctx, userId, username, msg.text);
    }
  }
}

module.exports = TelegramAdapter;
