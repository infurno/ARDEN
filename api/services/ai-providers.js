/**
 * AI Provider Service
 * 
 * Handles interaction with different AI providers:
 * - Claude Code CLI (default)
 * - Anthropic API (Claude models via API)
 * - Google Gemini API (Gemini models)
 * - Groq API (Fast, free Llama/Mixtral models)
 * - Ollama (local LLMs)
 * - OpenAI API (GPT models)
 * - LM Studio (local OpenAI-compatible API)
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const { getContextForPrompt } = require('./context-loader');
const memoryManager = require('./memory-manager');
const db = require('./database');

const execAsync = promisify(exec);

// Ensure we're working from the correct directory
const ARDEN_ROOT = path.resolve(__dirname, '../..');

// AI Provider configuration
const AI_PROVIDER = process.env.AI_PROVIDER || 'claude';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const LMSTUDIO_URL = process.env.LMSTUDIO_URL || 'http://localhost:1234';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// System prompt template for tool-enabled providers (base version - will be enhanced with context)
const BASE_SYSTEM_PROMPT = `You are ARDEN (AI Routine Daily Engagement Nexus), a helpful AI assistant with access to tools and persistent memory.

CRITICAL INSTRUCTION: When a user requests an action that matches a tool below, you MUST output the bash command in a code block. The system will automatically execute it.

To execute a command, output it like this:
\`\`\`bash
bash ~/ARDEN/skills/todo-management/tools/add-todo.sh "example task" "work"
\`\`\`

The command will be executed automatically and the output will be shown to the user.

MEMORY MANAGEMENT:
You have access to a persistent memory file (openai-context.md) that is automatically loaded into every conversation.
This file contains important information about the user, their projects, preferences, and past learnings.

When you learn something important about the user, you can update your memory using special commands:
- REMEMBER[User Profile|Name]: John Doe - Updates user profile
- REMEMBER[Learning|Project Update]: User is working on ARDEN Discord bot - Adds to learnings
- REMEMBER[Fact]: User prefers OpenAI gpt-4o-mini - Adds an important fact

When you output a REMEMBER command, the system will automatically update your memory file.
Only use REMEMBER for truly important information worth persisting across all future conversations.

Available tools:

1. Add TODO - Use when user says ANY of these phrases:
   - "add a todo", "add todo", "create todo", "new todo"
   - "I need to", "remind me to", "don't forget to"
   - "add a task", "create a task"
   - ANY phrase containing: "work todo", "personal todo", "side project todo"
   
   How to determine category:
   - "work" = meetings, deployments, code reviews, reports, clients, team, professional tasks
   - "personal" = groceries, errands, family, doctor, gym, home tasks, shopping
   - "side-projects" = ARDEN, learning, tutorials, experiments, coding projects
   - Default = "personal" if unclear
   
   Command format:
   \`\`\`bash
   bash ~/ARDEN/skills/todo-management/tools/add-todo.sh "TODO_TEXT" "CATEGORY"
   \`\`\`
   
   Examples:
   - User: "I need to add a work todo to check Azure bugs"
     You output:
     \`\`\`bash
     bash ~/ARDEN/skills/todo-management/tools/add-todo.sh "check Azure bugs" "work"
     \`\`\`
     Then say: "Adding to work list..."
   
   - User: "Remind me to buy milk"
     You output:
     \`\`\`bash
     bash ~/ARDEN/skills/todo-management/tools/add-todo.sh "buy milk" "personal"
     \`\`\`
     Then say: "Adding to personal list..."
   
   - User: "Add a TODO to learn Kubernetes"
     You output:
     \`\`\`bash
     bash ~/ARDEN/skills/todo-management/tools/add-todo.sh "learn Kubernetes" "side-projects"
     \`\`\`
     Then say: "Adding to side projects..."

2. Note-taking - Use when user says: "take a note", "save this", "remember this", "create a note"
   Command format:
   \`\`\`bash
   bash ~/ARDEN/skills/note-taking/tools/create-note.sh "CONTENT" "TYPE"
   \`\`\`
   Types: quick, meeting, idea, todo
   
   Example:
   - User: "Take a note: Review ARDEN documentation"
     You output:
     \`\`\`bash
     bash ~/ARDEN/skills/note-taking/tools/create-note.sh "Review ARDEN documentation" "quick"
     \`\`\`
     Then say: "Creating note..."
   
3. Weather - Use when user asks about weather, temperature
   Command format:
   \`\`\`bash
   bash ~/ARDEN/skills/weather/tools/get-weather.sh "LOCATION"
   \`\`\`
   
4. Forecast - Use for multi-day weather
   Command format:
   \`\`\`bash
   bash ~/ARDEN/skills/weather/tools/get-forecast.sh "LOCATION"
   \`\`\`

5. TODO Summary - Use when user asks "show my todos", "what are my tasks"
   Command format:
   \`\`\`bash
   bash ~/ARDEN/scripts/todo-summary.sh
   \`\`\`

6. Consolidate TODOs - Use when user says "consolidate todos", "update todos"
   Command format:
   \`\`\`bash
   bash ~/ARDEN/scripts/consolidate-todos.sh
   \`\`\`

IMPORTANT: 
- Always output bash commands in code blocks with \`\`\`bash
- The system will execute them automatically
- Wait for command output before responding to the user
- Keep your text responses brief and conversational`;


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
  // Use Anthropic API if API key is provided, otherwise fall back to CLI
  if (ANTHROPIC_API_KEY) {
    return executeAnthropicAPI(prompt, userId, sessionId);
  }
  
  logger.ai.info('Executing with Claude Code CLI', { promptLength: prompt.length });

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
 * Execute with Anthropic API
 */
