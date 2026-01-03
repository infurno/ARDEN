#!/usr/bin/env node

/**
 * ARDEN Telegram Voice Bot
 *
 * Enables voice interaction with ARDEN from any device via Telegram.
 * Supports both voice messages and text messages.
 *
 * Setup:
 * 1. Create a bot with @BotFather on Telegram
 * 2. Set TELEGRAM_BOT_TOKEN environment variable
 * 3. Set OPENAI_API_KEY for Whisper STT
 * 4. Set ELEVENLABS_API_KEY for TTS (optional)
 * 5. Run: node telegram-bot.js
 */

const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Ensure we're working from the correct directory
// This allows the script to be run from anywhere
const ARDEN_ROOT = path.resolve(__dirname, '..');
process.chdir(ARDEN_ROOT);

// Load environment variables from .env file
require('dotenv').config({ path: path.join(ARDEN_ROOT, '.env') });

// Load configuration
const config = require(path.join(ARDEN_ROOT, 'config/arden.json'));

// Environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// AI Provider configuration
const AI_PROVIDER = process.env.AI_PROVIDER || 'claude'; // claude, ollama, openai, lmstudio
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const LMSTUDIO_URL = process.env.LMSTUDIO_URL || 'http://localhost:1234';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Validate required environment variables
if (!TELEGRAM_BOT_TOKEN) {
  console.error('Error: TELEGRAM_BOT_TOKEN environment variable not set');
  process.exit(1);
}

// OPENAI_API_KEY only required for OpenAI Whisper STT or OpenAI AI provider
const sttProvider = config.voice.stt_provider || 'local-whisper';
if (sttProvider === 'openai-whisper' && !OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY required for OpenAI Whisper');
  process.exit(1);
}

if (AI_PROVIDER === 'openai' && !OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY required when AI_PROVIDER=openai');
  process.exit(1);
}

// Initialize bot
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;  // Max 10 requests per minute per user
const rateLimitMap = new Map(); // userId -> { count, resetTime }

/**
 * Check if user has exceeded rate limit
 */
function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  // If no record or window expired, create new record
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  // Check if limit exceeded
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    const waitTime = Math.ceil((userLimit.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      waitTime
    };
  }

  // Increment counter
  userLimit.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - userLimit.count
  };
}

// Paths - now using ARDEN_ROOT for absolute paths
const VOICE_DIR = path.join(ARDEN_ROOT, 'voice/recordings');
const RESPONSE_DIR = path.join(ARDEN_ROOT, 'voice/responses');

// Ensure directories exist
async function initDirectories() {
  await fs.mkdir(VOICE_DIR, { recursive: true });
  await fs.mkdir(RESPONSE_DIR, { recursive: true });
}

/**
 * Convert voice message to text using Local Whisper
 */
async function speechToTextLocal(filePath) {
  const whisperPath = path.join(ARDEN_ROOT, 'venv/bin/whisper');
  const model = config.voice.stt_config.model || 'base';
  const language = config.voice.stt_config.language || 'en';

  return new Promise((resolve, reject) => {
    const command = `"${whisperPath}" "${filePath}" --model ${model} --language ${language} --output_format txt --output_dir /tmp`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Local Whisper error:', error.message);
        reject(new Error(`Local Whisper failed: ${error.message}`));
        return;
      }

      // Whisper saves output as filename.txt
      const baseName = path.basename(filePath, path.extname(filePath));
      const outputFile = `/tmp/${baseName}.txt`;

      fs.readFile(outputFile)
        .then(content => {
          // Clean up temp file
          fs.unlink(outputFile).catch(err => {
            console.warn('Failed to cleanup temp file:', outputFile, err.message);
          });
          resolve(content.toString().trim());
        })
        .catch(err => {
          console.error('Error reading Whisper output:', err.message);
          reject(new Error(`Failed to read Whisper output: ${err.message}`));
        });
    });
  });
}

/**
 * Convert voice message to text using OpenAI Whisper API
 */
async function speechToTextOpenAI(filePath) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const formData = new FormData();
  formData.append('file', await fs.readFile(filePath), {
    filename: path.basename(filePath),
    contentType: 'audio/ogg',
  });
  formData.append('model', 'whisper-1');
  formData.append('language', config.voice.stt_config.language || 'en');

  const response = await axios.post(
    'https://api.openai.com/v1/audio/transcriptions',
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );

  return response.data.text;
}

/**
 * Convert voice message to text with automatic fallback
 * Tries local Whisper first, falls back to OpenAI API if local fails
 */
