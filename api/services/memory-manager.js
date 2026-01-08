/**
 * Memory Management Service
 * 
 * Manages ARDEN's persistent memory through the openai-context.md note.
 * This service handles:
 * - Loading memory from openai-context.md
 * - Updating memory when ARDEN learns new information
 * - Analyzing conversations to extract learnings
 * - Maintaining structured memory format
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

const NOTES_DIR = path.join(process.env.HOME, 'Notes');
const MEMORY_FILE = 'openai-context.md';
const MEMORY_PATH = path.join(NOTES_DIR, MEMORY_FILE);

/**
 * Memory structure in the markdown file:
 * 
 * # ARDEN Memory Context
 * 
 * ## User Profile
 * - Name: ...
 * - Role: ...
 * - Preferences: ...
 * 
 * ## Projects & Work
 * - Current projects: ...
 * - Technologies used: ...
 * - Goals: ...
 * 
 * ## Conversations & Learnings
 * - [Date] Topic: Key information learned
 * 
 * ## Important Facts
 * - Fact 1
 * - Fact 2
 * 
 * ## Preferences & Context
 * - Communication style: ...
 * - Technical preferences: ...
 */

/**
 * Initialize memory file if it doesn't exist
 */
async function initializeMemoryFile() {
  try {
    await fs.access(MEMORY_PATH);
    logger.system.info('Memory file exists', { path: MEMORY_PATH });
  } catch {
    logger.system.info('Creating new memory file', { path: MEMORY_PATH });
    
    const initialContent = `# ARDEN Memory Context

> This file serves as ARDEN's persistent memory. Information here is automatically loaded into every conversation.
> ARDEN can update this file when learning important information about you, your projects, or your preferences.

## User Profile

- **Name**: (to be learned)
- **Role**: (to be learned)
- **Location**: (to be learned)
- **Preferences**: (to be learned)

## Projects & Work

### Current Projects
- (to be learned)

### Technologies & Tools
- (to be learned)

### Goals
- (to be learned)

## Conversations & Learnings

<!-- ARDEN will automatically add learnings here -->

## Important Facts

- (to be learned)

## Communication Preferences

- **Style**: (to be learned)
- **Detail Level**: (to be learned)
- **Format Preferences**: (to be learned)

## Technical Preferences

- **Programming Languages**: (to be learned)
- **Development Tools**: (to be learned)
- **AI Provider**: (to be learned)

---
*Last updated: ${new Date().toISOString().split('T')[0]}*
`;

    await fs.writeFile(MEMORY_PATH, initialContent, 'utf-8');
    logger.system.info('Memory file created successfully');
  }
}

/**
 * Load memory from openai-context.md
 */
async function loadMemory() {
  try {
    await initializeMemoryFile();
    
    const content = await fs.readFile(MEMORY_PATH, 'utf-8');
    logger.system.info('Memory loaded', { 
      path: MEMORY_PATH,
      size: content.length 
    });
    
    return content;
  } catch (error) {
    logger.system.error('Failed to load memory', { error: error.message });
    return null;
  }
}

/**
 * Update memory with new information
 * 
 * @param {string} section - Section to update (e.g., 'User Profile', 'Projects & Work', 'Learnings')
 * @param {string} content - New content to add/update
 * @param {boolean} append - Whether to append (true) or replace (false)
 */
