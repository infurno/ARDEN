/**
 * Memory Management Service
 * 
 * Manages ARDEN's persistent memory through the OpenClaw identity system:
 *   MEMORY.md  - Decisions, lessons, long-term context
 *   USER.md    - User profile updates
 *   daily/     - Daily session logs
 * 
 * Also maintains backward compatibility with legacy openai-context.md.
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

const ARDEN_ROOT = path.resolve(__dirname, '../..');
const NOTES_DIR = path.join(process.env.HOME, 'Notes');

// OpenClaw identity file paths
const MEMORY_FILE_PATH = path.join(ARDEN_ROOT, 'MEMORY.md');
const USER_FILE_PATH = path.join(ARDEN_ROOT, 'USER.md');
const DAILY_DIR = path.join(ARDEN_ROOT, 'daily');

// Legacy path (kept for backward compatibility)
const LEGACY_MEMORY_FILE = 'openai-context.md';
const LEGACY_MEMORY_PATH = path.join(NOTES_DIR, LEGACY_MEMORY_FILE);

// ========================================
// OpenClaw Identity Memory System
// ========================================

/**
 * Read MEMORY.md
 */
async function loadMemoryFile() {
  try {
    const content = await fs.readFile(MEMORY_FILE_PATH, 'utf-8');
    logger.system.info('MEMORY.md loaded', { size: content.length });
    return content;
  } catch (error) {
    logger.system.warn('Failed to load MEMORY.md', { error: error.message });
    return null;
  }
}

/**
 * Read USER.md
 */
async function loadUserFile() {
  try {
    const content = await fs.readFile(USER_FILE_PATH, 'utf-8');
    logger.system.info('USER.md loaded', { size: content.length });
    return content;
  } catch (error) {
    logger.system.warn('Failed to load USER.md', { error: error.message });
    return null;
  }
}

/**
 * Add a decision to MEMORY.md
 * @param {string} decision - What was decided
 * @param {string} context - Why it was decided
 */
async function addDecision(decision, context) {
  try {
    const content = await loadMemoryFile();
    if (!content) return false;
    
    const date = new Date().toISOString().split('T')[0];
    const entry = `- [${date}] Decision: ${decision} | Context: ${context}`;
    
    // Insert after the Decisions header and existing entries
    const updated = insertIntoSection(content, '## Decisions', entry);
    
    await writeMemoryFile(updated);
    logger.system.info('Decision added to MEMORY.md', { decision });
    return true;
  } catch (error) {
    logger.system.error('Failed to add decision', { error: error.message });
    return false;
  }
}

/**
 * Add a lesson to MEMORY.md
 * @param {string} lesson - What was learned
 * @param {string} source - Where it was learned
 */
async function addLesson(lesson, source) {
  try {
    const content = await loadMemoryFile();
    if (!content) return false;
    
    const date = new Date().toISOString().split('T')[0];
    const entry = `- [${date}] Lesson: ${lesson} | Source: ${source}`;
    
    const updated = insertIntoSection(content, '## Lessons', entry);
    
    await writeMemoryFile(updated);
    logger.system.info('Lesson added to MEMORY.md', { lesson });
    return true;
  } catch (error) {
    logger.system.error('Failed to add lesson', { error: error.message });
    return false;
  }
}

/**
 * Add a conversation highlight to MEMORY.md
 */
async function addConversationHighlight(summary) {
  try {
    const content = await loadMemoryFile();
    if (!content) return false;
    
    const date = new Date().toISOString().split('T')[0];
    const entry = `- [${date}] ${summary}`;
    
    const updated = insertIntoSection(content, '## Conversation Highlights', entry);
    
    await writeMemoryFile(updated);
    logger.system.info('Conversation highlight added to MEMORY.md');
    return true;
  } catch (error) {
    logger.system.error('Failed to add conversation highlight', { error: error.message });
    return false;
  }
}

/**
 * Add important context to MEMORY.md
 */
