/**
 * Skill Executor Service
 * Executes ARDEN skills by detecting patterns and running the appropriate scripts
 */

const { exec } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');

const ARDEN_ROOT = path.resolve(__dirname, '../..');

/**
 * Detect if message is requesting weather information
 */
function detectWeatherRequest(message) {
  const weatherPatterns = [
    /weather\s+in\s+(.+)/i,
    /weather\s+for\s+(.+)/i,
    /what'?s\s+the\s+weather\s+in\s+(.+)/i,
    /what'?s\s+the\s+weather\s+for\s+(.+)/i,
    /how'?s\s+the\s+weather\s+in\s+(.+)/i,
    /temperature\s+in\s+(.+)/i,
    /current\s+conditions?\s+(?:for|in)\s+(.+)/i,
    /conditions?\s+(?:for|in)\s+(.+)/i,
    /forecast\s+(?:for|in)\s+(.+)/i,
  ];

  for (const pattern of weatherPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Detect if message is requesting note-taking
 * Returns: { content: string, type: string } or null
 */
function detectNoteRequest(message) {
  const notePatterns = [
    /(?:take\s+a?\s*note|create\s+a?\s*note|make\s+a?\s*note|save\s+this|write\s+this\s+down|remember\s+this)[:\s]+(.+)/i,
    /(?:save\s+this\s+as\s+a?\s*note)[:\s]+(.+)/i,
    /(?:note\s+to\s+self)[:\s]+(.+)/i,
    /(?:quick\s+note)[:\s]+(.+)/i,
    /(?:meeting\s+note)[:\s]+(.+)/i,
    /(?:idea)[:\s]+(.+)/i,
  ];

  for (const pattern of notePatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      let type = 'quick';
      
      // Detect note type from message
      if (/meeting\s+note/i.test(message)) {
        type = 'meeting';
      } else if (/idea/i.test(message)) {
        type = 'idea';
      } else if (/todo/i.test(message)) {
        type = 'todo';
      }
      
      return {
        content: match[1].trim(),
        type: type
      };
    }
  }

  return null;
}

/**
 * Detect if message is requesting TODO addition
 * Returns: { content: string, category: string } or null
 */
function detectTodoRequest(message) {
  const todoPatterns = [
    /(?:add\s+a?\s*todo|add\s+to\s+(?:my\s+)?todo\s+list|remind\s+me\s+to|i\s+need\s+to|don'?t\s+forget\s+to|make\s+a\s+todo)[:\s]+(.+)/i,
    /(?:add\s+a?\s*(?:work|personal|side\s*project)\s+todo)[:\s]+(.+)/i,
    /(?:todo)[:\s]+(.+)/i,
  ];

  for (const pattern of todoPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      let category = 'personal'; // default
      const content = match[1].trim();
      
      // Detect category from explicit mention
      if (/work\s+todo/i.test(message)) {
        category = 'work';
      } else if (/personal\s+todo/i.test(message)) {
        category = 'personal';
      } else if (/side\s*project\s+todo/i.test(message)) {
        category = 'side-projects';
      } else {
        // Auto-detect from content keywords
        const workKeywords = /\b(deploy|review|pr|pull\s+request|meeting|client|presentation|report|team|code|bug|feature|production|staging)\b/i;
        const sideProjectKeywords = /\b(arden|learn|tutorial|experiment|side\s*project|hobby)\b/i;
        
        if (workKeywords.test(content)) {
          category = 'work';
        } else if (sideProjectKeywords.test(content)) {
          category = 'side-projects';
        }
      }
      
      return {
        content: content,
        category: category
      };
    }
  }

  return null;
}

/**
 * Detect if message is requesting daily planning
 */
function detectDailyPlanningRequest(message) {
  const planningPatterns = [
    /(?:morning\s+briefing|daily\s+briefing)/i,
    /(?:plan\s+my\s+day|what'?s\s+my\s+day\s+look\s+like)/i,
    /(?:what'?s\s+on\s+my\s+agenda|what\s+are\s+my\s+priorities)/i,
    /(?:what\s+should\s+i\s+(?:do|focus\s+on)\s+today)/i,
    /(?:give\s+me\s+my\s+(?:morning|daily)\s+(?:briefing|summary))/i,
  ];

  for (const pattern of planningPatterns) {
    if (pattern.test(message)) {
      return true;
    }
  }

  return false;
}

/**
 * Detect if message is requesting user context
 */
function detectUserContextRequest(message) {
  const contextPatterns = [
    /(?:who\s+am\s+i|tell\s+me\s+about\s+(?:me|myself))/i,
    /(?:my\s+(?:profile|context|information))/i,
    /(?:show\s+(?:me\s+)?my\s+(?:profile|context))/i,
    /(?:user\s+context)/i,
  ];

  for (const pattern of contextPatterns) {
    if (pattern.test(message)) {
      return true;
    }
  }

  return false;
}

/**
 * Detect if message is requesting Clawdbot partnership interaction
 * Returns: { action: string, platform: string, content: string, metadata: object } or null
 */
function detectClawdbotRequest(message) {
  const clawdbotPatterns = [
    // Messaging platform requests
    /(?:send|message|whatsapp|telegram|discord|slack)\s+(.+?)(?:\s+via\s+clawdbot)?$/i,
    /(?:clawdbot)\s+(?:send|message)\s+(.+)$/i,
    
    // Automation requests
    /(?:clawdbot)\s+(?:email|calendar|schedule|reminder|smart\s*home)\s+(.+)$/i,
    /(?:ask|tell)\s+clawdbot\s+to\s+(.+)$/i,
    
    // Delegation requests
    /(?:delegate|forward)\s+(.+?)\s+to\s+clawdbot$/i,
    /(?:clawdbot)\s+(?:handle|manage|process)\s+(.+)$/i,
    
    // Platform-specific patterns
    /whatsapp\s+(.+?)(?:\s+(?:to|for)\s+(.+?))?$/i,
    /telegram\s+(.+?)(?:\s+(?:to|for)\s+(.+?))?$/i,
    /discord\s+(.+?)(?:\s+(?:to|for)\s+(.+?))?$/i,
    /slack\s+(.+?)(?:\s+(?:to|for)\s+(.+?))?$/i,
    
    // Collaboration patterns
    /(?:work\s+with|collaborate\s+with)\s+clawdbot\s+on\s+(.+)$/i,
    /clawdbot\s+(?:help|assist|collaborate)\s+(?:with|on)\s+(.+)$/i,
  ];

  for (const pattern of clawdbotPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const content = match[1].trim();
      const target = match[2] ? match[2].trim() : null;
      
      let action = 'message';
      let platform = 'auto';
      let metadata = {};
      
      // Determine action and platform
      if (/send|message|whatsapp/i.test(message)) {
        action = 'message';
        platform = 'whatsapp';
      } else if (/telegram/i.test(message)) {
        action = 'message';
        platform = 'telegram';
      } else if (/discord/i.test(message)) {
        action = 'message';
        platform = 'discord';
      } else if (/slack/i.test(message)) {
        action = 'message';
        platform = 'slack';
      } else if (/email|calendar|schedule|reminder/i.test(message)) {
        action = 'automation';
        platform = 'automation';
      } else if (/smart\s*home/i.test(message)) {
        action = 'automation';
        platform = 'smart_home';
      } else if (/delegate|forward|handle|manage/i.test(message)) {
        action = 'delegate';
        platform = 'general';
      } else if (/work\s+with|collaborate|help|assist/i.test(message)) {
        action = 'collaborate';
        platform = 'general';
      }
      
      // Extract additional metadata
      if (target) {
        metadata.target = target;
      }
      
      // Auto-detect urgency/priority
      if (/urgent|asap|immediately/i.test(message)) {
        metadata.priority = 'urgent';
      } else if (/when\s+you\s+can|later|soon/i.test(message)) {
        metadata.priority = 'normal';
      }
      
      // Auto-detect message type
      if (/meeting|schedule|appointment/i.test(content)) {
        metadata.type = 'scheduling';
      } else if (/(?:remind|don't\s+forget|remember)/i.test(content)) {
        metadata.type = 'reminder';
      } else if (/email|mail/i.test(content)) {
        metadata.type = 'communication';
      } else if (/check|status|verify/i.test(content)) {
        metadata.type = 'monitoring';
      }
      
      return {
        action: action,
        platform: platform,
        content: content,
        metadata: metadata
      };
    }
  }

  return null;
}

/**
 * Execute weather skill
 */
function executeWeatherSkill(location) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(ARDEN_ROOT, 'skills/weather/tools/get-weather.sh');
    const command = `bash "${scriptPath}" "${location}"`;

    logger.system.info('Executing weather skill', { location, command });

    exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
      if (error) {
        logger.system.error('Weather skill execution failed', { 
          error: error.message, 
          stderr 
        });
        reject(new Error(`Failed to get weather: ${error.message}`));
        return;
      }

      logger.system.info('Weather skill executed successfully', { location });
      resolve(stdout.trim());
    });
  });
}

