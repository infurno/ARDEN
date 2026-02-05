/**
 * Skills Management Routes
 * Provides skill discovery, configuration, and execution
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const skillsConfig = require('../services/skills-config');
const db = require('../services/database');

const ARDEN_ROOT = path.resolve(__dirname, '../..');
const SKILLS_DIR = path.join(ARDEN_ROOT, 'skills');

// GET /api/skills - List all available skills
router.get('/', async (req, res) => {
  try {
    const skills = await discoverSkills();
    
    // Add enabled status from config
    const skillsWithConfig = await Promise.all(
      skills.map(async (skill) => {
        const enabled = await skillsConfig.isSkillEnabled(skill.id);
        return { ...skill, enabled };
      })
    );
    
    res.json({
      success: true,
      skills: skillsWithConfig
    });
  } catch (error) {
    logger.system.error('Failed to list skills', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to load skills'
    });
  }
});

// GET /api/skills/:skillId - Get detailed info about a specific skill
router.get('/:skillId', async (req, res) => {
  try {
    const { skillId } = req.params;
    const skill = await getSkillDetails(skillId);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
    }
    
    res.json({
      success: true,
      skill
    });
  } catch (error) {
    logger.system.error('Failed to get skill details', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to load skill details'
    });
  }
});

// POST /api/skills/:skillId/execute - Execute a skill manually
router.post('/:skillId/execute', async (req, res) => {
  const startTime = Date.now();
  const { skillId } = req.params;
  const { params = {} } = req.body;
  
  try {
    // Get session info
    const sessionId = req.session?.id || 'unknown';
    const userId = req.session?.userId || req.session?.user_id || 'web-user';
    
    logger.system.info('Manual skill execution requested', { skillId, params, userId });
    
    // Check if skill exists
    const skill = await getSkillDetails(skillId);
    if (!skill) {
      const executionTime = Date.now() - startTime;
      db.recordSkillExecution(skillId, userId, sessionId, false, executionTime, 'Skill not found');
      
      return res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
    }
    
    // Check if skill is enabled
    const isEnabled = await skillsConfig.isSkillEnabled(skillId);
    if (!isEnabled) {
      const executionTime = Date.now() - startTime;
      db.recordSkillExecution(skillId, userId, sessionId, false, executionTime, 'Skill is disabled');
      
      return res.status(403).json({
        success: false,
        error: 'Skill is disabled'
      });
    }
    
    // TODO: Implement actual skill execution based on skill type
    // For now, simulate execution
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
    
    const executionTime = Date.now() - startTime;
    
    // Record successful execution
    db.recordSkillExecution(skillId, userId, sessionId, true, executionTime, null, { params });
    
    res.json({
      success: true,
      message: 'Skill execution not yet fully implemented (placeholder)',
      skillId,
      executionTimeMs: executionTime
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const sessionId = req.session?.id || 'unknown';
    const userId = req.session?.userId || req.session?.user_id || 'web-user';
    
    // Record failed execution
    db.recordSkillExecution(skillId, userId, sessionId, false, executionTime, error.message);
    
    logger.system.error('Failed to execute skill', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to execute skill'
    });
  }
});

// POST /api/skills/:skillId/toggle - Toggle skill enabled/disabled
router.post('/:skillId/toggle', async (req, res) => {
  try {
    const { skillId } = req.params;
    
    // Check if skill exists
    const skill = await getSkillDetails(skillId);
    if (!skill) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
    }
    
    const newStatus = await skillsConfig.toggleSkill(skillId);
    
    logger.system.info('Skill toggled', { skillId, enabled: newStatus });
    
    res.json({
      success: true,
      skillId,
      enabled: newStatus
    });
  } catch (error) {
    logger.system.error('Failed to toggle skill', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to toggle skill'
    });
  }
});

// PATCH /api/skills/:skillId - Update skill configuration
router.patch('/:skillId', async (req, res) => {
  try {
    const { skillId } = req.params;
    const { enabled } = req.body;
    
    // Check if skill exists
    const skill = await getSkillDetails(skillId);
    if (!skill) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
    }
    
    if (typeof enabled === 'boolean') {
      await skillsConfig.setSkillEnabled(skillId, enabled);
    }
    
    const config = await skillsConfig.getSkillConfig(skillId);
    
    logger.system.info('Skill config updated', { skillId, enabled: config.enabled });
    
    res.json({
      success: true,
      skillId,
      config
    });
  } catch (error) {
    logger.system.error('Failed to update skill config', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to update skill configuration'
    });
  }
});

/**
 * Helper Functions
 */

