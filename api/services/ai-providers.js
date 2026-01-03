/**
 * AI Provider Service
 * 
 * Handles interaction with different AI providers:
 * - Claude Code CLI (default)
 * - Ollama (local LLMs)
 * - OpenAI API (GPT models)
 * - LM Studio (local OpenAI-compatible API)
 */

const { exec } = require('child_process');
const path = require('path');
const axios = require('axios');
const logger = require('../utils/logger');

// Ensure we're working from the correct directory
const ARDEN_ROOT = path.resolve(__dirname, '../..');

// AI Provider configuration
const AI_PROVIDER = process.env.AI_PROVIDER || 'claude';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const LMSTUDIO_URL = process.env.LMSTUDIO_URL || 'http://localhost:1234';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// System prompt template for tool-enabled providers
const SYSTEM_PROMPT = `You are ARDEN (AI Routine Daily Engagement Nexus), a helpful AI assistant.

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

/**
 * Execute with Claude Code CLI
 */
async function executeClaude(prompt) {
  logger.ai.info('Executing with Claude Code', { promptLength: prompt.length });

  return new Promise((resolve, reject) => {
    const command = `claude -p "${prompt.replace(/"/g, '\\"')}"`;

    exec(command, {
      cwd: ARDEN_ROOT,
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    }, (error, stdout, stderr) => {
      if (error) {
        logger.ai.error('Claude Code execution error', { 
          error: error.message,
          stderr 
        });
        reject(error);
        return;
      }
      const response = stdout || stderr;
      logger.ai.info('Claude Code execution successful', { 
        responseLength: response.length 
      });
      resolve(response);
    });
  });
}

/**
 * Execute with Ollama
 */
async function executeOllama(prompt) {
  logger.ai.info('Executing with Ollama', { 
    model: OLLAMA_MODEL,
    url: OLLAMA_URL,
    promptLength: prompt.length 
  });

  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      system: SYSTEM_PROMPT
    });
    
    const result = response.data.response;
    logger.ai.info('Ollama execution successful', { 
      responseLength: result.length 
    });
    return result;
  } catch (error) {
    logger.ai.error('Ollama error', { 
      error: error.message,
      url: OLLAMA_URL,
      model: OLLAMA_MODEL
    });
    throw new Error(`Ollama error: ${error.message}. Make sure Ollama is running: ollama serve`);
  }
}

/**
 * Execute with OpenAI API
 */
async function executeOpenAI(prompt) {
  logger.ai.info('Executing with OpenAI', { 
    model: OPENAI_MODEL,
    promptLength: prompt.length 
  });

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
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
    
    const result = response.data.choices[0].message.content;
    logger.ai.info('OpenAI execution successful', { 
      responseLength: result.length,
      tokensUsed: response.data.usage?.total_tokens 
    });
    return result;
  } catch (error) {
    logger.ai.error('OpenAI error', { 
      error: error.message,
      status: error.response?.status
    });
    throw new Error(`OpenAI error: ${error.message}`);
  }
}

/**
 * Execute with LM Studio
 */
async function executeLMStudio(prompt) {
  logger.ai.info('Executing with LM Studio', { 
    url: LMSTUDIO_URL,
    promptLength: prompt.length 
  });

  try {
    const response = await axios.post(
      `${LMSTUDIO_URL}/v1/chat/completions`,
      {
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
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
    
    const result = response.data.choices[0].message.content;
    logger.ai.info('LM Studio execution successful', { 
      responseLength: result.length 
    });
    return result;
  } catch (error) {
    logger.ai.error('LM Studio error', { 
      error: error.message,
      url: LMSTUDIO_URL
    });
    throw new Error(`LM Studio error: ${error.message}. Make sure LM Studio server is running.`);
  }
}

/**
 * Execute ARDEN with the given prompt using configured AI provider
 */
async function executeArden(prompt) {
  logger.ai.info('Executing ARDEN', { 
    provider: AI_PROVIDER,
    promptLength: prompt.length 
  });

  try {
    let response;
    switch (AI_PROVIDER) {
      case 'ollama':
        response = await executeOllama(prompt);
        break;
      case 'openai':
        response = await executeOpenAI(prompt);
        break;
      case 'lmstudio':
        response = await executeLMStudio(prompt);
        break;
      case 'claude':
      default:
        response = await executeClaude(prompt);
        break;
    }
    
    logger.ai.info('ARDEN execution complete', { 
      provider: AI_PROVIDER,
      responseLength: response.length 
    });
    return response;
  } catch (error) {
    logger.ai.error('ARDEN execution failed', { 
      provider: AI_PROVIDER,
      error: error.message 
    });
    throw error;
  }
}

module.exports = {
  executeArden,
  executeClaude,
  executeOllama,
  executeOpenAI,
  executeLMStudio,
  AI_PROVIDER,
  OLLAMA_MODEL,
  OPENAI_MODEL,
};
