/**
 * Session Logging Service
 * 
 * Handles logging of user interactions to history files.
 * Creates daily session logs organized by date and user.
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

// Ensure we're working from the correct directory
const ARDEN_ROOT = path.resolve(__dirname, '../..');

/**
 * Log interaction to history
 */
async function logInteraction(userId, username, prompt, response) {
  const timestamp = new Date().toISOString();
  const date = timestamp.split('T')[0];
  const sessionDir = path.join(ARDEN_ROOT, 'history/sessions', date);

  try {
    await fs.mkdir(sessionDir, { recursive: true });

    const logEntry = {
      timestamp,
      user_id: userId,
      username,
      prompt,
      response,
    };

    const logFile = path.join(sessionDir, `telegram_${userId}.jsonl`);
    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');

    logger.user.info('Interaction logged', { 
      userId, 
      username, 
      date,
      promptLength: prompt.length,
      responseLength: response.length 
    });
  } catch (error) {
    logger.user.error('Failed to log interaction', { 
      userId, 
      username, 
      error: error.message 
    });
    // Don't throw - logging failures shouldn't break the bot
  }
}

module.exports = {
  logInteraction,
};