async function updateMemory(section, content, append = true) {
  try {
    const currentMemory = await loadMemory();
    if (!currentMemory) {
      logger.system.error('Cannot update memory: failed to load current content');
      return false;
    }
    
    let updatedMemory = currentMemory;
    
    // Find the section
    const sectionRegex = new RegExp(`(## ${section}[\\s\\S]*?)(?=\\n## |$)`, 'i');
    const match = currentMemory.match(sectionRegex);
    
    if (match) {
      const currentSection = match[1];
      let newSection;
      
      if (append) {
        // Append to existing section
        newSection = currentSection.trimEnd() + '\n' + content.trim() + '\n';
      } else {
        // Replace section content (keep header)
        const headerMatch = currentSection.match(/^## .+\n/);
        const header = headerMatch ? headerMatch[0] : `## ${section}\n`;
        newSection = header + '\n' + content.trim() + '\n';
      }
      
      updatedMemory = currentMemory.replace(currentSection, newSection);
    } else {
      // Section doesn't exist, add it before the footer
      const footerRegex = /\n---\n\*Last updated:/;
      if (footerRegex.test(updatedMemory)) {
        updatedMemory = updatedMemory.replace(
          footerRegex,
          `\n## ${section}\n\n${content.trim()}\n\n---\n*Last updated:`
        );
      } else {
        // No footer, just append
        updatedMemory += `\n\n## ${section}\n\n${content.trim()}\n`;
      }
    }
    
    // Update the "Last updated" timestamp
    updatedMemory = updatedMemory.replace(
      /\*Last updated: .+\*/,
      `*Last updated: ${new Date().toISOString().split('T')[0]}*`
    );
    
    // Write back to file
    await fs.writeFile(MEMORY_PATH, updatedMemory, 'utf-8');
    
    logger.system.info('Memory updated successfully', { 
      section,
      append,
      contentLength: content.length 
    });
    
    return true;
  } catch (error) {
    logger.system.error('Failed to update memory', { 
      section,
      error: error.message 
    });
    return false;
  }
}

/**
 * Add a learning entry to the Conversations & Learnings section
 */
async function addLearning(topic, information) {
  const date = new Date().toISOString().split('T')[0];
  const entry = `- **${date}** - ${topic}: ${information}`;
  
  return await updateMemory('Conversations & Learnings', entry, true);
}

/**
 * Add an important fact
 */
async function addFact(fact) {
  const entry = `- ${fact}`;
  return await updateMemory('Important Facts', entry, true);
}

/**
 * Update user profile information
 */
async function updateUserProfile(field, value) {
  try {
    const currentMemory = await loadMemory();
    if (!currentMemory) return false;
    
    // Find User Profile section
    const profileRegex = /(## User Profile[\s\S]*?)(?=\n## |$)/i;
    const match = currentMemory.match(profileRegex);
    
    if (match) {
      let profileSection = match[1];
      
      // Check if field already exists
      const fieldRegex = new RegExp(`(- \\*\\*${field}\\*\\*:).*`, 'i');
      if (fieldRegex.test(profileSection)) {
        // Update existing field
        profileSection = profileSection.replace(
          fieldRegex,
          `$1 ${value}`
        );
      } else {
        // Add new field
        profileSection += `- **${field}**: ${value}\n`;
      }
      
      const updatedMemory = currentMemory.replace(match[1], profileSection);
      
      // Update timestamp
      const finalMemory = updatedMemory.replace(
        /\*Last updated: .+\*/,
        `*Last updated: ${new Date().toISOString().split('T')[0]}*`
      );
      
      await fs.writeFile(MEMORY_PATH, finalMemory, 'utf-8');
      
      logger.system.info('User profile updated', { field, value });
      return true;
    }
    
    return false;
  } catch (error) {
    logger.system.error('Failed to update user profile', { 
      field,
      error: error.message 
    });
    return false;
  }
}

/**
 * Analyze conversation and extract potential learnings
 * This is called after important conversations to identify what to remember
 */
async function analyzeConversation(messages, aiProvider) {
  try {
    // Find messages that might contain learnings
    // Look for user statements about themselves, their work, preferences, etc.
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
    const content = await loadMemory();
    if (!content) return null;
    
    const stats = await fs.stat(MEMORY_PATH);
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const lineCount = content.split('\n').length;
    
    // Count entries in different sections
    const learningsMatch = content.match(/## Conversations & Learnings[\s\S]*?(?=\n## |$)/);
    const learningsCount = learningsMatch 
      ? (learningsMatch[0].match(/^- /gm) || []).length 
      : 0;
    
    const factsMatch = content.match(/## Important Facts[\s\S]*?(?=\n## |$)/);
    const factsCount = factsMatch 
      ? (factsMatch[0].match(/^- /gm) || []).length 
      : 0;
    
    return {
      exists: true,
      path: MEMORY_PATH,
      size: stats.size,
      modified: stats.mtime,
      wordCount,
      lineCount,
      learningsCount,
      factsCount
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
    // Backup current memory
    const backup = await loadMemory();
    const backupPath = path.join(
      NOTES_DIR, 
      `openai-context.backup.${Date.now()}.md`
    );
    await fs.writeFile(backupPath, backup, 'utf-8');
    
    logger.system.warn('Memory cleared - backup created', { backupPath });
    
    // Re-initialize with fresh template
    await fs.unlink(MEMORY_PATH);
    await initializeMemoryFile();
    
    return { success: true, backupPath };
  } catch (error) {
    logger.system.error('Failed to clear memory', { error: error.message });
    return { success: false, error: error.message };
  }
}

module.exports = {
  initializeMemoryFile,
  loadMemory,
  updateMemory,
  addLearning,
  addFact,
  updateUserProfile,
  analyzeConversation,
  getMemorySummary,
  clearMemory,
  MEMORY_FILE,
  MEMORY_PATH
};
