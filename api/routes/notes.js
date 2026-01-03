/**
 * Notes Management Routes (Simplified - No Folder Nav Yet)
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

// Security functions
function sanitizeFilename(filename) {
  const sanitized = path.basename(filename);
  if (!sanitized.endsWith('.md')) {
    throw new Error('Only markdown files are allowed');
  }
  if (/[<>:"|?*\x00-\x1f]/.test(sanitized)) {
    throw new Error('Invalid filename characters');
  }
  return sanitized;
}

function validatePath(filePath) {
  const resolvedPath = path.resolve(filePath);
  const resolvedNotesDir = path.resolve(NOTES_DIR);
  if (!resolvedPath.startsWith(resolvedNotesDir)) {
    throw new Error('Access denied: Path outside notes directory');
  }
  return resolvedPath;
}

// Parse Obsidian front matter (YAML)
function parseFrontMatter(content) {
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontMatterMatch) {
    return { frontMatter: null, content };
  }
  
  const yaml = frontMatterMatch[1];
  const contentWithoutFrontMatter = content.substring(frontMatterMatch[0].length).trim();
  
  // Simple YAML parser for tags
  const tags = [];
  const tagsMatch = yaml.match(/tags:\s*\[(.*?)\]/);
  if (tagsMatch) {
    // Array format: tags: [tag1, tag2, tag3]
    tags.push(...tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')));
  } else {
    // List format: tags:\n  - tag1\n  - tag2
    const tagLines = yaml.match(/tags:\s*\n((?:\s*-\s*.+\n?)+)/);
    if (tagLines) {
      const tagList = tagLines[1].match(/-\s*(.+)/g);
      if (tagList) {
        tags.push(...tagList.map(t => t.replace(/^-\s*/, '').trim()));
      }
    }
  }
  
  return {
    frontMatter: yaml,
    tags: tags.filter(t => t.length > 0),
    content: contentWithoutFrontMatter
  };
}

// GET /api/notes - List all notes
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const sort = req.query.sort || 'modified';
    
    const files = await fs.readdir(NOTES_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('.'));
    
    const fileStats = await Promise.all(
      mdFiles.map(async (filename) => {
        const filePath = path.join(NOTES_DIR, filename);
        try {
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          
          // Parse front matter and tags
          const parsed = parseFrontMatter(content);
          
          const titleMatch = parsed.content.match(/^#\s+(.+)$/m);
          const title = titleMatch ? titleMatch[1] : filename.replace('.md', '');
          const contentWithoutTitle = titleMatch 
            ? parsed.content.substring(parsed.content.indexOf(titleMatch[0]) + titleMatch[0].length).trim()
            : parsed.content;
          const preview = contentWithoutTitle.substring(0, 200).replace(/\n/g, ' ');
          const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
          
          return {
            filename,
            title,
            preview,
            size: stats.size,
            modified: stats.mtime.getTime(),
            created: stats.birthtime.getTime(),
            wordCount,
            tags: parsed.tags,
            path: '~/Notes/'
          };
        } catch (error) {
          return null;
        }
      })
    );
    
    const validFiles = fileStats.filter(f => f !== null);
    
    validFiles.sort((a, b) => {
      switch (sort) {
        case 'name': return a.filename.localeCompare(b.filename);
        case 'size': return b.size - a.size;
        case 'modified':
        default: return b.modified - a.modified;
      }
    });
    
    const paginatedFiles = validFiles.slice(offset, offset + limit);
    
    return res.json({
      success: true,
      notes: paginatedFiles,
      total: validFiles.length,
      offset,
      limit,
      hasMore: offset + limit < validFiles.length
    });
    
  } catch (error) {
    logger.system.error('Failed to list notes', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to list notes'
    });
  }
});

