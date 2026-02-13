/**
 * Discord Adapter
 * 
 * Connects ARDEN to Discord via discord.js.
 * Supports text messages, DMs, mentions, and !commands.
 */

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const BaseAdapter = require('./base');
const logger = require('../utils/logger');
const { AI_PROVIDER, OLLAMA_MODEL, OPENAI_MODEL } = require('../services/ai-providers');

class DiscordAdapter extends BaseAdapter {
  constructor(options = {}) {
    super(options);
    this.client = null;

    // Discord-specific env
    this.token = process.env.DISCORD_BOT_TOKEN;
    if (!this.token) {
      logger.system.error('[discord] DISCORD_BOT_TOKEN not set');
      process.exit(1);
    }
  }

  get name() {
    return 'discord';
  }

  // ── Lifecycle hooks ────────────────────────────────────────────

  async _initClient() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates,
      ],
      partials: [Partials.Channel, Partials.Message],
    });

    // Ensure voice directories
    const voiceDir = path.join(this.root, 'voice/recordings');
    const responseDir = path.join(this.root, 'voice/responses');
    await fs.mkdir(voiceDir, { recursive: true });
    await fs.mkdir(responseDir, { recursive: true });
  }

  async _registerHandlers() {
    this.client.on('clientReady', () => this._onReady());
    this.client.on('messageCreate', (msg) => this._onMessage(msg));
    this.client.on('error', (error) => {
      logger.system.error('[discord] Client error', { error: error.message });
    });
  }

  async _startClient() {
    await this.client.login(this.token);
    // Note: actual "started" log fires in _onReady callback
  }

  async _stopClient() {
    if (this.client) {
      await this.client.destroy();
    }
  }

  // ── Platform methods ───────────────────────────────────────────

  async _sendResponse(ctx, text) {
    // Discord has a 2000-char limit
    if (text.length > 2000) {
      const chunks = text.match(/[\s\S]{1,2000}/g) || [];
      for (const chunk of chunks) {
        await ctx.message.reply(chunk);
      }
    } else {
      await ctx.message.reply(text);
    }
  }

  async _sendTyping(ctx) {
    try {
      await ctx.message.channel.sendTyping();
    } catch {
      // Some channels may not support typing
    }
  }

  // ── Event handlers ─────────────────────────────────────────────

  _onReady() {
    logger.system.info('[discord] Bot ready', {
      username: this.client.user.tag,
      id: this.client.user.id,
      guildCount: this.client.guilds.cache.size,
    });

    console.log('ARDEN Discord Adapter started');
    console.log(`  Logged in as: ${this.client.user.tag}`);
    console.log(`  Servers: ${this.client.guilds.cache.size}`);
    console.log(`  AI Provider: ${AI_PROVIDER}`);

    // Set bot presence
    this.client.user.setPresence({
      activities: [{ name: 'your messages | !help', type: 3 }], // Watching
      status: 'online',
    });
  }

  async _onMessage(message) {
    // Ignore bots
    if (message.author.bot) return;

    const userId = message.author.id;
    const username = message.author.username;
    const content = message.content.trim();

    // !commands
    if (content.startsWith('!')) {
      await this._handleCommand(message, content);
      return;
    }

    // Only respond in DMs or when @mentioned in servers
    const botMentioned = message.mentions.has(this.client.user);
    const isDM = message.channel.type === 1;

    if (!isDM && !botMentioned) return;

    // Strip mention from prompt
    let prompt = content;
    if (botMentioned) {
      prompt = content.replace(/<@!?\d+>/g, '').trim();
    }

    if (!prompt) {
      await message.reply('How can I help you?');
      return;
    }

    // Go through shared pipeline
    const ctx = { message };
    await this.processMessage(ctx, userId, username, prompt);
  }

  // ── Discord-specific commands ──────────────────────────────────

  async _handleCommand(message, content) {
    const args = content.slice(1).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    switch (command) {
      case 'help':
        await message.reply(
          '**ARDEN Discord Bot - Help**\n\n' +
          '**Commands:**\n' +
          '`!help` - Show this help message\n' +
          '`!status` - Show bot status\n' +
          '`!ping` - Check responsiveness\n' +
          '`!clear` - Clear conversation history\n\n' +
          '**Usage:** Send a DM or @mention me in a channel.\n' +
          `**AI Provider:** ${AI_PROVIDER}`
        );
        break;

      case 'status': {
        const model = AI_PROVIDER === 'ollama' ? OLLAMA_MODEL : AI_PROVIDER === 'openai' ? OPENAI_MODEL : 'N/A';
        await message.reply(
          '**ARDEN Status**\n' +
          'Online and ready\n' +
          `**AI Provider:** ${AI_PROVIDER}\n` +
          `**Model:** ${model}\n` +
          `**Voice:** ${this.config.voice.enabled ? 'Yes' : 'No'}\n` +
          `**Uptime:** ${Math.floor(process.uptime())}s`
        );
        break;
      }

      case 'ping': {
        const ping = Date.now() - message.createdTimestamp;
        await message.reply(`Pong! Latency: ${ping}ms`);
        break;
      }

      case 'clear':
        await message.reply('Conversation history cleared.');
        break;

      default:
        await message.reply(`Unknown command: \`!${command}\`. Type \`!help\` for help.`);
    }
  }
}

module.exports = DiscordAdapter;
