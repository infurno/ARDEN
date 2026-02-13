/**
 * Context Loader Service
 * 
 * Loads ARDEN's identity and user context from the OpenClaw identity files:
 *   SOUL.md    - Core identity and personality
 *   USER.md    - User profile and preferences
 *   MEMORY.md  - Decisions, lessons, long-term context
 *   AGENTS.md  - Agent behavior and routing rules
 *   HEARTBEAT.md - Proactive monitoring configuration
 * 
 * Falls back to legacy openai-context.md if identity files are missing.
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

// Identity file paths (OpenClaw architecture)
const IDENTITY_FILES = {
  soul: path.join(ARDEN_ROOT, 'SOUL.md'),
  user: path.join(ARDEN_ROOT, 'USER.md'),
  memory: path.join(ARDEN_ROOT, 'MEMORY.md'),
  agents: path.join(ARDEN_ROOT, 'AGENTS.md'),
  heartbeat: path.join(ARDEN_ROOT, 'HEARTBEAT.md'),
};

const DAILY_DIR = path.join(ARDEN_ROOT, 'daily');

/**
 * Read an identity file safely
 */
async function readIdentityFile(name, filepath) {
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    logger.system.info(`Loaded identity file: ${name}`, { 
      path: filepath, 
      size: content.length 
    });
    return content;
  } catch (error) {
    logger.system.warn(`Identity file not found: ${name}`, { 
      path: filepath, 
      error: error.message 
    });
    return null;
  }
}

/**
 * Load all identity files (SOUL.md, USER.md, MEMORY.md, AGENTS.md, HEARTBEAT.md)
 */
async function loadIdentityFiles() {
  const identity = {};
  
  const loadPromises = Object.entries(IDENTITY_FILES).map(async ([name, filepath]) => {
    identity[name] = await readIdentityFile(name, filepath);
  });
  
  await Promise.all(loadPromises);
  
  const loaded = Object.entries(identity)
    .filter(([, content]) => content !== null)
    .map(([name]) => name);
  
  logger.system.info('Identity files loaded', { 
    loaded, 
    total: Object.keys(IDENTITY_FILES).length 
  });
  
  return identity;
}

/**
 * Get today's daily log (if it exists)
 */