async function executeAnthropicAPI(prompt, userId = 'unknown', sessionId = null) {
  logger.ai.info('Executing with Anthropic API', { 
    model: ANTHROPIC_MODEL,
    promptLength: prompt.length 
  });

  try {
    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });

    const systemPrompt = await buildSystemPrompt();
    
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    
    const result = response.content[0].text;
    
    // Get actual token usage from response
    const promptTokens = response.usage.input_tokens;
    const completionTokens = response.usage.output_tokens;
    
    // Record API usage
    db.recordApiUsage(
      'anthropic',
      ANTHROPIC_MODEL,
      userId,
      sessionId,
      promptTokens,
      completionTokens,
      'chat',
      true
    );
    
    logger.ai.info('Anthropic API execution successful', { 
      responseLength: result.length,
      promptTokens,
      completionTokens
    });
    
    return result;
  } catch (error) {
    // Record failed request
    db.recordApiUsage(
      'anthropic',
      ANTHROPIC_MODEL,
      userId,
      sessionId,
      0,
      0,
      'chat',
      false,
      error.message
    );
    
    logger.ai.error('Anthropic API error', { error: error.message });
    throw error;
  }
}

/**
 * Execute with Google Gemini
 */
async function executeGemini(prompt, userId = 'unknown', sessionId = null) {
  logger.ai.info('Executing with Google Gemini', { 
    model: GEMINI_MODEL,
    promptLength: prompt.length 
  });

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    
    const systemPrompt = await buildSystemPrompt();
    
    // Gemini uses a different format - combine system prompt with user prompt
    const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}`;
    
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();
    
    // Get token usage
    const promptTokens = response.usageMetadata?.promptTokenCount || estimateTokens(fullPrompt);
    const completionTokens = response.usageMetadata?.candidatesTokenCount || estimateTokens(text);
    
    // Record API usage (Gemini is free tier, cost is 0)
    db.recordApiUsage(
      'gemini',
      GEMINI_MODEL,
      userId,
      sessionId,
      promptTokens,
      completionTokens,
      'chat',
      true
    );
    
    logger.ai.info('Gemini execution successful', { 
      responseLength: text.length,
      promptTokens,
      completionTokens
    });
    
    return text;
  } catch (error) {
    // Record failed request
    db.recordApiUsage(
      'gemini',
      GEMINI_MODEL,
      userId,
      sessionId,
      0,
      0,
      'chat',
      false,
      error.message
    );
    
    logger.ai.error('Gemini API error', { error: error.message });
    throw error;
  }
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
 * Execute with Groq API (OpenAI-compatible)
 */
async function executeGroq(prompt, userId = 'unknown', sessionId = null) {
  logger.ai.info('Executing with Groq', { 
    model: GROQ_MODEL,
    promptLength: prompt.length 
  });

  try {
    const systemPrompt = await buildSystemPrompt();
    
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: GROQ_MODEL,
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
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const result = response.data.choices[0].message.content;
    const usage = response.data.usage;
    
    // Record API usage (Groq is free tier, cost is 0)
    if (usage) {
      db.recordApiUsage(
        'groq',
        GROQ_MODEL,
        userId,
        sessionId,
        usage.prompt_tokens || 0,
        usage.completion_tokens || 0,
        'chat',
        true
      );
    }
    
    logger.ai.info('Groq execution successful', { 
      responseLength: result.length,
      tokensUsed: usage?.total_tokens 
    });
    return result;
  } catch (error) {
    // Record failed request
    db.recordApiUsage(
      'groq',
      GROQ_MODEL,
      userId,
      sessionId,
      0,
      0,
      'chat',
      false,
      error.message
    );
    
    logger.ai.error('Groq error', { 
      error: error.message,
      status: error.response?.status
    });
    throw new Error(`Groq error: ${error.message}`);
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
 * Parse and execute REMEMBER commands from LLM response
 * Format: REMEMBER[Section|Field]: Content
 * Examples:
 *   REMEMBER[User Profile|Name]: John Doe
 *   REMEMBER[Learning|ARDEN Setup]: User deployed Discord bot on VPS
 *   REMEMBER[Fact]: User prefers OpenAI gpt-4o-mini
 */
async function processMemoryUpdates(response) {
  const rememberRegex = /REMEMBER\[([^\]]+)\]:\s*(.+)/g;
  let match;
  let updatedResponse = response;
  
  while ((match = rememberRegex.exec(response)) !== null) {
    const [fullMatch, sectionInfo, content] = match;
    const parts = sectionInfo.split('|').map(p => p.trim());
    
    try {
      if (parts.length === 2) {
        // Format: REMEMBER[Section|Field]: Content
        const [section, field] = parts;
        
        if (section.toLowerCase() === 'user profile') {
          // Update user profile
          await memoryManager.updateUserProfile(field, content.trim());
          logger.system.info('Memory updated: User Profile', { field, content });
        } else if (section.toLowerCase() === 'learning') {
          // Add learning
          await memoryManager.addLearning(field, content.trim());
          logger.system.info('Memory updated: Learning', { topic: field, content });
        } else {
          // Update generic section
          await memoryManager.updateMemory(section, `- **${field}**: ${content.trim()}`, true);
          logger.system.info('Memory updated: Custom section', { section, field, content });
        }
      } else if (parts.length === 1) {
        // Format: REMEMBER[Section]: Content
        const section = parts[0];
        
        if (section.toLowerCase() === 'fact') {
          await memoryManager.addFact(content.trim());
          logger.system.info('Memory updated: Fact', { content });
        } else {
          await memoryManager.updateMemory(section, content.trim(), true);
          logger.system.info('Memory updated: Section', { section, content });
        }
      }
      
      // Remove the REMEMBER command from response
      updatedResponse = updatedResponse.replace(fullMatch, '').trim();
      
    } catch (error) {
      logger.system.error('Failed to process memory update', { 
        sectionInfo, 
        content, 
        error: error.message 
      });
    }
  }
  
  // Clean up extra whitespace
  updatedResponse = updatedResponse.replace(/\n{3,}/g, '\n\n').trim();
  
  return updatedResponse;
}

/**
 * Parse and execute bash commands from LLM response
 * Looks for bash code blocks and executes them
 */
async function executeCommandsFromResponse(response) {
  // First, process memory updates
  response = await processMemoryUpdates(response);
  
  // Match bash code blocks: ```bash\ncommand\n``` or just bash command starting with bash ~/
  const bashBlockRegex = /```bash\n([\s\S]*?)\n```/g;
  const inlineCommandRegex = /(?:^|\n)(bash ~\/ARDEN\/[^\n]+)/gm;
  
  let matches = [];
  let match;
  
  // Find bash code blocks
  while ((match = bashBlockRegex.exec(response)) !== null) {
    matches.push(match[1].trim());
  }
  
  // Find inline bash commands
  while ((match = inlineCommandRegex.exec(response)) !== null) {
    matches.push(match[1].trim());
  }
  
  // Deduplicate commands (remove exact duplicates)
  matches = [...new Set(matches)];
  
  if (matches.length === 0) {
    return response; // No commands to execute
  }
  
  logger.system.info('Found bash commands to execute', { count: matches.length, commands: matches });
  
  // Remove bash code blocks and command explanations from response
  let enhancedResponse = response;
  
  // Remove all bash code blocks
  enhancedResponse = enhancedResponse.replace(/```bash\n[\s\S]*?\n```/g, '');
  
  // Remove inline bash commands
  enhancedResponse = enhancedResponse.replace(/(?:^|\n)(bash ~\/ARDEN\/[^\n]+)/gm, '');
  
  // Remove common command introduction phrases
  enhancedResponse = enhancedResponse.replace(/I'll (run|execute|use) (this|the) (command|script|tool).*?[:\.]/gi, '');
  enhancedResponse = enhancedResponse.replace(/Let me (run|execute|use) (this|the|a) (command|script|tool).*?[:\.]/gi, '');
  enhancedResponse = enhancedResponse.replace(/Running (the|this) (command|script|tool).*?[:\.]/gi, '');
  
  // Clean up extra whitespace
  enhancedResponse = enhancedResponse.replace(/\n{3,}/g, '\n\n').trim();
  
  for (const command of matches) {
    try {
      logger.system.info('Executing command', { command });
      
      const { stdout, stderr } = await execAsync(command, {
        cwd: ARDEN_ROOT,
        shell: '/bin/bash',
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024 // 1MB buffer
      });
      
      const output = stdout.trim() || stderr.trim();
      
      if (output) {
        logger.system.info('Command executed successfully', { 
          command, 
          output: output.substring(0, 200) 
        });
        
        // Append only the output (without verbose labels)
        enhancedResponse += `\n\n${output}`;
      } else {
        logger.system.info('Command executed (no output)', { command });
      }
      
    } catch (error) {
      logger.system.error('Command execution failed', { 
        command, 
        error: error.message,
        stderr: error.stderr 
      });
      
      // Append only the error message (without verbose labels)
      enhancedResponse += `\n\nError: ${error.message}`;
    }
  }
  
  return enhancedResponse;
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
      case 'groq':
        response = await executeGroq(prompt, userId, sessionId);
        break;
      case 'lmstudio':
        response = await executeLMStudio(prompt, userId, sessionId);
        break;
      case 'gemini':
        response = await executeGemini(prompt, userId, sessionId);
        break;
      case 'claude':
      default:
        response = await executeClaude(prompt, userId, sessionId);
        break;
    }
    
    // Parse and execute any bash commands in the response
    response = await executeCommandsFromResponse(response);
    
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
  executeGroq,
  executeLMStudio,
  executeGemini,
  AI_PROVIDER,
  OLLAMA_MODEL,
  OPENAI_MODEL,
};