// GET /api/notes/search - Search notes
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const limit = parseInt(req.query.limit) || 20;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query must be at least 2 characters'
      });
    }
    
    const rgCommand = `rg -i --type md --max-count 3 --line-number --no-heading "${query}" "${NOTES_DIR}" 2>/dev/null || true`;
    const { stdout } = await execAsync(rgCommand);
    
    const results = [];
    const processedFiles = new Set();
    
    if (stdout) {
      const lines = stdout.trim().split('\n');
      
      for (const line of lines) {
        const match = line.match(/^(.+):(\d+):(.+)$/);
        if (match) {
          const [, filePath, lineNum, matchedText] = match;
          const filename = path.basename(filePath);
          
          if (!processedFiles.has(filename)) {
            processedFiles.add(filename);
            
            try {
              const stats = await fs.stat(filePath);
              const content = await fs.readFile(filePath, 'utf-8');
              const titleMatch = content.match(/^#\s+(.+)$/m);
              const title = titleMatch ? titleMatch[1] : filename.replace('.md', '');
              const regex = new RegExp(query, 'gi');
              const contentMatches = (content.match(regex) || []).length;
              const filenameMatches = (filename.match(regex) || []).length;
              
              results.push({
                filename,
                title,
                preview: matchedText.trim(),
                size: stats.size,
                modified: stats.mtime.getTime(),
                matches: {
                  content: contentMatches,
                  filename: filenameMatches,
                  total: contentMatches + filenameMatches
                },
                path: '~/Notes/'
              });
            } catch (error) {
              // Skip
            }
          }
        }
      }
    }
    
    results.sort((a, b) => b.matches.total - a.matches.total);
    const limitedResults = results.slice(0, limit);
    
    return res.json({
      success: true,
      query,
      results: limitedResults,
      total: results.length
    });
    
  } catch (error) {
    logger.system.error('Search failed', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// GET /api/notes/stats/overview - Statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const files = await fs.readdir(NOTES_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('.'));
    
    let totalSize = 0;
    let totalWords = 0;
    
    for (const filename of mdFiles.slice(0, 100)) {
      try {
        const filePath = path.join(NOTES_DIR, filename);
        const [content, stats] = await Promise.all([
          fs.readFile(filePath, 'utf-8'),
          fs.stat(filePath)
        ]);
        
        totalSize += stats.size;
        totalWords += content.split(/\s+/).filter(w => w.length > 0).length;
      } catch {
        // Skip
      }
    }
    
    return res.json({
      success: true,
      stats: {
        totalNotes: mdFiles.length,
        totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        avgWords: Math.round(totalWords / Math.min(mdFiles.length, 100)),
        location: NOTES_DIR
      }
    });
    
  } catch (error) {
    logger.system.error('Failed to get stats', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

// ====================================
// TEMPLATE ROUTES
// ====================================

const TEMPLATES_DIR = path.join(process.env.HOME, 'Notes', 'templates');

// GET /api/notes/templates - List available templates
router.get('/templates', async (req, res) => {
  try {
    const files = await fs.readdir(TEMPLATES_DIR);
    const templates = files
      .filter(f => f.endsWith('.md'))
      .map(f => ({
        id: f.replace('.md', ''),
        name: f.replace('.md', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        filename: f
      }));
    
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    logger.system.error('Failed to list templates', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to load templates'
    });
  }
});

// GET /api/notes/templates/:id - Get template content
router.get('/templates/:id', async (req, res) => {
  try {
    const templateId = req.params.id;
    const templateFile = `${templateId}.md`;
    const templatePath = path.join(TEMPLATES_DIR, templateFile);
    
    // Validate template path
    const resolvedPath = path.resolve(templatePath);
    const resolvedTemplatesDir = path.resolve(TEMPLATES_DIR);
    if (!resolvedPath.startsWith(resolvedTemplatesDir)) {
      return res.status(403).json({
        success: false,
        error: 'Invalid template ID'
      });
    }
    
    const content = await fs.readFile(templatePath, 'utf8');
    
    // Replace template variables
    const now = new Date();
    const processedContent = content
      .replace(/\{\{DATE_FULL\}\}/g, now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
      .replace(/\{\{DATE_ISO\}\}/g, now.toISOString().split('T')[0])
      .replace(/\{\{DATE_SHORT\}\}/g, now.toLocaleDateString('en-US'))
      .replace(/\{\{TIME_12H\}\}/g, now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }))
      .replace(/\{\{TIME_24H\}\}/g, now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }))
      .replace(/\{\{DAY_OF_WEEK\}\}/g, now.toLocaleDateString('en-US', { weekday: 'long' }))
      .replace(/\{\{WEEK_NUMBER\}\}/g, getWeekNumber(now))
      .replace(/\{\{MONTH\}\}/g, now.toLocaleDateString('en-US', { month: 'long' }))
      .replace(/\{\{YEAR\}\}/g, now.getFullYear().toString());
      // Note: {{TITLE}} is left as-is for frontend to replace with actual filename
    
    res.json({
      success: true,
      template: {
        id: templateId,
        name: templateId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        content: processedContent
      }
    });
  } catch (error) {
    logger.system.error('Failed to load template', { error: error.message, template: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Template not found'
    });
  }
});

// Helper function to get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// GET /api/notes/:filename - Get note
router.get('/:filename', async (req, res) => {
  try {
    const filename = sanitizeFilename(req.params.filename);
    const filePath = validatePath(path.join(NOTES_DIR, filename));
    
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    
    const [content, stats] = await Promise.all([
      fs.readFile(filePath, 'utf-8'),
      fs.stat(filePath)
    ]);
    
    // Parse front matter
    const parsed = parseFrontMatter(content);
    
    const titleMatch = parsed.content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : filename.replace('.md', '');
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const charCount = content.length;
    const lineCount = content.split('\n').length;
    
    return res.json({
      success: true,
      filename,
      title,
      content,
      frontMatter: parsed.frontMatter,
      tags: parsed.tags,
      metadata: {
        size: stats.size,
        modified: stats.mtime.getTime(),
        created: stats.birthtime.getTime(),
        wordCount,
        charCount,
        lineCount
      }
    });
    
  } catch (error) {
    logger.system.error('Failed to get note', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to get note'
    });
  }
});

