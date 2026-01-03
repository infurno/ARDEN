/**
 * Status Routes
 * 
 * System status and health information
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const { AI_PROVIDER, OLLAMA_MODEL, OPENAI_MODEL } = require('../services/ai-providers');

// Load configuration
const ARDEN_ROOT = path.resolve(__dirname, '../..');
const config = require(path.join(ARDEN_ROOT, 'config/arden.json'));

// Track server start time
const startTime = Date.now();

/**
 * GET /api/status
 * Get ARDEN system status
 */
router.get('/', async (req, res) => {
  try {
    // Get uptime
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    
    // Determine AI model
    let aiModel = AI_PROVIDER;
    if (AI_PROVIDER === 'ollama') aiModel = `${AI_PROVIDER} (${OLLAMA_MODEL})`;
    if (AI_PROVIDER === 'openai') aiModel = `${AI_PROVIDER} (${OPENAI_MODEL})`;
    
    // Get notes count
    let notesCount = 0;
    try {
      const notesDir = path.join(process.env.HOME, 'Notes');
      const files = await fs.readdir(notesDir);
      notesCount = files.filter(f => f.endsWith('.md')).length;
    } catch (error) {
      logger.system.warn('Failed to count notes', { error: error.message });
    }
    
    // Get TODO count
    let todoCount = { total: 0, unchecked: 0, checked: 0 };
    try {
      const todoFile = path.join(process.env.HOME, 'Notes/todo.md');
      const content = await fs.readFile(todoFile, 'utf-8');
      const lines = content.split('\n');
      
      todoCount.total = lines.filter(l => /Total TODO items found.*(\d+)/.test(l))
        .map(l => parseInt(l.match(/(\d+)/)[1]))[0] || 0;
      todoCount.unchecked = lines.filter(l => /Unchecked items.*(\d+)/.test(l))
        .map(l => parseInt(l.match(/(\d+)/)[1]))[0] || 0;
      todoCount.checked = lines.filter(l => /Checked items.*(\d+)/.test(l))
        .map(l => parseInt(l.match(/(\d+)/)[1]))[0] || 0;
    } catch (error) {
      logger.system.warn('Failed to read TODO stats', { error: error.message });
    }
    
    const status = {
      status: 'running',
      uptime: uptime,
      uptimeFormatted: formatUptime(uptime),
      ai: {
        provider: AI_PROVIDER,
        model: aiModel
      },
      voice: {
        enabled: config.voice.enabled,
        stt: config.voice.stt_provider,
        tts: config.voice.tts_provider
      },
      stats: {
        notes: notesCount,
        todos: todoCount
      },
      version: config.version,
      timestamp: new Date().toISOString()
    };
    
    return res.json(status);
    
  } catch (error) {
    logger.system.error('Error getting status', { error: error.message });
    
    return res.status(500).json({
      error: 'Failed to get status',
      details: error.message
    });
  }
});

/**
 * GET /api/status/health
 * Simple health check
 */
router.get('/health', (req, res) => {
  return res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

/**
 * Format uptime in human readable format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

module.exports = router;