async function addImportantContext(contextText) {
  try {
    const content = await loadMemoryFile();
    if (!content) return false;
    
    const updated = insertIntoSection(content, '## Important Context', contextText);
    
    await writeMemoryFile(updated);
    logger.system.info('Important context added to MEMORY.md');
    return true;
  } catch (error) {
    logger.system.error('Failed to add important context', { error: error.message });
    return false;
  }
}

/**
 * Update a field in USER.md
 * @param {string} field - Field name (e.g., "Location", "Company")
 * @param {string} value - New value
 */
async function updateUserField(field, value) {
  try {
    const content = await loadUserFile();
    if (!content) return false;
    
    // Try to find and update existing field
    const fieldRegex = new RegExp(`(- \\*\\*${field}\\*\\*:).*`, 'i');
    let updated;
    
    if (fieldRegex.test(content)) {
      // Update existing field
      updated = content.replace(fieldRegex, `$1 ${value}`);
    } else {
      // Add to Personal Information section (or first section found)
      updated = insertIntoSection(content, '## Personal Information', `- **${field}**: ${value}`);
    }
    
    // Update timestamp
    updated = updateTimestamp(updated);
    
    await fs.writeFile(USER_FILE_PATH, updated, 'utf-8');
    logger.system.info('USER.md updated', { field, value });
    return true;
  } catch (error) {
    logger.system.error('Failed to update USER.md', { field, error: error.message });
    return false;
  }
}

// ========================================
// Daily Session Logs
// ========================================

/**
 * Get or create today's daily log file
 */
async function getDailyLogPath() {
  const today = new Date().toISOString().split('T')[0];
  return path.join(DAILY_DIR, `${today}.md`);
}

/**
 * Ensure daily log exists for today
 */
async function ensureDailyLog() {
  const logPath = await getDailyLogPath();
  
  try {
    await fs.access(logPath);
    return logPath;
  } catch {
    // Create new daily log
    const today = new Date().toISOString().split('T')[0];
    const template = `# Daily Log - ${today}

## Sessions

## Decisions Made

## Learnings

## TODOs Created

## Skills Used

## Heartbeat

---
*Auto-generated daily log. Indexed by hybrid search.*
`;
    
    await fs.mkdir(DAILY_DIR, { recursive: true });
    await fs.writeFile(logPath, template, 'utf-8');
    logger.system.info('Created daily log', { path: logPath });
    return logPath;
  }
}

/**
 * Append to today's daily log
 * @param {string} section - Section name (e.g., "Sessions", "Decisions Made")
 * @param {string} entry - Content to append
 */
async function appendToDailyLog(section, entry) {
  try {
    const logPath = await ensureDailyLog();
    const content = await fs.readFile(logPath, 'utf-8');
    
    const updated = insertIntoSection(content, `## ${section}`, entry);
    
    await fs.writeFile(logPath, updated, 'utf-8');
    logger.system.info('Daily log updated', { section, path: logPath });
    return true;
  } catch (error) {
    logger.system.error('Failed to append to daily log', { section, error: error.message });
    return false;
  }
}

/**
 * Log a session summary to today's daily log
 */
async function logSession(sessionInfo) {
  const { agent = 'assistant', summary = '', adapter = 'unknown' } = sessionInfo;
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  const entry = `### Session - ${time} (${adapter})
- **Agent**: ${agent}
- **Summary**: ${summary}
`;
  
  return appendToDailyLog('Sessions', entry);
}

/**
 * Log a heartbeat result
 */
async function logHeartbeat(result) {
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const entry = `- ${time}: ${result}`;
  return appendToDailyLog('Heartbeat', entry);
}

// ========================================
// Legacy System (backward compatibility)
// ========================================

/**
 * Initialize legacy memory file if it doesn't exist
 */
