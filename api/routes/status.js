/**
 * Status Routes
 * 
 * System status and health information
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('../utils/logger');
const { AI_PROVIDER, OLLAMA_MODEL, OPENAI_MODEL } = require('../services/ai-providers');
const { getStats } = require('../services/database');

const execAsync = promisify(exec);

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
    
    // Get database stats
    const dbStats = getStats();
    
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
        todos: todoCount,
        sessions: dbStats.sessions,
        chatMessages: dbStats.messages,
        databaseSize: `${dbStats.dbSizeMB} MB`
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
 * GET /api/status/system
 * Get system resource usage (CPU, Memory, GPU)
 */
router.get('/system', async (req, res) => {
  try {
    const systemStats = {
      cpu: await getCpuUsage(),
      memory: await getMemoryUsage(),
      gpu: await getGpuUsage(),
      disk: await getDiskUsage(),
      timestamp: new Date().toISOString()
    };
    
    return res.json({
      success: true,
      stats: systemStats
    });
    
  } catch (error) {
    logger.system.error('Error getting system stats', { error: error.message });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get system stats',
      details: error.message
    });
  }
});

/**
 * Get CPU usage percentage
 */
async function getCpuUsage() {
  try {
    // Use top command to get CPU usage
    const { stdout } = await execAsync("top -bn2 -d 0.5 | grep '^%Cpu' | tail -n 1 | awk '{print $2}'");
    const cpuUsage = parseFloat(stdout.trim());
    
    // Get CPU info
    const { stdout: cpuInfo } = await execAsync("lscpu | grep 'Model name' | cut -d ':' -f2 | xargs");
    const cpuModel = cpuInfo.trim();
    
    // Get core count
    const { stdout: coreCount } = await execAsync("nproc");
    const cores = parseInt(coreCount.trim());
    
    return {
      usage: isNaN(cpuUsage) ? 0 : cpuUsage,
      model: cpuModel || 'Unknown',
      cores: cores || 0
    };
  } catch (error) {
    logger.system.warn('Failed to get CPU usage', { error: error.message });
    return {
      usage: 0,
      model: 'Unknown',
      cores: 0,
      error: error.message
    };
  }
}

/**
 * Get memory usage
 */
async function getMemoryUsage() {
  try {
    const { stdout } = await execAsync("free -m | grep Mem");
    const parts = stdout.trim().split(/\s+/);
    
    const total = parseInt(parts[1]);
    const used = parseInt(parts[2]);
    const free = parseInt(parts[3]);
    const available = parseInt(parts[6]);
    
    return {
      total: total,
      used: used,
      free: free,
      available: available,
      usagePercent: ((used / total) * 100).toFixed(1),
      totalGB: (total / 1024).toFixed(2),
      usedGB: (used / 1024).toFixed(2),
      availableGB: (available / 1024).toFixed(2)
    };
  } catch (error) {
    logger.system.warn('Failed to get memory usage', { error: error.message });
    return {
      total: 0,
      used: 0,
      free: 0,
      available: 0,
      usagePercent: 0,
      error: error.message
    };
  }
}

/**
 * Get GPU usage (NVIDIA GPUs via nvidia-smi)
 */
async function getGpuUsage() {
  try {
    // Check if nvidia-smi is available
    const { stdout } = await execAsync(
      "nvidia-smi --query-gpu=name,memory.total,memory.used,memory.free,utilization.gpu,temperature.gpu --format=csv,noheader,nounits"
    );
    
    const lines = stdout.trim().split('\n');
    const gpus = lines.map((line, index) => {
      const parts = line.split(', ');
      
      const totalMemory = parseInt(parts[1]);
      const usedMemory = parseInt(parts[2]);
      const freeMemory = parseInt(parts[3]);
      const utilization = parseFloat(parts[4]);
      const temperature = parseInt(parts[5]);
      
      return {
        id: index,
        name: parts[0],
        memory: {
          total: totalMemory,
          used: usedMemory,
          free: freeMemory,
          usagePercent: ((usedMemory / totalMemory) * 100).toFixed(1),
          totalGB: (totalMemory / 1024).toFixed(2),
          usedGB: (usedMemory / 1024).toFixed(2),
          freeGB: (freeMemory / 1024).toFixed(2)
        },
        utilization: utilization,
        temperature: temperature
      };
    });
    
    return {
      available: true,
      count: gpus.length,
      gpus: gpus
    };
    
  } catch (error) {
    // GPU not available or nvidia-smi not installed
    return {
      available: false,
      count: 0,
      gpus: [],
      message: 'No NVIDIA GPU detected or nvidia-smi not available'
    };
  }
}

/**
 * Get disk usage for home directory
 */
async function getDiskUsage() {
  try {
    const { stdout } = await execAsync(`df -h ${process.env.HOME} | tail -n 1`);
    const parts = stdout.trim().split(/\s+/);
    
    return {
      filesystem: parts[0],
      total: parts[1],
      used: parts[2],
      available: parts[3],
      usagePercent: parseInt(parts[4].replace('%', '')),
      mountpoint: parts[5]
    };
  } catch (error) {
    logger.system.warn('Failed to get disk usage', { error: error.message });
    return {
      error: error.message
    };
  }
}

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