async function speechToText(filePath) {
  const provider = config.voice.stt_provider || 'local-whisper';
  
  try {
    // Try primary provider first
    if (provider === 'openai-whisper') {
      console.log('Using OpenAI Whisper API');
      return await speechToTextOpenAI(filePath);
    } else {
      console.log('Using local Whisper');
      return await speechToTextLocal(filePath);
    }
  } catch (error) {
    console.error(`Primary STT provider (${provider}) failed:`, error.message);
    
    // Try fallback if available
    if (provider === 'local-whisper' && OPENAI_API_KEY) {
      console.log('Falling back to OpenAI Whisper API...');
      try {
        const result = await speechToTextOpenAI(filePath);
        console.log('✓ Fallback successful');
        return result;
      } catch (fallbackError) {
        console.error('Fallback to OpenAI also failed:', fallbackError.message);
        throw new Error('All speech-to-text providers failed. Please check your configuration.');
      }
    } else if (provider === 'openai-whisper') {
      // No fallback for OpenAI provider (local Whisper might not be installed)
      throw new Error(`OpenAI Whisper failed and no fallback available: ${error.message}`);
    } else {
      throw new Error(`Speech-to-text failed: ${error.message}. Consider setting OPENAI_API_KEY for fallback.`);
    }
  }
}

/**
 * Convert text to speech using configured provider
 */
async function textToSpeech(text) {
  const provider = config.voice.tts_provider;

  try {
    console.log(`Using TTS provider: ${provider}`);
    switch (provider) {
      case 'elevenlabs':
        return await ttsElevenLabs(text);
      case 'edge-tts':
        return await ttsEdge(text);
      case 'piper':
        return await ttsPiper(text);
      case 'openai-tts':
        return await ttsOpenAI(text);
      default:
        console.log(`TTS provider '${provider}' not configured, skipping voice response`);
        return null;
    }
  } catch (error) {
    console.error(`Text-to-speech error with ${provider}:`, error.message);
    console.log('Continuing without voice response...');
    return null;
  }
}

/**
 * ElevenLabs TTS
 */
async function ttsElevenLabs(text) {
  if (!ELEVENLABS_API_KEY) {
    console.log('ElevenLabs API key not set, skipping TTS');
    return null;
  }

  const voiceId = config.voice.tts_config.voice_id;
  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      text,
      model_id: config.voice.tts_config.model,
      voice_settings: {
        stability: config.voice.tts_config.stability,
        similarity_boost: config.voice.tts_config.similarity_boost,
      },
    },
    {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
    }
  );

  const outputPath = path.join(RESPONSE_DIR, `response_${Date.now()}.mp3`);
  await fs.writeFile(outputPath, response.data);
  return outputPath;
}

/**
 * Edge TTS (Microsoft - FREE)
 */
async function ttsEdge(text) {
  const voice = config.voice.tts_config.voice || 'en-US-AriaNeural';
  const outputPath = path.join(RESPONSE_DIR, `response_${Date.now()}.mp3`);
  const edgeTtsPath = path.join(ARDEN_ROOT, 'venv/bin/edge-tts');

  return new Promise((resolve, reject) => {
    const command = `"${edgeTtsPath}" --voice "${voice}" --text "${text.replace(/"/g, '\\"')}" --write-media "${outputPath}"`;

    exec(command, (error) => {
      if (error) {
        reject(new Error('Edge TTS failed. Make sure it is installed in venv.'));
        return;
      }
      resolve(outputPath);
    });
  });
}

/**
 * Piper TTS (Self-hosted - FREE)
 */
async function ttsPiper(text) {
  const model = config.voice.tts_config.model || 'en_US-amy-medium';
  const modelPath = path.join(
    process.env.HOME,
    `.local/share/piper/models/${model}.onnx`
  );
  const outputPath = path.join(RESPONSE_DIR, `response_${Date.now()}.wav`);

  return new Promise((resolve, reject) => {
    const command = `echo "${text.replace(/"/g, '\\"')}" | piper --model "${modelPath}" --output_file "${outputPath}"`;

    exec(command, (error) => {
      if (error) {
        reject(new Error('Piper TTS failed. Install with: brew install piper-tts'));
        return;
      }
      resolve(outputPath);
    });
  });
}

/**
 * OpenAI TTS (Affordable - ~$1/month)
 */
async function ttsOpenAI(text) {
  if (!OPENAI_API_KEY) {
    console.log('OpenAI API key not set');
    return null;
  }

  const voice = config.voice.tts_config.voice || 'nova';
  const model = config.voice.tts_config.model || 'tts-1';

  const response = await axios.post(
    'https://api.openai.com/v1/audio/speech',
    {
      model,
      input: text,
      voice,
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
    }
  );

  const outputPath = path.join(RESPONSE_DIR, `response_${Date.now()}.mp3`);
  await fs.writeFile(outputPath, response.data);
  return outputPath;
}

