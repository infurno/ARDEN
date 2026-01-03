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
const { getContextForPrompt } = require('./context-loader');
const db = require('./database');

// Ensure we're working from the correct directory
const ARDEN_ROOT = path.resolve(__dirname, '../..');

// AI Provider configuration
const AI_PROVIDER = process.env.AI_PROVIDER || 'claude';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const LMSTUDIO_URL = process.env.LMSTUDIO_URL || 'http://localhost:1234';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// System prompt template for tool-enabled providers (base version - will be enhanced with context)
const BASE_SYSTEM_PROMPT = `You are ARDEN (AI Routine Daily Engagement Nexus), a helpful AI assistant.

Available tools you can use:
1. Note-taking: ~/ARDEN/skills/note-taking/tools/create-note.sh "CONTENT" "TYPE"
   - Use when user says: "take a note", "save this", "remember this"
   - Types: quick, meeting, idea, todo
   
2. Weather: ~/ARDEN/skills/weather/tools/get-weather.sh "LOCATION"
   - Use when user asks about weather, temperature, rain, forecast, conditions
   - LOCATION can be: city name, "City, State", zip code (e.g., "72730"), or leave empty for default
   - Examples: "Farmington, AR", "72730", "New York", "London,UK"
   - IMPORTANT: Extract the location from user's message carefully. If they say "Farmington, Arkansas" use "Farmington, AR"
   - If they give just a zip code like "72730", use that directly
   - State abbreviations: Arkansas=AR, Illinois=IL, California=CA, etc.
   
3. Forecast: ~/ARDEN/skills/weather/tools/get-forecast.sh "LOCATION"
   - Use for multi-day forecasts or "weather this weekend"
   - Same location format as Weather tool

4. TODO Summary: ~/ARDEN/scripts/todo-summary.sh
   - Use when user asks about TODOs, tasks, what to do
   - Shows consolidated TODO list statistics and recent items

5. Consolidate TODOs: ~/ARDEN/scripts/consolidate-todos.sh
   - Use when user asks to update, refresh, or consolidate TODOs
   - Scans all notes and rebuilds the consolidated TODO list

When you use a tool, execute it via bash and share the results with the user in a conversational way.
Keep responses concise and friendly, especially for voice interactions.`;

/**
 * Build system prompt with user context
 */
async function buildSystemPrompt() {
  let prompt = BASE_SYSTEM_PROMPT;
  
  try {
    const userContext = await getContextForPrompt();
    if (userContext) {
      prompt += userContext;
    }
  } catch (error) {
    logger.system.warn('Failed to load user context for prompt', { error: error.message });
  }
  
  return prompt;
}

/**
 * Estimate token count (rough approximation: ~4 chars per token)
 */
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Execute with Claude Code CLI
 */
async function executeClaude(prompt, userId = 'unknown', sessionId = null) {
  logger.ai.info('Executing with Claude Code', { promptLength: prompt.length });

  return new Promise((resolve, reject) => {
    const command = `claude -p "${prompt.replace(/"/g, '\\"')}"`;

    exec(command, {
      cwd: ARDEN_ROOT,
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    }, (error, stdout, stderr) => {
      const response = stdout || stderr;
      
      if (error) {
        // Record failed request
        db.recordApiUsage(
          'claude',
          'claude-cli',
          userId,
          sessionId,
          0,
          0,
          'chat',
          false,
          error.message
        );
        
        logger.ai.error('Claude Code execution error', { 
          error: error.message,
          stderr 
        });
        reject(error);
        return;
      }
      
      // Estimate tokens
      const promptTokens = estimateTokens(prompt);
      const completionTokens = estimateTokens(response);
      
      // Record API usage (Claude CLI may have costs depending on setup)
      db.recordApiUsage(
        'claude',
        'claude-cli',
        userId,
        sessionId,
        promptTokens,
        completionTokens,
        'chat',
        true
      );
      
      logger.ai.info('Claude Code execution successful', { 
        responseLength: response.length,
        estimatedTokens: promptTokens + completionTokens
      });
      resolve(response);
    });
  });
}

/**
 * Execute with Ollama
 */