async function getTodaysDailyLog() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyPath = path.join(DAILY_DIR, `${today}.md`);
    const content = await fs.readFile(dailyPath, 'utf-8');
    return content;
  } catch {
    return null;
  }
}

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
    
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    const fileStats = await Promise.all(
      mdFiles.map(async (file) => {
        const filepath = path.join(expandedDir, file);
        const stats = await fs.stat(filepath);
        return { file, filepath, mtime: stats.mtime };
      })
    );
    
    fileStats.sort((a, b) => b.mtime - a.mtime);
    const recentFiles = fileStats.slice(0, limit);
    
    const notes = await Promise.all(
      recentFiles.map(async ({ file, filepath }) => {
        try {
          const content = await fs.readFile(filepath, 'utf-8');
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
 * Build user context from identity files + configured directories
 */
async function loadUserContext() {
  logger.system.info('Loading user context (OpenClaw identity system)');
  
  let context = {
    identity: null,         // OpenClaw identity files
    dailyLog: null,         // Today's daily log
    userInfo: {},
    recentActivity: [],
    profileNotes: [],
    structuredContext: null,
    memoryContext: null,     // Legacy: openai-context.md fallback
  };
  
  // PRIORITY 1: Load OpenClaw identity files
  const identity = await loadIdentityFiles();
  const hasIdentity = identity.soul || identity.user || identity.memory;
  
  if (hasIdentity) {
    context.identity = identity;
    logger.system.info('Using OpenClaw identity system');
  } else {
    // FALLBACK: Load legacy memory from openai-context.md
    logger.system.info('Identity files not found, falling back to legacy openai-context.md');
    try {
      const memory = await memoryManager.loadMemory();
      if (memory) {
        context.memoryContext = memory;
        logger.system.info('Loaded legacy persistent memory', { 
          size: memory.length,
          source: 'openai-context.md' 
        });
      }
    } catch (error) {
      logger.system.warn('Failed to load legacy memory', { error: error.message });
    }
  }

  // PRIORITY 2: Load today's daily log
  const dailyLog = await getTodaysDailyLog();
  if (dailyLog) {
    context.dailyLog = dailyLog;
    logger.system.info('Loaded today\'s daily log');
  }
  
  // PRIORITY 3: Load structured user context from skill
  const skillContext = getUserContextFromSkill();
  if (skillContext) {
    context.structuredContext = skillContext;
    logger.system.info('Loaded structured user context from skill');
  }
  
  // PRIORITY 4: Load from configured directories
  const contextDirs = config.context?.directories || [];
  for (const dir of contextDirs) {
    const profiles = await findProfileNotes(dir);
    context.profileNotes.push(...profiles);
    
    if (dir.includes('Notes')) {
      const recentNotes = await getRecentNotes(dir, 5);
      context.recentActivity.push(...recentNotes);
    }
  }
  
  logger.system.info('User context loaded', { 
    hasIdentity: !!context.identity,
    hasLegacyMemory: !!context.memoryContext,
    hasDailyLog: !!context.dailyLog,
    hasStructuredContext: !!context.structuredContext,
    profileCount: context.profileNotes.length,
    recentNotesCount: context.recentActivity.length 
  });
  
  return context;
}

/**
 * Build context summary for system prompt (OpenClaw format)
 */
function buildContextSummary(context) {
  if (!context) return '';
  
  let summary = '';
  
  // === OpenClaw Identity System ===
  if (context.identity) {
    // SOUL.md - Core identity (highest priority, always included)
    if (context.identity.soul) {
      summary += '\n=== ARDEN IDENTITY (SOUL.md) ===\n';
      summary += context.identity.soul;
      summary += '\n=== END IDENTITY ===\n';
    }
    
    // USER.md - User profile and preferences
    if (context.identity.user) {
      summary += '\n=== USER PROFILE (USER.md) ===\n';
      summary += context.identity.user;
      summary += '\n=== END USER PROFILE ===\n';
    }
    
    // MEMORY.md - Decisions, lessons, context
    if (context.identity.memory) {
      summary += '\n=== MEMORY (MEMORY.md) ===\n';
      summary += context.identity.memory;
      summary += '\n=== END MEMORY ===\n';
    }
    
    // AGENTS.md - Agent behavior (only include routing rules, not full file)
    if (context.identity.agents) {
      summary += '\n=== AGENT BEHAVIOR (AGENTS.md) ===\n';
      summary += context.identity.agents;
      summary += '\n=== END AGENT BEHAVIOR ===\n';
    }
    
    // HEARTBEAT.md - Monitoring config (brief reference only)
    if (context.identity.heartbeat) {
      summary += '\n=== HEARTBEAT CONFIG (HEARTBEAT.md) ===\n';
      summary += 'Heartbeat configuration is available. Reference HEARTBEAT.md for monitoring rules.\n';
      summary += '=== END HEARTBEAT CONFIG ===\n';
    }
    
    summary += '\nIMPORTANT: You are ARDEN. SOUL.md defines your identity. USER.md defines who you serve. ';
    summary += 'MEMORY.md contains your long-term memory. When you learn important information, ';
    summary += 'update MEMORY.md (decisions, lessons) and USER.md (profile changes) through the memory management system.\n';
  }
  
  // === Legacy fallback ===
  if (!context.identity && context.memoryContext) {
    summary += '\n=== USER CONTEXT (Legacy) ===\n';
    summary += context.memoryContext;
    summary += '\n=== END USER CONTEXT ===\n';
    summary += '\nIMPORTANT: This is your persistent memory. Remember this information across all conversations.\n';
  }
  
  // Today's daily log (brief)
  if (context.dailyLog) {
    summary += '\n=== TODAY\'S LOG ===\n';
    summary += context.dailyLog;
    summary += '\n=== END TODAY\'S LOG ===\n';
  }
  
  // Structured context from skills
  if (context.structuredContext) {
    summary += '\nAdditional Context from Skills:\n';
    summary += context.structuredContext + '\n';
  }
  
  // Profile notes (only if no identity system)
  if (context.profileNotes.length > 0 && !context.identity) {
    summary += '\nUser Profile:\n';
    context.profileNotes.forEach(({ file, content }) => {
      summary += `From ${file}:\n${content.slice(0, 1000)}\n\n`;
    });
  }
  
  // Recent activity
  if (context.recentActivity.length > 0) {
    summary += '\nRecent Activity (what user has been working on):\n';
    context.recentActivity.forEach(({ file, preview }) => {
      summary += `- ${file}: ${preview.slice(0, 150)}...\n`;
    });
  }
  
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

/**
 * Get paths to identity files (for use by other services)
 */
function getIdentityPaths() {
  return { ...IDENTITY_FILES };
}

module.exports = {
  loadUserContext,
  getContext,
  getContextForPrompt,
  buildContextSummary,
  getIdentityPaths,
  IDENTITY_FILES,
  DAILY_DIR
};
