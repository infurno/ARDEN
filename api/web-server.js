#!/usr/bin/env node

/**
 * ARDEN Web Interface Server
 * 
 * Provides a web dashboard for ARDEN bot management and monitoring
 * Runs on port 3000 by default
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Load configuration
const config = require('../config/arden.json');

const PORT = process.env.WEB_PORT || 3000;
const HOST = process.env.WEB_HOST || '0.0.0.0';

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../web/public')));

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Bot status
app.get('/api/status', async (req, res) => {
  try {
    const status = {
      bot: {
        enabled: config.telegram?.enabled || false,
        provider: process.env.AI_PROVIDER || 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
      },
      voice: {
        stt: config.voice?.stt_provider || 'openai-whisper',
        tts: config.voice?.tts_provider || 'edge-tts'
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version
      }
    };
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent sessions
app.get('/api/sessions/recent', async (req, res) => {
  try {
    const sessionsDir = path.join(__dirname, '../history/sessions');
    const limit = parseInt(req.query.limit) || 10;
    
    const files = await fs.readdir(sessionsDir);
    const sessionFiles = files
      .filter(f => f.endsWith('.jsonl'))
      .sort()
      .reverse()
      .slice(0, limit);
    
    const sessions = [];
    for (const file of sessionFiles) {
      const filePath = path.join(sessionsDir, file);
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(l => l);
      
      sessions.push({
        filename: file,
        date: stats.mtime,
        messageCount: lines.length,
        size: stats.size
      });
    }
    
    res.json(sessions);
  } catch (error) {
    res.json({ sessions: [], error: error.message });
  }
});

// Configuration endpoint
app.get('/api/config', (req, res) => {
  // Return safe config (no API keys)
  const safeConfig = {
    telegram: {
      enabled: config.telegram?.enabled || false
    },
    voice: {
      stt_provider: config.voice?.stt_provider,
      tts_provider: config.voice?.tts_provider
    },
    ai: {
      provider: process.env.AI_PROVIDER,
      model: process.env.OPENAI_MODEL || process.env.OLLAMA_MODEL
    }
  };
  res.json(safeConfig);
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const sessionsDir = path.join(__dirname, '../history/sessions');
    const files = await fs.readdir(sessionsDir);
    
    let totalMessages = 0;
    let totalSessions = 0;
    
    for (const file of files.filter(f => f.endsWith('.jsonl'))) {
      totalSessions++;
      const content = await fs.readFile(path.join(sessionsDir, file), 'utf-8');
      const lines = content.trim().split('\n').filter(l => l);
      totalMessages += lines.length;
    }
    
    res.json({
      totalSessions,
      totalMessages,
      averageMessagesPerSession: totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0
    });
  } catch (error) {
    res.json({
      totalSessions: 0,
      totalMessages: 0,
      averageMessagesPerSession: 0
    });
  }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/public/index.html'));
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`✓ ARDEN Web Interface running at http://${HOST}:${PORT}`);
  console.log(`✓ AI Provider: ${process.env.AI_PROVIDER || 'openai'}`);
  console.log(`✓ Telegram Bot: ${config.telegram?.enabled ? 'Enabled' : 'Disabled'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
