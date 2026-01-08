/**
 * Context Loader Service
 * 
 * Loads user context from configured directories to personalize ARDEN responses.
 * This includes reading notes, documents, and other files to build a profile
 * of the user's work, interests, and preferences.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const logger = require('../utils/logger');
const memoryManager = require('./memory-manager');

// Load configuration
const ARDEN_ROOT = path.resolve(__dirname, '../..');
const config = require(path.join(ARDEN_ROOT, 'config/arden.json'));

/**
 * Get structured user context from user-context skill
 */
function getUserContextFromSkill() {
  try {
    const userContextScript = path.join(ARDEN_ROOT, 'skills/user-context/tools/user_context.sh');
    const userContext = execSync(`"${userContextScript}" text`, { encoding: 'utf-8' });
    return userContext;
  } catch (error) {
    logger.system.warn('Failed to load user context from skill', { error: error.message });
    return null;
  }
}

/**
 * Expand home directory in path
 */
function expandPath(filepath) {
  if (filepath.startsWith('~/')) {
    return path.join(os.homedir(), filepath.slice(2));
  }
  return filepath;
}

/**
 * Read recent notes from a directory
 */
async function getRecentNotes(directory, limit = 10) {
  try {
    const expandedDir = expandPath(directory);
    const files = await fs.readdir(expandedDir);
    
    // Filter for markdown files
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    // Get file stats to sort by modification time
    const fileStats = await Promise.all(
      mdFiles.map(async (file) => {
        const filepath = path.join(expandedDir, file);
        const stats = await fs.stat(filepath);
        return { file, filepath, mtime: stats.mtime };
      })
    );
    
    // Sort by modification time (most recent first)
    fileStats.sort((a, b) => b.mtime - a.mtime);
    
    // Take the most recent files
    const recentFiles = fileStats.slice(0, limit);
    
    // Read file contents
    const notes = await Promise.all(
      recentFiles.map(async ({ file, filepath }) => {
        try {
          const content = await fs.readFile(filepath, 'utf-8');
          // Take first 500 characters to avoid overloading context
          const preview = content.slice(0, 500);
          return { file, preview };
        } catch (error) {
          logger.system.warn('Failed to read note file', { file, error: error.message });
          return null;
        }
      })
    );
    
    return notes.filter(n => n !== null);
  } catch (error) {
    logger.system.warn('Failed to read notes directory', { 
      directory, 
      error: error.message 
    });
    return [];
  }
}

/**
 * Search for specific note files (e.g., profile, about, readme)
 */
async function findProfileNotes(directory) {
  try {
    const expandedDir = expandPath(directory);
    const files = await fs.readdir(expandedDir);
    
    // Look for profile/about/readme files
    const profilePatterns = [
      /^profile\.md$/i,
      /^about\.md$/i,
      /^readme\.md$/i,
      /^me\.md$/i,
      /^user-profile\.md$/i,
      /^personal\.md$/i
    ];
    
    const profileFiles = files.filter(file => 
      profilePatterns.some(pattern => pattern.test(file))
    );
    
    const profiles = [];
    for (const file of profileFiles) {
      try {
        const content = await fs.readFile(path.join(expandedDir, file), 'utf-8');
        profiles.push({ file, content });
      } catch (error) {
        logger.system.warn('Failed to read profile file', { file, error: error.message });
      }
    }
    
    return profiles;
  } catch (error) {
    logger.system.warn('Failed to search for profile notes', { 
      directory, 
      error: error.message 
    });
    return [];
  }
}

/**
 * Build user context from configured directories
 */