/**
 * Execute note-taking skill
 */
function executeNoteSkill(content, type) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(ARDEN_ROOT, 'skills/note-taking/tools/create-note.sh');
    const command = `bash "${scriptPath}" "${content}" "${type}" -c`;

    logger.system.info('Executing note-taking skill', { content, type, command });

    exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
      if (error) {
        logger.system.error('Note-taking skill execution failed', { 
          error: error.message, 
          stderr 
        });
        reject(new Error(`Failed to create note: ${error.message}`));
        return;
      }

      logger.system.info('Note-taking skill executed successfully', { content });
      resolve(stdout.trim());
    });
  });
}

/**
 * Execute TODO management skill
 */
function executeTodoSkill(content, category) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(ARDEN_ROOT, 'skills/todo-management/tools/add-todo.sh');
    const command = `bash "${scriptPath}" "${content}" "${category}"`;

    logger.system.info('Executing TODO management skill', { content, category, command });

    exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
      if (error) {
        logger.system.error('TODO management skill execution failed', { 
          error: error.message, 
          stderr 
        });
        reject(new Error(`Failed to add TODO: ${error.message}`));
        return;
      }

      logger.system.info('TODO management skill executed successfully', { content, category });
      resolve(stdout.trim());
    });
  });
}

/**
 * Execute daily planning skill
 */
