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
const TODOS_DIR = path.join(NOTES_DIR, 'todos');
const TODO_FILE = path.join(NOTES_DIR, 'todo.md');
const CONSOLIDATE_SCRIPT = path.join(__dirname, '../../scripts/consolidate-todos.sh');

// Available TODO categories/files
const TODO_CATEGORIES = {
  work: path.join(TODOS_DIR, 'work.md'),
  personal: path.join(TODOS_DIR, 'personal.md'),
  'side-projects': path.join(TODOS_DIR, 'side-projects.md')
};

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

// GET /api/todos/categories - Get available TODO categories
router.get('/categories', async (req, res) => {
  try {
    const categories = [];
    
    // Scan todos directory for all .md files
    try {
      await fs.access(TODOS_DIR);
      const files = await fs.readdir(TODOS_DIR);
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(TODOS_DIR, file);
          try {
            const stats = await fs.stat(filePath);
            const content = await fs.readFile(filePath, 'utf-8');
            
            // Count TODOs in this file
            const unchecked = (content.match(/- \[ \]/g) || []).length;
            const checked = (content.match(/- \[x\]/gi) || []).length;
            
            // Convert filename to category id (remove .md and convert to kebab-case)
            const categoryId = file.replace('.md', '');
            const categoryName = categoryId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            
            categories.push({
              id: categoryId,
              name: categoryName,
              filename: file,
              path: filePath,
              todoCount: unchecked + checked,
              unchecked,
              checked,
              modified: stats.mtime,
              exists: true
            });
          } catch (error) {
            logger.system.warn('Failed to read category file', { file, error: error.message });
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist yet
      logger.system.warn('Todos directory does not exist', { error: error.message });
    }
    
    // Sort by name
    categories.sort((a, b) => a.name.localeCompare(b.name));
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    logger.system.error('Failed to get TODO categories', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get categories'
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

// POST /api/todos/categories - Create a new TODO category
router.post('/categories', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }
    
    // Convert name to kebab-case for filename
    const categoryId = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category name'
      });
    }
    
    const categoryFilePath = path.join(TODOS_DIR, `${categoryId}.md`);
    
    // Check if category already exists
    try {
      await fs.access(categoryFilePath);
      return res.status(409).json({
        success: false,
        error: 'Category already exists'
      });
    } catch {
      // File doesn't exist, continue
    }
    
    // Ensure todos directory exists
    await fs.mkdir(TODOS_DIR, { recursive: true });
    
    // Create new category file with header
    const categoryName = name.trim().split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const initialContent = `# ${categoryName} TODOs\n\n`;
    
    await fs.writeFile(categoryFilePath, initialContent, 'utf-8');
    
    logger.system.info('Created new TODO category', { categoryId, name: categoryName });
    
    res.json({
      success: true,
      message: 'Category created successfully',
      category: {
        id: categoryId,
        name: categoryName,
        filename: `${categoryId}.md`,
        path: categoryFilePath
      }
    });
  } catch (error) {
    logger.system.error('Failed to create category', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create category'
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
    const { text, category, targetFile } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'TODO text is required'
      });
    }
    
    // Determine target file
    let targetFilePath;
    if (category) {
      // Use category-based file (supports dynamic categories)
      targetFilePath = path.join(TODOS_DIR, `${category}.md`);
    } else if (targetFile) {
      // Use custom target file (legacy support)
      targetFilePath = path.join(NOTES_DIR, targetFile);
    } else {
      // Default to personal.md
      targetFilePath = path.join(TODOS_DIR, 'personal.md');
    }
    
    // Validate path
    const resolvedPath = path.resolve(targetFilePath);
    const resolvedNotesDir = path.resolve(NOTES_DIR);
    if (!resolvedPath.startsWith(resolvedNotesDir)) {
      return res.status(403).json({
        success: false,
        error: 'Invalid target file path'
      });
    }
    
    // Ensure todos directory exists
    await fs.mkdir(TODOS_DIR, { recursive: true });
    
    // Read existing content or create new file
    let content = '';
    try {
      content = await fs.readFile(targetFilePath, 'utf-8');
    } catch {
      // File doesn't exist, create with basic structure
      const categoryName = (category || 'personal').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      content = `# ${categoryName} TODOs\n\n`;
    }
    
    // Add new TODO at the end
    const newTodo = `- [ ] ${text}\n`;
    content += newTodo;
    
    await fs.writeFile(targetFilePath, content, 'utf-8');
    
    logger.system.info('Created new TODO', { text, category: category || 'default', file: path.basename(targetFilePath) });
    
    // Re-consolidate
    await consolidateTodos();
    
    // Send WebSocket notification
    wsService.notifyTodoUpdate({
      action: 'create',
      text,
      category: category || 'personal',
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'TODO created successfully',
      category: category || 'personal'
    });
  } catch (error) {
    logger.system.error('Failed to create TODO', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create TODO'
    });
  }
});