// PUT /api/notes/:filename - Update note
router.put('/:filename', async (req, res) => {
  try {
    const filename = sanitizeFilename(req.params.filename);
    const filePath = validatePath(path.join(NOTES_DIR, filename));
    const { content } = req.body;
    
    if (typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Content must be a string'
      });
    }
    
    if (content.length > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'File too large (max 10MB)'
      });
    }
    
    await fs.writeFile(filePath, content, 'utf-8');
    const stats = await fs.stat(filePath);
    
    // Send WebSocket notification
    wsService.notifyNoteUpdate({
      action: 'update',
      filename,
      timestamp: new Date().toISOString()
    });
    
    return res.json({
      success: true,
      filename,
      message: 'Note saved successfully',
      metadata: {
        size: stats.size,
        modified: stats.mtime.getTime()
      }
    });
    
  } catch (error) {
    logger.system.error('Failed to update note', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to save note'
    });
  }
});

// POST /api/notes - Create note
router.post('/', async (req, res) => {
  try {
    const { filename, content = '' } = req.body;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename is required'
      });
    }
    
    const sanitized = sanitizeFilename(filename);
    const filePath = validatePath(path.join(NOTES_DIR, sanitized));
    
    try {
      await fs.access(filePath);
      return res.status(409).json({
        success: false,
        error: 'Note already exists'
      });
    } catch {
      // File doesn't exist, good
    }
    
    await fs.writeFile(filePath, content, 'utf-8');
    const stats = await fs.stat(filePath);
    
    // Send WebSocket notification
    wsService.notifyNoteUpdate({
      action: 'create',
      filename: sanitized,
      timestamp: new Date().toISOString()
    });
    
    return res.json({
      success: true,
      filename: sanitized,
      message: 'Note created successfully',
      metadata: {
        size: stats.size,
        created: stats.birthtime.getTime()
      }
    });
    
  } catch (error) {
    logger.system.error('Failed to create note', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to create note'
    });
  }
});

// DELETE /api/notes/:filename - Delete note
router.delete('/:filename', async (req, res) => {
  try {
    const filename = sanitizeFilename(req.params.filename);
    const filePath = validatePath(path.join(NOTES_DIR, filename));
    
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    
    await fs.unlink(filePath);
    
    // Send WebSocket notification
    wsService.notifyNoteUpdate({
      action: 'delete',
      filename,
      timestamp: new Date().toISOString()
    });
    
    return res.json({
      success: true,
      filename,
      message: 'Note deleted successfully'
    });
    
  } catch (error) {
    logger.system.error('Failed to delete note', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to delete note'
    });
  }
});

// PATCH /api/notes/:filename - Rename note
router.patch('/:filename', async (req, res) => {
  try {
    const oldFilename = sanitizeFilename(req.params.filename);
    const { newFilename } = req.body;
    
    if (!newFilename) {
      return res.status(400).json({
        success: false,
        error: 'New filename is required'
      });
    }
    
    const newFilename_sanitized = sanitizeFilename(newFilename);
    const oldPath = validatePath(path.join(NOTES_DIR, oldFilename));
    const newPath = validatePath(path.join(NOTES_DIR, newFilename_sanitized));
    
    // Check if old file exists
    try {
      await fs.access(oldPath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    
    // Check if new filename already exists
    try {
      await fs.access(newPath);
      return res.status(409).json({
        success: false,
        error: 'A note with that name already exists'
      });
    } catch {
      // Good, doesn't exist
    }
    
    // Rename the file
    await fs.rename(oldPath, newPath);
    
    logger.system.info('Note renamed', { oldFilename, newFilename: newFilename_sanitized });
    
    // Send WebSocket notification
    wsService.notifyNoteUpdate({
      action: 'rename',
      oldFilename,
      newFilename: newFilename_sanitized,
      timestamp: new Date().toISOString()
    });
    
    return res.json({
      success: true,
      oldFilename,
      newFilename: newFilename_sanitized,
      message: 'Note renamed successfully'
    });
    
  } catch (error) {
    logger.system.error('Failed to rename note', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to rename note'
    });
  }
});

/**
 * POST /api/notes/upload
 * Upload an image file for use in notes
 */
const multer = require('multer');
const crypto = require('crypto');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const attachmentsDir = path.join(NOTES_DIR, 'attachments');
    try {
      await fs.mkdir(attachmentsDir, { recursive: true });
      cb(null, attachmentsDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename while preserving extension
    const ext = path.extname(file.originalname);
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, `${randomName}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Only allow image files
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP, SVG)'));
    }
  }
});

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    // Return the relative path for markdown
    const relativePath = `attachments/${req.file.filename}`;
    
    logger.system.info('Image uploaded', { 
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size 
    });
    
    return res.json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: relativePath,
      size: req.file.size,
      markdown: `![${req.file.originalname}](${relativePath})`
    });
    
  } catch (error) {
    logger.system.error('Failed to upload image', { error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload image'
    });
  }
});

module.exports = router;