/**
 * Execute ARDEN with the given prompt using configured AI provider
 */
async function executeArden(prompt) {
  switch (AI_PROVIDER) {
    case 'ollama':
      return await executeOllama(prompt);
    case 'openai':
      return await executeOpenAI(prompt);
    case 'lmstudio':
      return await executeLMStudio(prompt);
    case 'claude':
    default:
      return await executeClaude(prompt);
  }
}

/**
 * Execute with Claude Code CLI
 */
async function executeClaude(prompt) {
  return new Promise((resolve, reject) => {
    const command = `claude -p "${prompt.replace(/"/g, '\\"')}"`;

    exec(command, {
      cwd: ARDEN_ROOT,
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout || stderr);
    });
  });
}

/**
 * Execute with Ollama
 */
async function executeOllama(prompt) {
  try {
    const systemPrompt = `You are ARDEN (AI Routine Daily Engagement Nexus), a helpful AI assistant.

Available tools you can use:
1. Note-taking: ~/ARDEN/skills/note-taking/tools/create-note.sh "CONTENT" "TYPE"
   - Use when user says: "take a note", "save this", "remember this"
   - Types: quick, meeting, idea, todo
   
2. Weather: ~/ARDEN/skills/weather/tools/get-weather.sh "LOCATION"
   - Use when user asks about weather, temperature, rain, forecast
   - Default location: Chicago (can be any city or zip)
   
3. Forecast: ~/ARDEN/skills/weather/tools/get-forecast.sh "LOCATION"
   - Use for multi-day forecasts or "weather this weekend"

When you use a tool, execute it via bash and share the results with the user in a conversational way.
Keep responses concise and friendly, especially for voice interactions.`;

    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      system: systemPrompt
    });
    
    return response.data.response;
  } catch (error) {
    throw new Error(`Ollama error: ${error.message}. Make sure Ollama is running: ollama serve`);
  }
}

/**
 * Execute with OpenAI API
 */