// Discover all skills in the skills directory
async function discoverSkills() {
  const skills = [];
  
  try {
    const entries = await fs.readdir(SKILLS_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const skillPath = path.join(SKILLS_DIR, entry.name);
        const skillMdPath = path.join(skillPath, 'SKILL.md');
        
        try {
          await fs.access(skillMdPath);
          const skill = await parseSkillMd(entry.name, skillMdPath);
          skills.push(skill);
        } catch {
          // No SKILL.md found, skip (silently - this is expected for non-skill directories)
        }
      }
    }
  } catch (error) {
    logger.system.error('Failed to discover skills', { error: error.message });
  }
  
  return skills;
}

// Get detailed information about a specific skill
async function getSkillDetails(skillId) {
  const skillPath = path.join(SKILLS_DIR, skillId);
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  
  try {
    await fs.access(skillMdPath);
    const skill = await parseSkillMd(skillId, skillMdPath);
    
    // Get additional details
    skill.tools = await getSkillTools(skillId);
    skill.workflows = await getSkillWorkflows(skillId);
    skill.context = await getSkillContext(skillId);
    
    return skill;
  } catch {
    return null;
  }
}

// Parse SKILL.md file to extract metadata
async function parseSkillMd(skillId, filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let title = skillId;
  let purpose = '';
  let description = '';
  let enabled = true; // Default to enabled
  
  // Extract title (first # heading)
  for (const line of lines) {
    if (line.startsWith('# ')) {
      title = line.replace('# ', '').trim();
      break;
    }
  }
  
  // Extract purpose section
  const purposeMatch = content.match(/## Purpose\s+([\s\S]*?)(?=\n##|$)/i);
  if (purposeMatch) {
    purpose = purposeMatch[1].trim();
  }
  
  // Extract description (first paragraph after title)
  const descMatch = content.match(/^#[^#].*?\n\n(.*?)\n/m);
  if (descMatch) {
    description = descMatch[1].trim();
  } else if (purpose) {
    description = purpose.split('\n')[0]; // Use first line of purpose
  }
  
  return {
    id: skillId,
    name: title,
    description: description || purpose.split('\n')[0] || 'No description available',
    purpose,
    enabled,
    path: path.join(SKILLS_DIR, skillId)
  };
}

// Get tools for a skill
async function getSkillTools(skillId) {
  const toolsPath = path.join(SKILLS_DIR, skillId, 'tools');
  const tools = [];
  
  try {
    const files = await fs.readdir(toolsPath);
    for (const file of files) {
      if (file.endsWith('.sh') || file.endsWith('.js') || file.endsWith('.py')) {
        tools.push({
          name: file,
          path: path.join(toolsPath, file),
          type: file.split('.').pop()
        });
      }
    }
  } catch {
    // No tools directory
  }
  
  return tools;
}

// Get workflows for a skill
async function getSkillWorkflows(skillId) {
  const workflowsPath = path.join(SKILLS_DIR, skillId, 'workflows');
  const workflows = [];
  
  try {
    const files = await fs.readdir(workflowsPath);
    for (const file of files) {
      if (file.endsWith('.md')) {
        workflows.push({
          name: file.replace('.md', ''),
          path: path.join(workflowsPath, file)
        });
      }
    }
  } catch {
    // No workflows directory
  }
  
  return workflows;
}

// Get context files for a skill
async function getSkillContext(skillId) {
  const contextPath = path.join(SKILLS_DIR, skillId, 'context');
  const contextFiles = [];
  
  try {
    const files = await fs.readdir(contextPath);
    for (const file of files) {
      contextFiles.push({
        name: file,
        path: path.join(contextPath, file)
      });
    }
  } catch {
    // No context directory
  }
  
  return contextFiles;
}

module.exports = router;