function executeDailyPlanningSkill() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(ARDEN_ROOT, 'skills/daily-planning/tools/generate-briefing.sh');
    const command = `bash "${scriptPath}"`;

    logger.system.info('Executing daily planning skill', { command });

    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        logger.system.error('Daily planning skill execution failed', { 
          error: error.message, 
          stderr 
        });
        reject(new Error(`Failed to generate daily briefing: ${error.message}`));
        return;
      }

      logger.system.info('Daily planning skill executed successfully');
      resolve(stdout.trim());
    });
  });
}

/**
 * Execute user context skill
 */
function executeUserContextSkill() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(ARDEN_ROOT, 'skills/user-context/tools/user_context.sh');
    const command = `bash "${scriptPath}" text`;

    logger.system.info('Executing user context skill', { command });

    exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
      if (error) {
        logger.system.error('User context skill execution failed', { 
          error: error.message, 
          stderr 
        });
        reject(new Error(`Failed to get user context: ${error.message}`));
        return;
      }

      logger.system.info('User context skill executed successfully');
      resolve(stdout.trim());
    });
  });
}

/**
 * Execute Clawdbot partnership skill
 */
function executeClawdbotSkill(action, platform, content, metadata = {}) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(ARDEN_ROOT, 'skills/clawdbot-partner/execute-clawdbot.sh');
    const metadataJson = JSON.stringify(metadata);
    const command = `bash "${scriptPath}" "${action}" "${platform}" "${content}" '${metadataJson}'`;

    logger.system.info('Executing Clawdbot partnership skill', { action, platform, content, metadata, command });

    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        logger.system.error('Clawdbot partnership skill execution failed', { 
          error: error.message, 
          stderr 
        });
        reject(new Error(`Failed to execute Clawdbot task: ${error.message}`));
        return;
      }

      logger.system.info('Clawdbot partnership skill executed successfully', { action, platform, content });
      resolve(stdout.trim());
    });
  });
}