async function executeOpenAI(prompt) {
  try {
    const systemPrompt = `You are ARDEN (AI Routine Daily Engagement Nexus), a helpful AI assistant.

Available tools you can use:
1. Note-taking: ~/ARDEN/skills/note-taking/tools/create-note.sh "CONTENT" "TYPE"
   - Use when user says: "take a note", "save this", "remember this"
   - Types: quick, meeting, idea, todo
   
2. Weather: ~/ARDEN/skills/weather/tools/get-weather.sh "LOCATION"
   - Use when user asks about weather, temperature, rain, forecast
   - Default location: Chicago (can be any city or zip)
   
3. Forecast: ~/ARDEN/skills/weather/tools/get-forecast.sh "LOCATION"
   - Use for multi-day forecasts or "weather this weekend"

When you use a tool, execute it via bash and share the results with the user in a conversational way.
Keep responses concise and friendly, especially for voice interactions.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    throw new Error(`OpenAI error: ${error.message}`);
  }
}

/**
 * Execute with LM Studio
 */
async function executeLMStudio(prompt) {
  try {
    const systemPrompt = `You are ARDEN (AI Routine Daily Engagement Nexus), a helpful AI assistant.

Available tools you can use:
1. Note-taking: ~/ARDEN/skills/note-taking/tools/create-note.sh "CONTENT" "TYPE"
   - Use when user says: "take a note", "save this", "remember this"
   - Types: quick, meeting, idea, todo
   
2. Weather: ~/ARDEN/skills/weather/tools/get-weather.sh "LOCATION"
   - Use when user asks about weather, temperature, rain, forecast
   - Default location: Chicago (can be any city or zip)
   
3. Forecast: ~/ARDEN/skills/weather/tools/get-forecast.sh "LOCATION"
   - Use for multi-day forecasts or "weather this weekend"

When you use a tool, execute it via bash and share the results with the user in a conversational way.
Keep responses concise and friendly, especially for voice interactions.`;

    const response = await axios.post(
      `${LMSTUDIO_URL}/v1/chat/completions`,
      {
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    throw new Error(`LM Studio error: ${error.message}. Make sure LM Studio server is running.`);
  }
}

/**
 * Log interaction to history
 */
async function logInteraction(userId, username, prompt, response) {
  const timestamp = new Date().toISOString();
  const date = timestamp.split('T')[0];
  const sessionDir = path.join(ARDEN_ROOT, 'history/sessions', date);

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
}

// Bot event handlers
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;

  console.log(`Message from ${username} (${userId}):`, msg.text || '[voice message]');

  // Check if user is allowed (if restriction is enabled)
  if (config.telegram.allowed_users.length > 0 &&
      !config.telegram.allowed_users.includes(userId)) {
    await bot.sendMessage(chatId, '❌ Unauthorized. Contact the administrator.');
    return;
  }

  // Rate limiting check
  const rateCheck = checkRateLimit(userId);
  if (!rateCheck.allowed) {
    await bot.sendMessage(
      chatId,
      `⏱️ Rate limit exceeded. Please wait ${rateCheck.waitTime} seconds before sending another message.\n\n` +
      `Limit: ${RATE_LIMIT_MAX_REQUESTS} requests per minute.`
    );
    console.log(`Rate limit exceeded for user ${userId}`);
    return;
  }

  // Log remaining requests for user awareness (only on first few requests)
  if (rateCheck.remaining <= 3) {
    console.log(`User ${userId} has ${rateCheck.remaining} requests remaining`);
  }

  try {
    let prompt;

    // Handle voice messages
    if (msg.voice) {
      await bot.sendMessage(chatId, '🎤 Processing voice message...');

      // Download voice file
      const fileId = msg.voice.file_id;
      const file = await bot.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;

      const voiceFilePath = path.join(VOICE_DIR, `voice_${Date.now()}.ogg`);
      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      await fs.writeFile(voiceFilePath, response.data);

      // Transcribe
      prompt = await speechToText(voiceFilePath);
      await bot.sendMessage(chatId, `📝 You said: "${prompt}"`);

      // Clean up voice file
      await fs.unlink(voiceFilePath).catch(err => {
        console.warn('Failed to cleanup voice file:', err.message);
      });
    }
    // Handle text messages
    else if (msg.text) {
      // Ignore bot commands for now
      if (msg.text.startsWith('/')) {
        return handleCommand(msg);
      }
      prompt = msg.text;
    } else {
      return;
    }

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
        // Clean up voice response file
        await fs.unlink(voiceResponse).catch(() => {});
      }
    }

  } catch (error) {
    console.error('Error processing message:', error);
    await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
});

/**
 * Handle bot commands
 */
async function handleCommand(msg) {
  const chatId = msg.chat.id;
  const command = msg.text.split(' ')[0];

  switch (command) {
    case '/start':
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
      break;

    case '/help':
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
      break;

    case '/status':
      const status = {
        voice_enabled: config.voice.enabled,
        stt_provider: config.voice.stt_provider,
        tts_provider: config.voice.tts_provider,
        tts_available: !!ELEVENLABS_API_KEY,
      };
      
      const userRateLimit = rateLimitMap.get(msg.from.id);
      const rateLimitInfo = userRateLimit 
        ? `${userRateLimit.count}/${RATE_LIMIT_MAX_REQUESTS} (resets in ${Math.ceil((userRateLimit.resetTime - Date.now()) / 1000)}s)`
        : `0/${RATE_LIMIT_MAX_REQUESTS}`;
      
      await bot.sendMessage(chatId,
        '📊 System Status\n\n' +
        `Voice: ${status.voice_enabled ? '✅' : '❌'}\n` +
        `STT: ${status.stt_provider}\n` +
        `TTS: ${status.tts_provider} ${status.tts_available ? '✅' : '❌'}\n` +
        `AI Provider: ${AI_PROVIDER}\n` +
        `Rate Limit: ${rateLimitInfo}\n`
      );
      break;

    case '/skills':
      await bot.sendMessage(chatId,
        '🎯 Available Skills\n\n' +
        '• Daily Planning\n' +
        '• Research & Analysis\n' +
        '• Content Creation\n' +
        '• Task Management\n' +
        '• Information Retrieval\n\n' +
        'Skills are loaded automatically based on your request.'
      );
      break;

    default:
      await bot.sendMessage(chatId, '❓ Unknown command. Use /help for assistance.');
  }
}

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Initialize and start
(async () => {
  await initDirectories();
  console.log('🤖 ARDEN Telegram Bot started');
  console.log(`📁 Working directory: ${ARDEN_ROOT}`);
  console.log('📱 Send voice or text messages to interact');
  console.log(`AI Provider: ${AI_PROVIDER}`);
  if (AI_PROVIDER === 'ollama') console.log(`Ollama model: ${OLLAMA_MODEL}`);
  if (AI_PROVIDER === 'openai') console.log(`OpenAI model: ${OPENAI_MODEL}`);
  console.log(`Voice enabled: ${config.voice.enabled}`);
  console.log(`STT: ${config.voice.stt_provider}`);
  console.log(`TTS: ${config.voice.tts_provider}`);
})();
