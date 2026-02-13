/**
 * Slack Adapter
 * 
 * Connects ARDEN to Slack via @slack/bolt in Socket Mode.
 * Socket Mode means no public URL needed -- the bot connects
 * to Slack over a WebSocket.
 * 
 * Required env:
 *   SLACK_BOT_TOKEN    - xoxb-... Bot User OAuth Token
 *   SLACK_APP_TOKEN    - xapp-... App-Level Token (with connections:write scope)
 *   SLACK_SIGNING_SECRET - (optional, not needed for Socket Mode)
 * 
 * Setup:
 *   1. Create a Slack App at https://api.slack.com/apps
 *   2. Enable Socket Mode under Settings > Socket Mode
 *   3. Generate an App-Level Token with connections:write scope
 *   4. Under OAuth & Permissions add scopes:
 *      chat:write, app_mentions:read, im:history, im:read, im:write
 *   5. Install the app to your workspace
 *   6. npm install @slack/bolt   (in api/ directory)
 *   7. Set SLACK_BOT_TOKEN and SLACK_APP_TOKEN env vars
 *   8. Run: node api/adapters/slack.js   (or via PM2)
 */

const BaseAdapter = require('./base');
const logger = require('../utils/logger');

class SlackAdapter extends BaseAdapter {
  constructor(options = {}) {
    super(options);
    this.app = null; // Bolt App instance

    this.botToken = process.env.SLACK_BOT_TOKEN;
    this.appToken = process.env.SLACK_APP_TOKEN;

    if (!this.botToken) {
      logger.system.error('[slack] SLACK_BOT_TOKEN not set');
      process.exit(1);
    }
    if (!this.appToken) {
      logger.system.error('[slack] SLACK_APP_TOKEN not set (required for Socket Mode)');
      process.exit(1);
    }
  }

  get name() {
    return 'slack';
  }

  // ── Lifecycle hooks ────────────────────────────────────────────

  async _initClient() {
    // Lazy-require so the rest of ARDEN doesn't blow up if @slack/bolt
    // isn't installed (it's an optional peer dependency).
    let App;
    try {
      ({ App } = require('@slack/bolt'));
    } catch {
      logger.system.error('[slack] @slack/bolt not installed. Run: npm install @slack/bolt');
      process.exit(1);
    }

    this.app = new App({
      token: this.botToken,
      appToken: this.appToken,
      socketMode: true,
      // Logging goes through ARDEN's logger
      logLevel: 'warn',
    });
  }

  async _registerHandlers() {
    // Direct messages (message.im event)
    this.app.message(async ({ message, say }) => {
      await this._onMessage(message, say);
    });

    // @mentions in channels
    this.app.event('app_mention', async ({ event, say }) => {
      // Strip the bot mention from the text
      const text = (event.text || '').replace(/<@[A-Z0-9]+>/g, '').trim();
      await this._onMention(event, text, say);
    });

    // Slash command (optional -- register /arden in Slack App config)
    this.app.command('/arden', async ({ command, ack, respond }) => {
      await ack();
      await this._onSlashCommand(command, respond);
    });
  }

  async _startClient() {
    await this.app.start();
    logger.system.info('[slack] Adapter started (Socket Mode)');
    console.log('ARDEN Slack Adapter started (Socket Mode)');
  }

  async _stopClient() {
    if (this.app) {
      await this.app.stop();
    }
  }

  // ── Platform methods ───────────────────────────────────────────

  async _sendResponse(ctx, text) {
    await ctx.say(text);
  }

  async _sendTyping(/* ctx */) {
    // Slack doesn't have a reliable "typing" indicator API for bots.
    // No-op.
  }

  // ── Event handlers ─────────────────────────────────────────────

  async _onMessage(message, say) {
    // Ignore bot messages, message edits, etc.
    if (message.subtype) return;

    const userId = message.user;
    const text = (message.text || '').trim();
    if (!text) return;

    const ctx = { say };
    await this.processMessage(ctx, userId, userId, text, {
      sessionId: `slack-${userId}`,
      channelId: message.channel,
      threadTs: message.thread_ts || message.ts,
    });
  }

  async _onMention(event, text, say) {
    if (!text) {
      await say('How can I help you?');
      return;
    }

    const userId = event.user;
    const ctx = { say };
    await this.processMessage(ctx, userId, userId, text, {
      sessionId: `slack-${userId}`,
      channelId: event.channel,
      threadTs: event.thread_ts || event.ts,
    });
  }

  async _onSlashCommand(command, respond) {
    const text = (command.text || '').trim();
    if (!text) {
      await respond('Usage: `/arden <your message>`');
      return;
    }

    const userId = command.user_id;
    const ctx = {
      say: async (msg) => respond(msg),
    };
    await this.processMessage(ctx, userId, userId, text, {
      sessionId: `slack-${userId}`,
      channelId: command.channel_id,
    });
  }
}

module.exports = SlackAdapter;

// Allow running directly: node api/adapters/slack.js
if (require.main === module) {
  const path = require('path');
  const ARDEN_ROOT = path.resolve(__dirname, '../..');
  process.chdir(ARDEN_ROOT);
  require('dotenv').config({ path: path.join(ARDEN_ROOT, '.env') });

  const adapter = new SlackAdapter();
  adapter.start().catch((err) => {
    console.error('Failed to start Slack adapter:', err);
    process.exit(1);
  });
}
