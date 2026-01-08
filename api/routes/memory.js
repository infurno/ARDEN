/**
 * Memory Management Routes
 * 
 * API endpoints for managing ARDEN's persistent memory (openai-context.md)
 */

const express = require('express');
const router = express.Router();
const memoryManager = require('../services/memory-manager');
const logger = require('../utils/logger');

/**
 * GET /api/memory
 * Get current memory content
 */
router.get('/', async (req, res) => {
  try {
    const memory = await memoryManager.loadMemory();
    
    if (!memory) {
      return res.status(404).json({
        success: false,
        error: 'Memory file not found'
      });
    }
    
    return res.json({
      success: true,
      content: memory,
      filename: memoryManager.MEMORY_FILE,
      path: memoryManager.MEMORY_PATH
    });
    
  } catch (error) {
    logger.system.error('Failed to get memory', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to load memory'
    });
  }
});

/**
 * GET /api/memory/summary
 * Get memory statistics and summary
 */
router.get('/summary', async (req, res) => {
  try {
    const summary = await memoryManager.getMemorySummary();
    
    if (!summary) {
      return res.status(404).json({
        success: false,
        error: 'Memory file not found'
      });
    }
    
    return res.json({
      success: true,
      summary
    });
    
  } catch (error) {
    logger.system.error('Failed to get memory summary', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to get memory summary'
    });
  }
});

/**
 * POST /api/memory/learning
 * Add a new learning to memory
 * 
 * Body: { topic: string, information: string }
 */
router.post('/learning', async (req, res) => {
  try {
    const { topic, information } = req.body;
    
    if (!topic || !information) {
      return res.status(400).json({
        success: false,
        error: 'Topic and information are required'
      });
    }
    
    const success = await memoryManager.addLearning(topic, information);
    
    if (success) {
      logger.system.info('Learning added to memory', { topic });
      return res.json({
        success: true,
        message: 'Learning added successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Failed to add learning'
      });
    }
    
  } catch (error) {
    logger.system.error('Failed to add learning', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to add learning'
    });
  }
});

/**
 * POST /api/memory/fact
 * Add an important fact to memory
 * 
 * Body: { fact: string }
 */
router.post('/fact', async (req, res) => {
  try {
    const { fact } = req.body;
    
    if (!fact) {
      return res.status(400).json({
        success: false,
        error: 'Fact is required'
      });
    }
    
    const success = await memoryManager.addFact(fact);
    
    if (success) {
      logger.system.info('Fact added to memory');
      return res.json({
        success: true,
        message: 'Fact added successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Failed to add fact'
      });
    }
    
  } catch (error) {
    logger.system.error('Failed to add fact', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to add fact'
    });
  }
});

/**
 * PUT /api/memory/profile
 * Update user profile field
 * 
 * Body: { field: string, value: string }
 */
router.put('/profile', async (req, res) => {
  try {
    const { field, value } = req.body;
    
    if (!field || !value) {
      return res.status(400).json({
        success: false,
        error: 'Field and value are required'
      });
    }
    
    const success = await memoryManager.updateUserProfile(field, value);
    
    if (success) {
      logger.system.info('User profile updated', { field });
      return res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
    
  } catch (error) {
    logger.system.error('Failed to update profile', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

/**
 * PUT /api/memory/section
 * Update a specific section in memory
 * 
 * Body: { section: string, content: string, append: boolean }
 */
router.put('/section', async (req, res) => {
  try {
    const { section, content, append = true } = req.body;
    
    if (!section || !content) {
      return res.status(400).json({
        success: false,
        error: 'Section and content are required'
      });
    }
    
    const success = await memoryManager.updateMemory(section, content, append);
    
    if (success) {
      logger.system.info('Memory section updated', { section, append });
      return res.json({
        success: true,
        message: 'Section updated successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Failed to update section'
      });
    }
    
  } catch (error) {
    logger.system.error('Failed to update section', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to update section'
    });
  }
});

/**
 * POST /api/memory/initialize
 * Initialize memory file if it doesn't exist
 */
router.post('/initialize', async (req, res) => {
  try {
    await memoryManager.initializeMemoryFile();
    
    return res.json({
      success: true,
      message: 'Memory file initialized',
      path: memoryManager.MEMORY_PATH
    });
    
  } catch (error) {
    logger.system.error('Failed to initialize memory', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize memory file'
    });
  }
});

/**
 * DELETE /api/memory
 * Clear memory (creates backup)
 * DANGEROUS - requires confirmation
 */
router.delete('/', async (req, res) => {
  try {
    const { confirm } = req.body;
    
    if (confirm !== 'DELETE_MY_MEMORY') {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required. Send { "confirm": "DELETE_MY_MEMORY" }'
      });
    }
    
    const result = await memoryManager.clearMemory();
    
    if (result.success) {
      logger.system.warn('Memory cleared by user request', { 
        backupPath: result.backupPath 
      });
      return res.json({
        success: true,
        message: 'Memory cleared successfully',
        backupPath: result.backupPath
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to clear memory'
      });
    }
    
  } catch (error) {
    logger.system.error('Failed to clear memory', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to clear memory'
    });
  }
});

/**
 * POST /api/memory/analyze
 * Analyze conversation for learnings
 * 
 * Body: { messages: Array<{role: string, message: string}> }
 */
router.post('/analyze', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required'
      });
    }
    
    const learnings = await memoryManager.analyzeConversation(messages);
    
    return res.json({
      success: true,
      learnings,
      count: learnings.length
    });
    
  } catch (error) {
    logger.system.error('Failed to analyze conversation', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze conversation'
    });
  }
});

module.exports = router;