async function initializeMemoryFile() {
  try {
    await fs.access(LEGACY_MEMORY_PATH);
    logger.system.info('Legacy memory file exists', { path: LEGACY_MEMORY_PATH });
  } catch {
    logger.system.info('Legacy memory file not found, skipping initialization');
  }
}

/**
 * Load memory - tries OpenClaw MEMORY.md first, falls back to legacy
 */
async function loadMemory() {
  // Try OpenClaw MEMORY.md first
  const memoryContent = await loadMemoryFile();
  if (memoryContent) {
    return memoryContent;
  }
  
  // Fallback to legacy openai-context.md
  try {
    const content = await fs.readFile(LEGACY_MEMORY_PATH, 'utf-8');
    logger.system.info('Loaded legacy memory', { path: LEGACY_MEMORY_PATH, size: content.length });
    return content;
  } catch (error) {
    logger.system.warn('No memory files found', { error: error.message });
    return null;
  }
}

/**
 * Update memory - writes to both OpenClaw and legacy systems
 * @param {string} section - Section to update
 * @param {string} content - New content
 * @param {boolean} append - Append or replace
 */
async function updateMemory(section, content, append = true) {
  try {
    // Write to OpenClaw MEMORY.md
    const memoryContent = await loadMemoryFile();
    if (memoryContent) {
      let updated;
      if (append) {
        updated = insertIntoSection(memoryContent, `## ${section}`, content.trim());
      } else {
        updated = replaceSection(memoryContent, `## ${section}`, content.trim());
      }
      await writeMemoryFile(updated);
    }
    
    // Also write to legacy file if it exists
    try {
      await fs.access(LEGACY_MEMORY_PATH);
      const legacyContent = await fs.readFile(LEGACY_MEMORY_PATH, 'utf-8');
      const sectionRegex = new RegExp(`(## ${section}[\\s\\S]*?)(?=\\n## |$)`, 'i');
      const match = legacyContent.match(sectionRegex);
      
      if (match) {
        const currentSection = match[1];
        let newSection;
        if (append) {
          newSection = currentSection.trimEnd() + '\n' + content.trim() + '\n';
        } else {
          const headerMatch = currentSection.match(/^## .+\n/);
          const header = headerMatch ? headerMatch[0] : `## ${section}\n`;
          newSection = header + '\n' + content.trim() + '\n';
        }
        const updatedLegacy = legacyContent.replace(currentSection, newSection)
          .replace(/\*Last updated: .+\*/, `*Last updated: ${new Date().toISOString().split('T')[0]}*`);
        await fs.writeFile(LEGACY_MEMORY_PATH, updatedLegacy, 'utf-8');
      }
    } catch {
      // Legacy file doesn't exist, skip
    }
    
    logger.system.info('Memory updated', { section, append });
    return true;
  } catch (error) {
    logger.system.error('Failed to update memory', { section, error: error.message });
    return false;
  }
}

/**
 * Add a learning entry (legacy API compatibility)
 */
async function addLearning(topic, information) {
  const date = new Date().toISOString().split('T')[0];
  const entry = `- **${date}** - ${topic}: ${information}`;
  
  // Write to legacy
  await updateMemory('Conversations & Learnings', entry, true);
  
  // Also write to OpenClaw MEMORY.md Lessons section
  await addLesson(`${topic}: ${information}`, 'conversation');
  
  return true;
}

/**
 * Add an important fact (legacy API compatibility)
 */
async function addFact(fact) {
  const entry = `- ${fact}`;
  return await updateMemory('Important Facts', entry, true);
}

/**
 * Update user profile (legacy API compatibility)
 */
async function updateUserProfile(field, value) {
  // Update OpenClaw USER.md
  await updateUserField(field, value);
  
  // Also update legacy file
  try {
    const currentMemory = await fs.readFile(LEGACY_MEMORY_PATH, 'utf-8');
    const profileRegex = /(## User Profile[\s\S]*?)(?=\n## |$)/i;
    const match = currentMemory.match(profileRegex);
    
    if (match) {
      let profileSection = match[1];
      const fieldRegex = new RegExp(`(- \\*\\*${field}\\*\\*:).*`, 'i');
      if (fieldRegex.test(profileSection)) {
        profileSection = profileSection.replace(fieldRegex, `$1 ${value}`);
      } else {
        profileSection += `- **${field}**: ${value}\n`;
      }
      
      const updatedMemory = currentMemory.replace(match[1], profileSection)
        .replace(/\*Last updated: .+\*/, `*Last updated: ${new Date().toISOString().split('T')[0]}*`);
      await fs.writeFile(LEGACY_MEMORY_PATH, updatedMemory, 'utf-8');
    }
  } catch {
    // Legacy file doesn't exist, skip
  }
  
  logger.system.info('User profile updated', { field, value });
  return true;
}

/**
 * Analyze conversation and extract potential learnings
 */
async function analyzeConversation(messages) {
  try {
    const learningPatterns = [
      /^(I am|I'm|My name is|I work as|I'm working on)/i,
      /^(I like|I prefer|I hate|I love|I use|I'm using)/i,
      /^(My (project|goal|task|job|role|company|team))/i,
      /^(We are|We're|Our (team|company|project))/i
    ];
    
    const potentialLearnings = [];
    
    for (const msg of messages) {
      if (msg.role === 'user') {
        for (const pattern of learningPatterns) {
          if (pattern.test(msg.message)) {
            potentialLearnings.push(msg.message);
            break;
          }
        }
      }
    }
    
    logger.system.info('Analyzed conversation for learnings', { 
      totalMessages: messages.length,
      potentialLearnings: potentialLearnings.length 
    });
    
    return potentialLearnings;
  } catch (error) {
    logger.system.error('Failed to analyze conversation', { error: error.message });
    return [];
  }
}

/**
 * Get memory summary for display
 */
async function getMemorySummary() {
  try {
    // Try OpenClaw MEMORY.md first
    let content = null;
    let memPath = MEMORY_FILE_PATH;
    
    try {
      content = await fs.readFile(MEMORY_FILE_PATH, 'utf-8');
    } catch {
      // Fallback to legacy
      try {
        content = await fs.readFile(LEGACY_MEMORY_PATH, 'utf-8');
        memPath = LEGACY_MEMORY_PATH;
      } catch {
        return null;
      }
    }
    
    const stats = await fs.stat(memPath);
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const lineCount = content.split('\n').length;
    
    const decisionsMatch = content.match(/## Decisions[\s\S]*?(?=\n## |$)/);
    const decisionsCount = decisionsMatch 
      ? (decisionsMatch[0].match(/^- \[/gm) || []).length 
      : 0;
    
    const lessonsMatch = content.match(/## Lessons[\s\S]*?(?=\n## |$)/);
    const lessonsCount = lessonsMatch 
      ? (lessonsMatch[0].match(/^- \[/gm) || []).length 
      : 0;
    
    // Count identity files
    const identityStatus = {};
    for (const [name, filepath] of Object.entries({
      soul: path.join(ARDEN_ROOT, 'SOUL.md'),
      user: path.join(ARDEN_ROOT, 'USER.md'),
      memory: MEMORY_FILE_PATH,
      agents: path.join(ARDEN_ROOT, 'AGENTS.md'),
      heartbeat: path.join(ARDEN_ROOT, 'HEARTBEAT.md'),
    })) {
      try {
        await fs.access(filepath);
        identityStatus[name] = true;
      } catch {
        identityStatus[name] = false;
      }
    }
    
    return {
      exists: true,
      path: memPath,
      system: memPath === MEMORY_FILE_PATH ? 'openclaw' : 'legacy',
      size: stats.size,
      modified: stats.mtime,
      wordCount,
      lineCount,
      decisionsCount,
      lessonsCount,
      identityFiles: identityStatus
    };
  } catch (error) {
    logger.system.error('Failed to get memory summary', { error: error.message });
    return null;
  }
}

/**
 * Clear all memory (dangerous - requires confirmation)
 */
async function clearMemory() {
  try {
    // Backup MEMORY.md
    const backup = await loadMemoryFile();
    if (backup) {
      const backupPath = path.join(ARDEN_ROOT, `MEMORY.backup.${Date.now()}.md`);
      await fs.writeFile(backupPath, backup, 'utf-8');
      logger.system.warn('Memory backed up', { backupPath });
    }
    
    // Also backup legacy
    try {
      const legacyBackup = await fs.readFile(LEGACY_MEMORY_PATH, 'utf-8');
      const legacyBackupPath = path.join(NOTES_DIR, `openai-context.backup.${Date.now()}.md`);
      await fs.writeFile(legacyBackupPath, legacyBackup, 'utf-8');
    } catch {
      // No legacy file to backup
    }
    
    logger.system.warn('Memory cleared');
    return { success: true };
  } catch (error) {
    logger.system.error('Failed to clear memory', { error: error.message });
    return { success: false, error: error.message };
  }
}

// ========================================
// Utility Functions
// ========================================

/**
 * Insert content after a section header (appends to end of section)
 */
function insertIntoSection(fileContent, sectionHeader, newEntry) {
  const sectionRegex = new RegExp(`(${escapeRegex(sectionHeader)}[\\s\\S]*?)(?=\\n## |\\n---\\n|$)`);
  const match = fileContent.match(sectionRegex);
  
  if (match) {
    const section = match[1];
    const updatedSection = section.trimEnd() + '\n' + newEntry.trim() + '\n';
    return updateTimestamp(fileContent.replace(section, updatedSection));
  }
  
  // Section not found, append before footer
  const footerRegex = /\n---\n\*/;
  if (footerRegex.test(fileContent)) {
    return updateTimestamp(fileContent.replace(footerRegex, `\n${sectionHeader}\n\n${newEntry.trim()}\n\n---\n*`));
  }
  
  // No footer, just append
  return updateTimestamp(fileContent + `\n${sectionHeader}\n\n${newEntry.trim()}\n`);
}

/**
 * Replace section content entirely
 */
function replaceSection(fileContent, sectionHeader, newContent) {
  const sectionRegex = new RegExp(`(${escapeRegex(sectionHeader)})([\\s\\S]*?)(?=\\n## |\\n---\\n|$)`);
  const replacement = `${sectionHeader}\n\n${newContent.trim()}\n`;
  return updateTimestamp(fileContent.replace(sectionRegex, replacement));
}

/**
 * Update the "Last updated" timestamp in a file
 */
function updateTimestamp(content) {
  const today = new Date().toISOString().split('T')[0];
  return content.replace(
    /\*Last updated: .+\*/,
    `*Last updated: ${today}*`
  );
}

/**
 * Escape special regex characters
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Write MEMORY.md with timestamp update
 */
async function writeMemoryFile(content) {
  const updated = updateTimestamp(content);
  await fs.writeFile(MEMORY_FILE_PATH, updated, 'utf-8');
}

module.exports = {
  // OpenClaw identity system
  loadMemoryFile,
  loadUserFile,
  addDecision,
  addLesson,
  addConversationHighlight,
  addImportantContext,
  updateUserField,
  
  // Daily logs
  ensureDailyLog,
  appendToDailyLog,
  logSession,
  logHeartbeat,
  getDailyLogPath,
  DAILY_DIR,
  
  // Legacy API (backward compatible)
  initializeMemoryFile,
  loadMemory,
  updateMemory,
  addLearning,
  addFact,
  updateUserProfile,
  analyzeConversation,
  getMemorySummary,
  clearMemory,
  
  // Constants
  MEMORY_FILE: LEGACY_MEMORY_FILE,
  MEMORY_PATH: LEGACY_MEMORY_PATH,
  MEMORY_FILE_PATH,
  USER_FILE_PATH,
};
