/**
 * Skills Configuration Service
 * Manages skill enable/disable preferences
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

const ARDEN_ROOT = path.resolve(__dirname, '../..');
const DATA_DIR = path.join(ARDEN_ROOT, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'skills-config.json');

// Default configuration
const DEFAULT_CONFIG = {
  skills: {},
  updatedAt: null
};

/**
 * Ensure config file exists
 */
async function ensureConfigFile() {
  try {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Check if config file exists
    try {
      await fs.access(CONFIG_FILE);
    } catch {
      // Create default config
      await fs.writeFile(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
      logger.system.info('Created skills config file', { path: CONFIG_FILE });
    }
  } catch (error) {
    logger.system.error('Failed to ensure config file', { error: error.message });
    throw error;
  }
}

/**
 * Load skills configuration
 */
async function loadConfig() {
  try {
    await ensureConfigFile();
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    logger.system.error('Failed to load skills config', { error: error.message });
    return DEFAULT_CONFIG;
  }
}

/**
 * Save skills configuration
 */
async function saveConfig(config) {
  try {
    config.updatedAt = new Date().toISOString();
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
    logger.system.info('Skills config saved', { skillCount: Object.keys(config.skills).length });
    return true;
  } catch (error) {
    logger.system.error('Failed to save skills config', { error: error.message });
    return false;
  }
}

/**
 * Get skill enabled status
 */
async function isSkillEnabled(skillId) {
  const config = await loadConfig();
  
  // If skill is not in config, default to enabled
  if (!config.skills[skillId]) {
    return true;
  }
  
  return config.skills[skillId].enabled !== false;
}

/**
 * Set skill enabled status
 */
async function setSkillEnabled(skillId, enabled) {
  const config = await loadConfig();
  
  if (!config.skills[skillId]) {
    config.skills[skillId] = {};
  }
  
  config.skills[skillId].enabled = enabled;
  config.skills[skillId].lastModified = new Date().toISOString();
  
  const saved = await saveConfig(config);
  
  logger.system.info('Skill enabled status updated', { skillId, enabled });
  
  return saved;
}

/**
 * Toggle skill enabled status
 */
async function toggleSkill(skillId) {
  const currentStatus = await isSkillEnabled(skillId);
  const newStatus = !currentStatus;
  await setSkillEnabled(skillId, newStatus);
  return newStatus;
}

/**
 * Get all skills configuration
 */
async function getAllSkillsConfig() {
  const config = await loadConfig();
  return config.skills;
}

/**
 * Get skill configuration
 */
async function getSkillConfig(skillId) {
  const config = await loadConfig();
  return config.skills[skillId] || { enabled: true };
}

/**
 * Update skill configuration (for future use - custom settings per skill)
 */
async function updateSkillConfig(skillId, settings) {
  const config = await loadConfig();
  
  if (!config.skills[skillId]) {
    config.skills[skillId] = { enabled: true };
  }
  
  config.skills[skillId] = {
    ...config.skills[skillId],
    ...settings,
    lastModified: new Date().toISOString()
  };
  
  await saveConfig(config);
  
  logger.system.info('Skill config updated', { skillId, settings });
  
  return config.skills[skillId];
}

module.exports = {
  loadConfig,
  saveConfig,
  isSkillEnabled,
  setSkillEnabled,
  toggleSkill,
  getAllSkillsConfig,
  getSkillConfig,
  updateSkillConfig
};
