/**
 * Adapter Registry
 * 
 * Central index for all ARDEN adapters.
 * Import from here rather than individual files.
 */

const BaseAdapter = require('./base');
const TelegramAdapter = require('./telegram');
const DiscordAdapter = require('./discord');
const WebAdapter = require('./web');

// Lazy-loaded adapters (require optional dependencies)
let SlackAdapter = null;
let TerminalAdapter = null;

function getSlackAdapter() {
  if (!SlackAdapter) {
    SlackAdapter = require('./slack');
  }
  return SlackAdapter;
}

function getTerminalAdapter() {
  if (!TerminalAdapter) {
    TerminalAdapter = require('./terminal');
  }
  return TerminalAdapter;
}

/**
 * Factory: create an adapter by name.
 * @param {string} name - 'telegram' | 'discord' | 'web' | 'slack' | 'terminal'
 * @param {Object} [options]
 * @returns {BaseAdapter}
 */
function createAdapter(name, options = {}) {
  switch (name) {
    case 'telegram': return new TelegramAdapter(options);
    case 'discord':  return new DiscordAdapter(options);
    case 'web':      return new WebAdapter(options);
    case 'slack':    return new (getSlackAdapter())(options);
    case 'terminal': return new (getTerminalAdapter())(options);
    default:
      throw new Error(`Unknown adapter: ${name}`);
  }
}

module.exports = {
  BaseAdapter,
  TelegramAdapter,
  DiscordAdapter,
  WebAdapter,
  createAdapter,
};