async function executeOllama(prompt, userId = 'unknown', sessionId = null) {
  logger.ai.info('Executing with Ollama', { 
    model: OLLAMA_MODEL,
    url: OLLAMA_URL,
    promptLength: prompt.length 
  });

  try {
    const systemPrompt = await buildSystemPrompt();
    
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      system: systemPrompt
    });
    
    const result = response.data.response;
    
    // Estimate tokens (Ollama doesn't return token counts)
    const promptTokens = estimateTokens(systemPrompt + prompt);
    const completionTokens = estimateTokens(result);
    
    // Record API usage (Ollama is local, so cost is 0)
    db.recordApiUsage(
      'ollama',
      OLLAMA_MODEL,
      userId,
      sessionId,
      promptTokens,
      completionTokens,
      'chat',
      true
    );
    
    logger.ai.info('Ollama execution successful', { 
      responseLength: result.length,
      estimatedTokens: promptTokens + completionTokens
    });
    return result;
  } catch (error) {
    // Record failed request
    db.recordApiUsage(
      'ollama',
      OLLAMA_MODEL,
      userId,
      sessionId,
      0,
      0,
      'chat',
      false,
      error.message
    );
    
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
async function executeOpenAI(prompt, userId = 'unknown', sessionId = null) {
  logger.ai.info('Executing with OpenAI', { 
    model: OPENAI_MODEL,
    promptLength: prompt.length 
  });

  try {
    const systemPrompt = await buildSystemPrompt();
    
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
    
    const result = response.data.choices[0].message.content;
    const usage = response.data.usage;
    
    // Record API usage
    if (usage) {
      db.recordApiUsage(
        'openai',
        OPENAI_MODEL,
        userId,
        sessionId,
        usage.prompt_tokens || 0,
        usage.completion_tokens || 0,
        'chat',
        true
      );
    }
    
    logger.ai.info('OpenAI execution successful', { 
      responseLength: result.length,
      tokensUsed: usage?.total_tokens 
    });
    return result;
  } catch (error) {
    // Record failed request
    db.recordApiUsage(
      'openai',
      OPENAI_MODEL,
      userId,
      sessionId,
      0,
      0,
      'chat',
      false,
      error.message
    );
    
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
async function executeLMStudio(prompt, userId = 'unknown', sessionId = null) {
  logger.ai.info('Executing with LM Studio', { 
    url: LMSTUDIO_URL,
    promptLength: prompt.length 
  });

  try {
    const systemPrompt = await buildSystemPrompt();
    
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
    
    const result = response.data.choices[0].message.content;
    const usage = response.data.usage;
    
    // Use actual token counts if available, otherwise estimate
    const promptTokens = usage?.prompt_tokens || estimateTokens(systemPrompt + prompt);
    const completionTokens = usage?.completion_tokens || estimateTokens(result);
    
    // Record API usage (LM Studio is local, so cost is 0)
    db.recordApiUsage(
      'lmstudio',
      'lmstudio-local',
      userId,
      sessionId,
      promptTokens,
      completionTokens,
      'chat',
      true
    );
    
    logger.ai.info('LM Studio execution successful', { 
      responseLength: result.length,
      tokensUsed: promptTokens + completionTokens
    });
    return result;
  } catch (error) {
    // Record failed request
    db.recordApiUsage(
      'lmstudio',
      'lmstudio-local',
      userId,
      sessionId,
      0,
      0,
      'chat',
      false,
      error.message
    );
    
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
async function executeArden(prompt, userId = 'unknown', sessionId = null) {
  logger.ai.info('Executing ARDEN', { 
    provider: AI_PROVIDER,
    promptLength: prompt.length 
  });

  try {
    let response;
    switch (AI_PROVIDER) {
      case 'ollama':
        response = await executeOllama(prompt, userId, sessionId);
        break;
      case 'openai':
        response = await executeOpenAI(prompt, userId, sessionId);
        break;
      case 'lmstudio':
        response = await executeLMStudio(prompt, userId, sessionId);
        break;
      case 'claude':
      default:
        response = await executeClaude(prompt, userId, sessionId);
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