// DELETE /api/todos/:id - Delete a TODO
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
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
    
    // Delete from source file
    if (todo.sourceFile && todo.sourceLine) {
      const sourceFilePath = path.join(NOTES_DIR, todo.sourceFile);
      const sourceContent = await fs.readFile(sourceFilePath, 'utf-8');
      const lines = sourceContent.split('\n');
      
      // Find the line (sourceLine is 1-based)
      const lineIndex = todo.sourceLine - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        // Remove the TODO line and any source comment line that follows
        lines.splice(lineIndex, 1);
        
        // Check if next line is a source comment and remove it too
        if (lineIndex < lines.length && lines[lineIndex].match(/^\s*\*Source:/)) {
          lines.splice(lineIndex, 1);
        }
        
        await fs.writeFile(sourceFilePath, lines.join('\n'), 'utf-8');
        
        logger.system.info('Deleted TODO', { id, file: todo.sourceFile });
        
        // Re-consolidate to update todo.md
        await consolidateTodos();
        
        // Send WebSocket notification
        wsService.notifyTodoUpdate({
          action: 'delete',
          todoId: id,
          timestamp: new Date().toISOString()
        });
        
        res.json({
          success: true,
          message: 'TODO deleted successfully'
        });
      } else {
        throw new Error('Invalid source line number');
      }
    } else {
      throw new Error('TODO source information missing');
    }
  } catch (error) {
    logger.system.error('Failed to delete TODO', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete TODO'
    });
  }
});

// PUT /api/todos/:id - Update TODO text and/or due date
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, dueDate } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'TODO text is required'
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
        const checkboxState = todo.checked ? '[x]' : '[ ]';
        
        // Build new TODO text with optional due date
        let newText = text.trim();
        if (dueDate) {
          newText += ` 📅 ${dueDate}`;
        }
        
        const newLine = `- ${checkboxState} ${newText}`;
        lines[lineIndex] = newLine;
        
        await fs.writeFile(sourceFilePath, lines.join('\n'), 'utf-8');
        
        logger.system.info('Updated TODO text', { id, text: newText, file: todo.sourceFile });
        
        // Re-consolidate to update todo.md
        await consolidateTodos();
        
        // Send WebSocket notification
        wsService.notifyTodoUpdate({
          action: 'update',
          todoId: id,
          text: newText,
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
      let text = line.replace(/^\s*- \[([ xX])\]\s*/, '').trim();
      
      // Extract due date if present (format: 📅 YYYY-MM-DD or @due YYYY-MM-DD)
      let dueDate = null;
      const dueDateMatch = text.match(/📅\s*(\d{4}-\d{2}-\d{2})|@due\s*(\d{4}-\d{2}-\d{2})/);
      if (dueDateMatch) {
        dueDate = dueDateMatch[1] || dueDateMatch[2];
        // Remove due date from text
        text = text.replace(/📅\s*\d{4}-\d{2}-\d{2}|@due\s*\d{4}-\d{2}-\d{2}/, '').trim();
      }
      
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
        dueDate,
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