/**
 * Process message and execute skills if detected
 * Returns skill output if executed, null otherwise
 */
async function executeSkillIfDetected(message) {
  logger.system.info('Checking message for skill patterns', { message });
  
  // Check for note-taking request (check first as it's most specific)
  const noteRequest = detectNoteRequest(message);
  if (noteRequest) {
    logger.system.info('Note-taking skill detected', { content: noteRequest.content, type: noteRequest.type });
    try {
      const noteOutput = await executeNoteSkill(noteRequest.content, noteRequest.type);
      logger.system.info('Note-taking skill executed successfully', { outputLength: noteOutput.length });
      return noteOutput;
    } catch (error) {
      logger.system.error('Skill execution error', { error: error.message });
      return `Error creating note: ${error.message}`;
    }
  }

  // Check for TODO request
  const todoRequest = detectTodoRequest(message);
  if (todoRequest) {
    logger.system.info('TODO management skill detected', { content: todoRequest.content, category: todoRequest.category });
    try {
      const todoOutput = await executeTodoSkill(todoRequest.content, todoRequest.category);
      logger.system.info('TODO management skill executed successfully', { outputLength: todoOutput.length });
      return todoOutput;
    } catch (error) {
      logger.system.error('Skill execution error', { error: error.message });
      return `Error adding TODO: ${error.message}`;
    }
  }

  // Check for weather request
  const weatherLocation = detectWeatherRequest(message);
  if (weatherLocation) {
    logger.system.info('Weather skill detected', { location: weatherLocation });
    try {
      const weatherOutput = await executeWeatherSkill(weatherLocation);
      logger.system.info('Weather skill executed successfully', { location: weatherLocation, outputLength: weatherOutput.length });
      return weatherOutput;
    } catch (error) {
      logger.system.error('Skill execution error', { error: error.message });
      return `Error getting weather: ${error.message}`;
    }
  }

  // Check for daily planning request
  if (detectDailyPlanningRequest(message)) {
    logger.system.info('Daily planning skill detected');
    try {
      const planningOutput = await executeDailyPlanningSkill();
      logger.system.info('Daily planning skill executed successfully');
      return planningOutput;
    } catch (error) {
      logger.system.error('Skill execution error', { error: error.message });
      return `Error running daily planning: ${error.message}`;
    }
  }

  // Check for user context request
  if (detectUserContextRequest(message)) {
    logger.system.info('User context skill detected');
    try {
      const contextOutput = await executeUserContextSkill();
      logger.system.info('User context skill executed successfully');
      return contextOutput;
    } catch (error) {
      logger.system.error('Skill execution error', { error: error.message });
      return `Error getting user context: ${error.message}`;
    }
  }

  // Check for Clawdbot request
  const clawdbotRequest = detectClawdbotRequest(message);
  if (clawdbotRequest) {
    logger.system.info('Clawdbot partnership skill detected', { 
      action: clawdbotRequest.action,
      platform: clawdbotRequest.platform,
      content: clawdbotRequest.content,
      metadata: clawdbotRequest.metadata
    });
    try {
      const clawdbotOutput = await executeClawdbotSkill(
        clawdbotRequest.action, 
        clawdbotRequest.platform, 
        clawdbotRequest.content, 
        clawdbotRequest.metadata
      );
      logger.system.info('Clawdbot partnership skill executed successfully', { outputLength: clawdbotOutput.length });
      return clawdbotOutput;
    } catch (error) {
      logger.system.error('Skill execution error', { error: error.message });
      return `Error executing Clawdbot task: ${error.message}`;
    }
  }

  logger.system.info('No skill detected for message');
  return null;
}

module.exports = {
  executeSkillIfDetected,
  detectWeatherRequest,
  detectNoteRequest,
  detectTodoRequest,
  detectDailyPlanningRequest,
  detectUserContextRequest,
  detectClawdbotRequest,
  executeWeatherSkill,
  executeNoteSkill,
  executeTodoSkill,
  executeDailyPlanningSkill,
  executeUserContextSkill,
  executeClawdbotSkill
};
