/**
 * TODO Management Routes
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('../utils/logger');
const wsService = require('../services/websocket');

const execAsync = promisify(exec);
const NOTES_DIR = path.join(process.env.HOME, 'Notes');
const TODO_FILE = path.join(NOTES_DIR, 'todo.md');
const CONSOLIDATE_SCRIPT = path.join(__dirname, '../../scripts/consolidate-todos.sh');

// GET /api/todos - Get all TODOs (parsed from consolidated todo.md)
router.get('/', async (req, res) => {
  try {
    // Check if todo.md exists
    try {
      await fs.access(TODO_FILE);
    } catch {
      // If todo.md doesn't exist, run consolidation first
      await consolidateTodos();
    }
    
    const content = await fs.readFile(TODO_FILE, 'utf-8');
    const todos = parseTodoFile(content);
    
    logger.system.info('Parsed TODO stats', { stats: todos.stats });
    
    res.json({
      success: true,
      todos,
      lastUpdated: todos.lastUpdated,
      stats: todos.stats
    });
  } catch (error) {
    logger.system.error('Failed to get TODOs', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to load TODOs'
    });
  }
});

// POST /api/todos/consolidate - Trigger TODO consolidation
router.post('/consolidate', async (req, res) => {
  try {
    logger.system.info('Consolidating TODOs');
    const result = await consolidateTodos();
    
    // Re-read the file to get updated TODOs
    const content = await fs.readFile(TODO_FILE, 'utf-8');
    const todos = parseTodoFile(content);
    
    res.json({
      success: true,
      message: 'TODOs consolidated successfully',
      todos,
      stats: todos.stats
    });
  } catch (error) {
    logger.system.error('Failed to consolidate TODOs', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to consolidate TODOs'
    });
  }
});

// PATCH /api/todos/:id - Update a TODO status
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { checked } = req.body;
    
    if (typeof checked !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid checked value'
      });
    }
    
    // Read todo.md
    const content = await fs.readFile(TODO_FILE, 'utf-8');
    const todos = parseTodoFile(content);
    
    // Find the TODO
    const todo = todos.items.find(t => t.id === id);
    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'TODO not found'
      });
    }
    
    // Update the source file
    if (todo.sourceFile && todo.sourceLine) {
      const sourceFilePath = path.join(NOTES_DIR, todo.sourceFile);
      const sourceContent = await fs.readFile(sourceFilePath, 'utf-8');
      const lines = sourceContent.split('\n');
      
      // Find the line (sourceLine is 1-based)
      const lineIndex = todo.sourceLine - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const oldLine = lines[lineIndex];
        const newLine = checked 
          ? oldLine.replace(/- \[ \]/, '- [x]')
          : oldLine.replace(/- \[x\]/i, '- [ ]');
        
        lines[lineIndex] = newLine;
        await fs.writeFile(sourceFilePath, lines.join('\n'), 'utf-8');
        
        logger.system.info('Updated TODO', { id, checked, file: todo.sourceFile });
        
        // Re-consolidate to update todo.md
        await consolidateTodos();
        
        // Send WebSocket notification
        wsService.notifyTodoUpdate({
          action: 'toggle',
          todoId: id,
          checked,
          timestamp: new Date().toISOString()
        });
        
        res.json({
          success: true,
          message: 'TODO updated successfully'
        });
      } else {
        throw new Error('Invalid source line number');
      }
    } else {
      throw new Error('TODO source information missing');
    }
  } catch (error) {
    logger.system.error('Failed to update TODO', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update TODO'
    });
  }
});

// POST /api/todos - Create a new TODO
router.post('/', async (req, res) => {
  try {
    const { text, targetFile } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'TODO text is required'
      });
    }
    
    // Default target file is todo.md
    const targetFilePath = targetFile 
      ? path.join(NOTES_DIR, targetFile)
      : TODO_FILE;
    
    // Validate path
    const resolvedPath = path.resolve(targetFilePath);
    const resolvedNotesDir = path.resolve(NOTES_DIR);
    if (!resolvedPath.startsWith(resolvedNotesDir)) {
      return res.status(403).json({
        success: false,
        error: 'Invalid target file path'
      });
    }
    
    // Read existing content or create new file
    let content = '';
    try {
      content = await fs.readFile(targetFilePath, 'utf-8');
    } catch {
      // File doesn't exist, create with basic structure
      content = `# TODOs\n\n`;
    }
    
    // Add new TODO at the end
    const newTodo = `- [ ] ${text}\n`;
    content += newTodo;
    
    await fs.writeFile(targetFilePath, content, 'utf-8');
    
    logger.system.info('Created new TODO', { text, file: path.basename(targetFilePath) });
    
    // Re-consolidate
    await consolidateTodos();
    
    // Send WebSocket notification
    wsService.notifyTodoUpdate({
      action: 'create',
      text,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'TODO created successfully'
    });
  } catch (error) {
    logger.system.error('Failed to create TODO', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create TODO'
    });
  }
});

// Helper function to run consolidation script
async function consolidateTodos() {
  try {
    const { stdout, stderr } = await execAsync(`bash "${CONSOLIDATE_SCRIPT}"`);
    logger.system.info('TODO consolidation completed', { 
      stdout: stdout.substring(0, 200) 
    });
    return { stdout, stderr };
  } catch (error) {
    logger.system.error('TODO consolidation failed', { error: error.message });
    throw error;
  }
}

// Helper function to parse todo.md file
function parseTodoFile(content) {
  const items = [];
  const lines = content.split('\n');
  
  let lastUpdated = null;
  let stats = {
    total: 0,
    unchecked: 0,
    checked: 0,
    filesWithTodos: 0
  };
  
  let currentSource = null;
  let currentSourceLine = null;
  let idCounter = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Extract last updated timestamp
    if (line.includes('Last updated:')) {
      const match = line.match(/Last updated:\s*(.+)/);
      if (match) lastUpdated = match[1].trim();
    }
    
    // Extract stats (handle optional leading dash and spaces)
    if (line.includes('Total TODO items found')) {
      const match = line.match(/\*\*Total TODO items found\*\*:\s*(\d+)/);
      if (match) stats.total = parseInt(match[1]);
    }
    if (line.includes('Unchecked items')) {
      const match = line.match(/\*\*Unchecked items\*\*:\s*(\d+)/);
      if (match) stats.unchecked = parseInt(match[1]);
    }
    if (line.includes('Checked items')) {
      const match = line.match(/\*\*Checked items\*\*:\s*(\d+)/);
      if (match) stats.checked = parseInt(match[1]);
    }
    if (line.includes('Files with TODOs')) {
      const match = line.match(/\*\*Files with TODOs\*\*:\s*(\d+)/);
      if (match) stats.filesWithTodos = parseInt(match[1]);
    }
    
    // Extract source file header
    if (line.startsWith('## 📄 ')) {
      currentSource = line.replace('## 📄 ', '').trim();
    }
    
    // Extract TODO items
    if (line.match(/^\s*- \[([ xX])\]/)) {
      const checked = line.match(/- \[x\]/i) !== null;
      const text = line.replace(/^\s*- \[([ xX])\]\s*/, '').trim();
      
      // Look for source reference on next line
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const sourceMatch = nextLine.match(/\*Source:\s*(.+?):(\d+)\*/);
        if (sourceMatch) {
          currentSource = sourceMatch[1];
          currentSourceLine = parseInt(sourceMatch[2]);
        }
      }
      
      // Skip TODOs from templates, temp files, and example directories
      if (currentSource && (
        currentSource.includes('templates/') || 
        currentSource.includes('.claude/') ||
        currentSource.toLowerCase().includes('template') ||
        currentSource.match(/^\.null-ls_/) || // Editor temp files
        currentSource.match(/^\.\w+_\d+/) // Other temp files like .null-ls_123456_file.md
      )) {
        currentSourceLine = null;
        continue;
      }
      
      // Check if TODO is from a completed/archived file
      const isArchived = currentSource && (
        currentSource.includes('-Completed') ||
        currentSource.includes('-completed') ||
        currentSource.includes('-Archive') ||
        currentSource.includes('-archive')
      );
      
      items.push({
        id: `todo-${idCounter++}`,
        text,
        checked,
        sourceFile: currentSource,
        sourceLine: currentSourceLine,
        isArchived: isArchived || checked // Mark as archived if from completed file OR checked
      });
      
      currentSourceLine = null; // Reset for next item
    }
  }
  
  return {
    items,
    lastUpdated,
    stats
  };
}

module.exports = router;