async function loadUserContext() {
  logger.system.info('Loading user context from configured directories');
  
  const contextDirs = config.context?.directories || [];
  
  if (contextDirs.length === 0) {
    logger.system.warn('No context directories configured');
    return null;
  }
  
  let context = {
    userInfo: {},
    recentActivity: [],
    profileNotes: [],
    structuredContext: null,
    memoryContext: null  // NEW: ARDEN's persistent memory
  };
  
  // PRIORITY 1: Load ARDEN's persistent memory from openai-context.md
  try {
    const memory = await memoryManager.loadMemory();
    if (memory) {
      context.memoryContext = memory;
      logger.system.info('Loaded ARDEN persistent memory', { 
        size: memory.length,
        source: 'openai-context.md' 
      });
    }
  } catch (error) {
    logger.system.warn('Failed to load ARDEN memory', { error: error.message });
  }
  
  // PRIORITY 2: Load structured user context from skill
  const skillContext = getUserContextFromSkill();
  if (skillContext) {
    context.structuredContext = skillContext;
    logger.system.info('Loaded structured user context from skill');
  }
  
  // PRIORITY 3: Load from each directory
  for (const dir of contextDirs) {
    logger.system.info('Loading context from directory', { directory: dir });
    
    // Look for profile/about files
    const profiles = await findProfileNotes(dir);
    context.profileNotes.push(...profiles);
    
    // Get recent notes (especially from ~/Notes)
    if (dir.includes('Notes')) {
      const recentNotes = await getRecentNotes(dir, 5);
      context.recentActivity.push(...recentNotes);
    }
  }
  
  logger.system.info('User context loaded', { 
    hasMemoryContext: !!context.memoryContext,
    hasStructuredContext: !!context.structuredContext,
    profileCount: context.profileNotes.length,
    recentNotesCount: context.recentActivity.length 
  });
  
  return context;
}

/**
 * Build context summary for system prompt
 */
function buildContextSummary(context) {
  if (!context) return '';
  
  let summary = '\n\n=== USER CONTEXT ===\n';
  
  // PRIORITY 1: Add ARDEN's persistent memory (MOST IMPORTANT)
  if (context.memoryContext) {
    summary += '\n📝 ARDEN PERSISTENT MEMORY (from openai-context.md):\n';
    summary += '---\n';
    summary += context.memoryContext;
    summary += '\n---\n';
    summary += '\nIMPORTANT: This is your persistent memory. Remember this information across all conversations.\n';
    summary += 'When you learn important information, you can update this memory using the memory management functions.\n\n';
  }
  
  // PRIORITY 2: Add structured user context from skill
  if (context.structuredContext) {
    summary += '\nAdditional Context from Skills:\n';
    summary += context.structuredContext + '\n';
  }
  
  // PRIORITY 3: Add profile information (only if no memory context)
  if (context.profileNotes.length > 0 && !context.memoryContext) {
    summary += '\nUser Profile:\n';
    context.profileNotes.forEach(({ file, content }) => {
      summary += `From ${file}:\n${content.slice(0, 1000)}\n\n`;
    });
  }
  
  // PRIORITY 4: Add recent activity (brief)
  if (context.recentActivity.length > 0) {
    summary += '\nRecent Activity (what user has been working on):\n';
    context.recentActivity.forEach(({ file, preview }) => {
      summary += `- ${file}: ${preview.slice(0, 150)}...\n`;
    });
  }
  
  summary += '\n=== END USER CONTEXT ===\n';
  
  return summary;
}

/**
 * Load and cache user context (can be called periodically to refresh)
 */
let cachedContext = null;
let lastLoadTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getContext(forceRefresh = false) {
  const now = Date.now();
  
  if (!forceRefresh && cachedContext && (now - lastLoadTime) < CACHE_DURATION) {
    logger.system.info('Using cached context');
    return cachedContext;
  }
  
  logger.system.info('Loading fresh context');
  cachedContext = await loadUserContext();
  lastLoadTime = now;
  
  return cachedContext;
}

/**
 * Get context summary for inclusion in AI prompts
 */
async function getContextForPrompt(forceRefresh = false) {
  const context = await getContext(forceRefresh);
  return buildContextSummary(context);
}

module.exports = {
  loadUserContext,
  getContext,
  getContextForPrompt,
  buildContextSummary
};
