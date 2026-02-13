/**
 * Terminal Adapter
 * 
 * Interactive CLI for ARDEN. Reads from stdin, prints to stdout.
 * Useful for local development, debugging, and scripting.
 * 
 * Usage:
 *   node api/adapters/terminal.js            # interactive REPL
 *   echo "what's the weather?" | node api/adapters/terminal.js  # piped
 */

// Load environment variables FIRST before any other imports
const path = require('path');
const ARDEN_ROOT = path.resolve(__dirname, '../..');
require('dotenv').config({ path: path.join(ARDEN_ROOT, '.env') });

const readline = require('readline');
const BaseAdapter = require('./base');
const logger = require('../utils/logger');

class TerminalAdapter extends BaseAdapter {
  constructor(options = {}) {
    super(options);
    this.rl = null;
    this.userId = process.env.USER || 'terminal';
    this.username = this.userId;
  }

  get name() {
    return 'terminal';
  }

  // ── Lifecycle hooks ────────────────────────────────────────────

  async _initClient() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: process.stdin.isTTY || false,
    });
  }

  async _registerHandlers() {
    // Nothing to register -- we drive the loop in _startClient
  }

  async _startClient() {
    const isTTY = process.stdin.isTTY;

    if (isTTY) {
      console.log('ARDEN Terminal Adapter');
      console.log('Type a message and press Enter. Ctrl+C to quit.\n');
    }

    logger.system.info('[terminal] Adapter started', { interactive: !!isTTY });

    if (isTTY) {
      // Interactive REPL
      this._prompt();
    } else {
      // Piped input -- read all lines then exit
      await this._processPipedInput();
    }
  }

  async _stopClient() {
    if (this.rl) {
      this.rl.close();
    }
  }

  // ── Platform methods ───────────────────────────────────────────

  async _sendResponse(_ctx, text) {
    // Print response to stdout
    console.log(`\n${text}\n`);
  }

  async _sendTyping() {
    // In interactive mode, show a simple indicator
    if (process.stdin.isTTY) {
      process.stdout.write('...\r');
    }
  }

  // ── Internal ───────────────────────────────────────────────────

  _prompt() {
    this.rl.question('you> ', async (input) => {
      const text = (input || '').trim();

      if (!text) {
        this._prompt();
        return;
      }

      // Special commands
      if (text === '/exit' || text === '/quit') {
        console.log('Goodbye.');
        await this.stop();
        process.exit(0);
      }

      if (text === '/help') {
        console.log('\nCommands:');
        console.log('  /help   - Show this help');
        console.log('  /exit   - Quit');
        console.log('  (anything else is sent to ARDEN)\n');
        this._prompt();
        return;
      }

      const ctx = {};
      await this.processMessage(ctx, this.userId, this.username, text);
      this._prompt();
    });

    // Handle Ctrl+D (EOF)
    this.rl.on('close', () => {
      if (process.stdin.isTTY) {
        console.log('\nGoodbye.');
      }
      process.exit(0);
    });
  }

  async _processPipedInput() {
    const lines = [];
    for await (const line of this.rl) {
      lines.push(line);
    }

    const text = lines.join('\n').trim();
    if (text) {
      const ctx = {};
      await this.processMessage(ctx, this.userId, this.username, text);
    }

    process.exit(0);
  }

  // Override: skip config validation in terminal mode (no arden.json required)
  _validateConfig() {
    try {
      super._validateConfig();
    } catch {
      logger.system.warn('[terminal] Config validation skipped (arden.json may be missing)');
    }
  }

  // Override: no auth for terminal (you're already logged in locally)
  isAuthorized() {
    return true;
  }
}

module.exports = TerminalAdapter;

// Allow running directly: node api/adapters/terminal.js
if (require.main === module) {
  process.chdir(ARDEN_ROOT);

  const adapter = new TerminalAdapter();
  adapter.start().catch((err) => {
    console.error('Failed to start Terminal adapter:', err);
    process.exit(1);
  });
}
