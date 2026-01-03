/**
 * Voice Message Handler
 * 
 * Handles processing of voice messages:
 * - Download voice file from Telegram
 * - Transcribe using STT service
 * - Process with AI
 * - Generate TTS response if enabled
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const logger = require('../utils/logger');
const { speechToText } = require('../services/stt');
const { textToSpeech } = require('../services/tts');
const { executeArden } = require('../services/ai-providers');
const { logInteraction } = require('../services/session');

// Ensure we're working from the correct directory
const ARDEN_ROOT = path.resolve(__dirname, '../..');

// Load configuration
const config = require(path.join(ARDEN_ROOT, 'config/arden.json'));

// Environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Paths
const VOICE_DIR = path.join(ARDEN_ROOT, 'voice/recordings');

/**
 * Handle voice message
 */
async function handleVoiceMessage(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;

  logger.voice.info('Processing voice message', { userId, username });

  try {
    await bot.sendMessage(chatId, '🎤 Processing voice message...');

    // Download voice file
    const fileId = msg.voice.file_id;
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;

    const voiceFilePath = path.join(VOICE_DIR, `voice_${Date.now()}.ogg`);
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    await fs.writeFile(voiceFilePath, response.data);

    logger.voice.info('Voice file downloaded', { voiceFilePath });

    // Transcribe
    const prompt = await speechToText(voiceFilePath);
    await bot.sendMessage(chatId, `📝 You said: "${prompt}"`);

    logger.voice.info('Voice transcribed', { userId, transcription: prompt });

    // Clean up voice file
    await fs.unlink(voiceFilePath).catch(err => {
      logger.voice.warn('Failed to cleanup voice file', { 
        voiceFilePath, 
        error: err.message 
      });
    });

    // Send typing indicator
    await bot.sendChatAction(chatId, 'typing');

    // Execute ARDEN
    const ardenResponse = await executeArden(prompt);

    // Log interaction
    await logInteraction(userId, username, prompt, ardenResponse);

    // Send text response
    await bot.sendMessage(chatId, ardenResponse, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });

    // Send voice response if enabled and TTS is configured
    if (config.voice.enabled && ELEVENLABS_API_KEY) {
      await bot.sendChatAction(chatId, 'record_voice');
      const voiceResponse = await textToSpeech(ardenResponse);

      if (voiceResponse) {
        await bot.sendVoice(chatId, voiceResponse);
        logger.voice.info('Voice response sent', { voiceResponse });
        
        // Clean up voice response file
        await fs.unlink(voiceResponse).catch(err => {
          logger.voice.warn('Failed to cleanup voice response file', { 
            voiceResponse, 
            error: err.message 
          });
        });
      }
    }

    logger.voice.info('Voice message processing complete', { userId });

  } catch (error) {
    logger.voice.error('Error processing voice message', { 
      userId, 
      error: error.message 
    });
    await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
}

module.exports = {
  handleVoiceMessage,
};
