/**
 * ARDEN Notes Management
 * 
 * Frontend JavaScript for notes browser and editor
 */

// State
let currentNotes = [];
let currentFolders = [];
let currentPath = '/';
let currentOffset = 0;
let currentLimit = 50;
let currentSort = 'modified';
let hasMore = false;
let currentNote = null;
let currentView = 'edit'; // edit, preview, split
let isDirty = false;
let autoSaveTimer = null;
let autoSaveEnabled = true;
let navigationHistory = []; // Stack of previously viewed notes
let navigationHistoryIndex = -1; // Current position in history
let searchTimer = null; // Debounce timer for live search

// CodeMirror editor instance
let codeMirrorEditor = null;

// Editor settings (persisted in localStorage)
let editorSettings = {
  vimMode: false,
  lineNumbers: true,
  lineWrapping: true,
  highlightActiveLine: true,
  autoCloseBrackets: false
};

// API Base URL
const API_BASE = '/api/notes';

// DOM Elements
const browserView = document.getElementById('browserView');
const editorView = document.getElementById('editorView');
const notesContainer = document.getElementById('notesContainer');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const sortSelect = document.getElementById('sortSelect');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loadMoreContainer = document.getElementById('loadMoreContainer');
const statsContainer = document.getElementById('statsContainer');
const newNoteBtn = document.getElementById('newNoteBtn');
const backToListBtn = document.getElementById('backToListBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const saveBtn = document.getElementById('saveBtn');
const editorTitle = document.getElementById('editorTitle');
const editorPath = document.getElementById('editorPath');
const editorContent = document.getElementById('editorContent');
const editorStats = document.getElementById('editorStats');
const saveStatus = document.getElementById('saveStatus');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadEditorSettings();
  loadNotes();
  loadStats();
  setupEventListeners();
  setupWebSocketListeners();
  initTheme();
  setupEditorSettingsModal();
});

// Setup Event Listeners
function setupEventListeners() {
  // Search
  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
  
  // Clear search button
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', clearSearch);
  }
  
  // Live search as you type
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    // Show/hide clear button
    if (clearSearchBtn) {
      if (query.length > 0) {
        clearSearchBtn.classList.add('visible');
      } else {
        clearSearchBtn.classList.remove('visible');
      }
    }
    
    // Clear the existing timer
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    
    // If search is empty, reload all notes immediately
    if (query === '') {
      currentOffset = 0;
      loadNotes();
      loadStats();
      return;
    }
    
    // If query is at least 2 characters, search after 300ms delay
    if (query.length >= 2) {
      searchTimer = setTimeout(() => {
        handleSearch();
      }, 300);
    }
  });
  
  // Sort
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    currentOffset = 0;
    loadNotes();
  });
  
  // Load More
  loadMoreBtn.addEventListener('click', () => {
    currentOffset += currentLimit;
    loadNotes(true); // append mode
  });
  
  // New Note
  newNoteBtn.addEventListener('click', createNewNote);
  
  // Back to List
  if (backToListBtn) {
    backToListBtn.addEventListener('click', closeEditor);
  }
  
  // Editor Actions
  cancelEditBtn.addEventListener('click', closeEditor);
  saveBtn.addEventListener('click', saveCurrentNote);
  
  // Editor Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabName = e.target.dataset.tab;
      switchTab(tabName);
    });
  });
  
  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S = Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (!editorView.classList.contains('hidden')) {
        saveCurrentNote();
      }
    }
    
    // Escape = Close editor
    if (e.key === 'Escape') {
      if (!editorView.classList.contains('hidden')) {
        closeEditor();
      }
    }
    
    // Alt + Left = Navigate back
    if (e.altKey && e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateBack();
    }
    
    // Alt + Right = Navigate forward
    if (e.altKey && e.key === 'ArrowRight') {
      e.preventDefault();
      navigateForward();
    }
  });
  
  // Warn before leaving with unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
  
  // Auto-save toggle
  const autoSaveToggle = document.getElementById('autoSaveToggle');
  if (autoSaveToggle) {
    autoSaveToggle.addEventListener('change', (e) => {
      autoSaveEnabled = e.target.checked;
      console.log('Auto-save:', autoSaveEnabled ? 'enabled' : 'disabled');
    });
  }
  
  // Image upload
  const insertImageBtn = document.getElementById('insertImageBtn');
  const imageUploadInput = document.getElementById('imageUploadInput');
  
  if (insertImageBtn && imageUploadInput) {
    insertImageBtn.addEventListener('click', () => {
      imageUploadInput.click();
    });
    
    imageUploadInput.addEventListener('change', handleImageUpload);
  }
  
  // Export button
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', showExportMenu);
  }
}

// Load Notes List
async function loadNotes(append = false) {
  try {
    if (!append) {
      notesContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading notes...</p></div>';
    }
    
    const response = await fetch(`${API_BASE}?limit=${currentLimit}&offset=${currentOffset}&sort=${currentSort}`, {
      credentials: 'include'
    });
    
    // Check if we got redirected to login
    if (response.redirected || response.url.includes('/login.html')) {
      window.location.href = '/login.html';
      return;
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      window.location.href = '/login.html';
      return;
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load notes');
    }
    
    if (append) {
      currentNotes = [...currentNotes, ...data.notes];
    } else {
      currentNotes = data.notes;
    }
    
    hasMore = data.hasMore;
    
    renderNotes(append);
    updateLoadMore();
    
  } catch (error) {
    console.error('Failed to load notes:', error);
    notesContainer.innerHTML = `<div class="error">Failed to load notes: ${error.message}</div>`;
  }
}

// Render Notes List
function renderNotes(append = false) {
  if (currentNotes.length === 0) {
    notesContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h2>No notes found</h2>
        <p>Create your first note to get started!</p>
      </div>
    `;
    return;
  }
  
  const html = currentNotes.map(note => `
    <div class="note-card bg-surface border border-border rounded-lg p-4 cursor-pointer hover:border-primary hover:shadow-lg transition-all" data-filename="${note.filename}">
      <div class="mb-3">
        <div class="font-semibold text-lg tn-text-main mb-1 line-clamp-2">${escapeHtml(note.title)}</div>
        <div class="text-xs tn-text-tertiary font-mono">📄 ${escapeHtml(note.filename)}</div>
        ${note.tags && note.tags.length > 0 ? `
          <div class="flex flex-wrap gap-1 mt-2">
            ${note.tags.map(tag => `<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30">#${escapeHtml(tag)}</span>`).join(' ')}
          </div>
        ` : ''}
      </div>
      <div class="tn-text-secondary text-sm mb-3 line-clamp-2">${escapeHtml(note.preview)}${note.preview.length >= 200 ? '...' : ''}</div>
      <div class="flex flex-wrap gap-3 text-xs tn-text-tertiary mb-3">
        <span>📅 ${formatDate(note.modified)}</span>
        <span>📊 ${note.wordCount} words</span>
        <span>💾 ${formatBytes(note.size)}</span>
      </div>
      <div class="note-actions flex flex-wrap gap-2">
        <button class="px-3 py-1 rounded bg-primary hover:bg-opacity-80 text-background text-sm font-medium transition-colors" onclick="event.stopPropagation(); openNote('${escapeJs(note.filename)}')">Open</button>
        <button class="px-3 py-1 rounded bg-border hover:bg-opacity-80 tn-text-main text-sm transition-colors" onclick="event.stopPropagation(); editNote('${escapeJs(note.filename)}')">Edit</button>
        <button class="px-3 py-1 rounded bg-border hover:bg-opacity-80 tn-text-main text-sm transition-colors" onclick="event.stopPropagation(); renameNote('${escapeJs(note.filename)}')">Rename</button>
        <button class="px-3 py-1 rounded bg-danger hover:bg-opacity-80 text-background text-sm transition-colors" onclick="event.stopPropagation(); deleteNote('${escapeJs(note.filename)}')">Delete</button>
      </div>
    </div>
  `).join('');
  
  if (append) {
    notesContainer.innerHTML += html;
  } else {
    notesContainer.innerHTML = html;
  }
  
  // Add click event listeners to all note cards
  document.querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking on a button or the actions area
      if (e.target.tagName === 'BUTTON' || e.target.closest('.note-actions')) {
        return;
      }
      const filename = card.dataset.filename;
      openNote(filename);
    });
  });
}

// Update Load More Button
function updateLoadMore() {
  if (hasMore) {
    loadMoreContainer.classList.remove('hidden');
  } else {
    loadMoreContainer.classList.add('hidden');
  }
}

// Load Statistics
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/stats/overview`, {
      credentials: 'include'
    });
    
    // Check if we got redirected to login
    if (response.redirected || response.url.includes('/login.html')) {
      // Don't redirect here, let loadNotes handle it
      return;
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Likely redirected to login, skip stats
      return;
    }
    
    const data = await response.json();
    
    if (data.success) {
      statsContainer.innerHTML = `
        <span>📁 ${data.stats.totalNotes} notes</span>
        <span>💾 ${data.stats.totalSizeMB} MB</span>
        <span>📊 ~${data.stats.avgWords} words/note</span>
        <span>📍 ${data.stats.location}</span>
      `;
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
    // Don't show error in UI, stats are not critical
  }
}

// Search Notes
async function handleSearch() {
  const query = searchInput.value.trim();
  
  if (query.length < 2) {
    // For live search, just return silently if query is too short
    return;
  }
  
  try {
    notesContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>Searching...</p></div>';
    
    const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, {
      credentials: 'include'
    });
    
    // Check if we got redirected to login
    if (response.redirected || response.url.includes('/login.html')) {
      window.location.href = '/login.html';
      return;
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      window.location.href = '/login.html';
      return;
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Search failed');
    }
    
    currentNotes = data.results;
    hasMore = false;
    
    if (data.results.length === 0) {
      notesContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h2>No results found</h2>
          <p>No notes match "${escapeHtml(query)}"</p>
        </div>
      `;
    } else {
      renderNotes();
      statsContainer.innerHTML = `
        <span>🔍 Found ${data.total} results for "${escapeHtml(query)}"</span>
      `;
    }
    
    updateLoadMore();
    
  } catch (error) {
    console.error('Search failed:', error);
    notesContainer.innerHTML = `<div class="error">Search failed: ${error.message}</div>`;
  }
}

// Clear Search
function clearSearch() {
  searchInput.value = '';
  if (clearSearchBtn) {
    clearSearchBtn.classList.remove('visible');
  }
  currentOffset = 0;
  loadNotes();
  loadStats();
  searchInput.focus();
}

// Open Note (View Mode)
async function openNote(filename) {
  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(filename)}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load note');
    }
    
    currentNote = data;
    isDirty = false;
    addToHistory(filename);
    
    showEditor('preview');
    
  } catch (error) {
    console.error('Failed to open note:', error);
    alert(`Failed to open note: ${error.message}`);
  }
}

// Edit Note
async function editNote(filename) {
  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(filename)}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load note');
    }
    
    currentNote = data;
    isDirty = false;
    addToHistory(filename);
    
    showEditor('split');
    
  } catch (error) {
    console.error('Failed to edit note:', error);
    alert(`Failed to edit note: ${error.message}`);
  }
}

// Create New Note
async function createNewNote() {
  // Show template selection modal
  const useTemplate = await showTemplateSelector();
  
  if (useTemplate === null) return; // User cancelled
  
  const filename = prompt('Enter note filename (e.g., my-note.md):');
  
  if (!filename) return;
  
  // Ensure .md extension
  const sanitized = filename.endsWith('.md') ? filename : `${filename}.md`;
  
  let content = `# ${sanitized.replace('.md', '')}\n\n`;
  
  // Load template content if selected
  if (useTemplate) {
    try {
      const response = await fetch(`${API_BASE}/templates/${useTemplate}`);
      const data = await response.json();
      if (data.success) {
        // Replace {{TITLE}} with the note filename (without .md extension)
        const title = sanitized.replace('.md', '');
        content = data.template.content.replace(/\{\{TITLE\}\}/g, title);
      }
    } catch (error) {
      console.error('Failed to load template:', error);
      // Continue with blank note if template fails
    }
  }
  
  currentNote = {
    filename: sanitized,
    title: sanitized.replace('.md', ''),
    content: content,
    metadata: {
      wordCount: 0,
      charCount: 0,
      lineCount: 1
    }
  };
  
  isDirty = true;
  showEditor('split');
}

// Show Editor
function showEditor(defaultTab = 'edit') {
  browserView.classList.add('hidden');
  editorView.classList.remove('hidden');
  
  editorTitle.textContent = currentNote.title;
  
  // Build path with tags if available
  let pathHTML = `~/Notes/${currentNote.filename}`;
  if (currentNote.tags && currentNote.tags.length > 0) {
    pathHTML += ` <span style="margin-left: 1rem;">`;
    pathHTML += currentNote.tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join(' ');
    pathHTML += `</span>`;
  }
  editorPath.innerHTML = pathHTML;
  
  // Show front matter info if present
  if (currentNote.frontMatter) {
    const fmNote = document.createElement('div');
    fmNote.className = 'front-matter-note';
    fmNote.innerHTML = `
      <small style="color: #999;">
        📋 Front matter detected 
        <span style="cursor: pointer; color: #3498db;" onclick="alert('Front matter:\\n\\n${escapeHtml(currentNote.frontMatter).replace(/\n/g, '\\n')}')">(view)</span>
      </small>
    `;
    editorPath.parentElement.appendChild(fmNote);
  }
  
  switchTab(defaultTab);
  updateSaveStatus();
}

// Switch Editor Tab
function switchTab(tabName) {
  currentView = tabName;
  
  // Update tab UI
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    }
  });
  
  // Destroy existing CodeMirror instance
  destroyCodeMirror();
  
  // Render editor content
  if (tabName === 'edit') {
    editorContent.style.display = '';
    editorContent.innerHTML = `
      <div class="editor-pane" style="flex: 1;" id="editorPane"></div>
    `;
    const pane = document.getElementById('editorPane');
    codeMirrorEditor = initCodeMirror(pane, currentNote.content);
  } else if (tabName === 'preview') {
    editorContent.style.display = '';
    editorContent.innerHTML = `
      <div class="editor-pane preview-pane" style="flex: 1;">
        <div class="preview-content" id="previewContent"></div>
      </div>
    `;
    renderPreview();
  } else if (tabName === 'split') {
    editorContent.style.display = 'flex';
    editorContent.style.flexDirection = 'row';
    editorContent.innerHTML = `
      <div class="editor-pane" style="flex: 1; overflow: auto;" id="editorPane"></div>
      <div class="editor-pane preview-pane" style="flex: 1; overflow: auto;">
        <div class="preview-content" id="previewContent"></div>
      </div>
    `;
    const pane = document.getElementById('editorPane');
    codeMirrorEditor = initCodeMirror(pane, currentNote.content);
    renderPreview();
  }
  
  if (codeMirrorEditor) {
    updateEditorStats();
  }
}

// Setup Editor Listeners
function setupEditorListeners() {
  // CodeMirror handles its own listeners now
  // This function is kept for backward compatibility
  updateEditorStats();
}

// Trigger Auto-Save (debounced)
function triggerAutoSave() {
  if (!autoSaveEnabled) return;
  
  // Clear existing timer
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }
  
  // Set new timer - save after 2 seconds of inactivity
  autoSaveTimer = setTimeout(() => {
    if (isDirty && currentNote) {
      saveCurrentNote(true); // true = auto-save mode
    }
  }, 2000);
}

// Render Markdown Preview
function renderPreview() {
  const previewContent = document.getElementById('previewContent');
  if (!previewContent) return;
  
  // Configure marked with GitHub Flavored Markdown
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Convert \n to <br>
    headerIds: true,
    mangle: false,
    sanitize: false // We'll use DOMPurify instead
  });
  
  // Configure marked to open links in new tabs
  const renderer = new marked.Renderer();
  const originalLinkRenderer = renderer.link.bind(renderer);
  renderer.link = (href, title, text) => {
    const html = originalLinkRenderer(href, title, text);
    // Make external links open in new tab
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return html.replace('<a', '<a target="_blank" rel="noopener noreferrer"');
    }
    return html;
  };
  
  marked.setOptions({ renderer });
  
  // Process wiki-style links [[Page Name]]
  let content = currentNote.content;
  content = content.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
    // Convert to markdown link with data attribute
    const filename = linkText.endsWith('.md') ? linkText : `${linkText}.md`;
    return `[${escapeHtml(linkText)}](#wiki:${escapeHtml(filename)})`;
  });
  
  const html = marked.parse(content);
  const clean = DOMPurify.sanitize(html, {
    ADD_ATTR: ['target', 'rel'] // Allow target and rel attributes
  });
  previewContent.innerHTML = clean;
  
  // Add click handlers for wiki links
  previewContent.querySelectorAll('a[href^="#wiki:"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const filename = link.getAttribute('href').substring(6); // Remove "#wiki:" prefix
      openNoteByName(filename);
    });
    link.classList.add('wiki-link');
  });
}

// Open note by name (for wiki links)
async function openNoteByName(filename) {
  try {
    // Check if file exists by trying to load it
    const response = await fetch(`${API_BASE}/${encodeURIComponent(filename)}`);
    const data = await response.json();
    
    if (data.success) {
      // Close current editor if open
      if (!editorView.classList.contains('hidden')) {
        if (isDirty) {
          const confirmed = confirm('You have unsaved changes. Save before opening another note?');
          if (confirmed) {
            await saveCurrentNote();
          }
        }
      }
      
      // Open the linked note
      currentNote = data;
      isDirty = false;
      addToHistory(filename);
      showEditor('split');
    } else {
      // Note doesn't exist - offer to create it
      const create = confirm(`Note "${filename}" doesn't exist. Create it?`);
      if (create) {
        currentNote = {
          filename,
          title: filename.replace('.md', ''),
          content: `# ${filename.replace('.md', '')}\n\n`,
          metadata: {
            wordCount: 0,
            charCount: 0,
            lineCount: 1
          }
        };
        isDirty = true;
        addToHistory(filename);
        showEditor('split');
      }
    }
  } catch (error) {
    console.error('Failed to open linked note:', error);
    alert(`Failed to open note: ${error.message}`);
  }
}

// Update Editor Stats
function updateEditorStats() {
  const content = currentNote.content;
  const words = content.split(/\s+/).filter(w => w.length > 0).length;
  const chars = content.length;
  const lines = content.split('\n').length;
  
  editorStats.innerHTML = `
    <span>Words: ${words}</span>
    <span>Characters: ${chars}</span>
    <span>Lines: ${lines}</span>
  `;
}

// Update Save Status
function updateSaveStatus() {
  if (isDirty) {
    saveStatus.textContent = 'Unsaved changes *';
    saveStatus.classList.add('unsaved');
  } else {
    saveStatus.textContent = 'Saved';
    saveStatus.classList.remove('unsaved');
  }
}

// Save Current Note
async function saveCurrentNote(isAutoSave = false) {
  try {
    if (!isDirty) return; // Nothing to save
    
    if (!isAutoSave) {
      saveStatus.textContent = 'Saving...';
    } else {
      saveStatus.textContent = 'Auto-saving...';
    }
    
    const isNew = !currentNote.metadata || !currentNote.metadata.modified;
    const url = isNew ? API_BASE : `${API_BASE}/${encodeURIComponent(currentNote.filename)}`;
    const method = isNew ? 'POST' : 'PUT';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: currentNote.filename,
        content: currentNote.content
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to save note');
    }
    
    isDirty = false;
    
    // Update metadata if this was a new note
    if (isNew) {
      currentNote.metadata = data.metadata;
    }
    
    updateSaveStatus();
    
    // Show success message briefly (only for manual saves)
    if (!isAutoSave) {
      saveStatus.textContent = '✓ Saved successfully';
      setTimeout(() => {
        updateSaveStatus();
      }, 2000);
    }
    
  } catch (error) {
    console.error('Failed to save note:', error);
    saveStatus.textContent = '✗ Save failed';
    if (!isAutoSave) {
      alert(`Failed to save note: ${error.message}`);
    }
  }
}

// Close Editor
function closeEditor() {
  if (isDirty) {
    const confirmed = confirm('You have unsaved changes. Are you sure you want to close?');
    if (!confirmed) return;
  }
  
  editorView.classList.add('hidden');
  browserView.classList.remove('hidden');
  
  currentNote = null;
  isDirty = false;
  currentView = 'edit';
  
  // Reload notes list
  currentOffset = 0;
  loadNotes();
  loadStats();
}

// Delete Note
async function deleteNote(filename) {
  const confirmed = confirm(`Are you sure you want to delete "${filename}"?\n\nThis action cannot be undone.`);
  
  if (!confirmed) return;
  
  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(filename)}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete note');
    }
    
    // Reload notes list
    currentOffset = 0;
    loadNotes();
    loadStats();
    
    // Show success message
    alert(`Note "${filename}" deleted successfully`);
    
  } catch (error) {
    console.error('Failed to delete note:', error);
    alert(`Failed to delete note: ${error.message}`);
  }
}

// Rename Note
async function renameNote(filename) {
  const newName = prompt(`Rename "${filename}" to:`, filename);
  
  if (!newName || newName === filename) return;
  
  // Ensure .md extension
  const newFilename = newName.endsWith('.md') ? newName : `${newName}.md`;
  
  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(filename)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newFilename: newFilename
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to rename note');
    }
    
    // Reload notes list
    currentOffset = 0;
    loadNotes();
    loadStats();
    
    // Show success message
    alert(`Note renamed from "${filename}" to "${data.newFilename}"`);
    
  } catch (error) {
    console.error('Failed to rename note:', error);
    alert(`Failed to rename note: ${error.message}`);
  }
}

// Image Upload
async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }
  
  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    alert('Image file is too large. Maximum size is 10MB');
    return;
  }
  
  try {
    // Show uploading status in save status
    const originalStatus = saveStatus.textContent;
    saveStatus.textContent = 'Uploading image...';
    
    // Create form data
    const formData = new FormData();
    formData.append('image', file);
    
    // Upload to server
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to upload image');
    }
    
    // Insert markdown at cursor position
    if (codeMirrorEditor) {
      const cursor = codeMirrorEditor.getCursor();
      const line = codeMirrorEditor.getLine(cursor.line);
      
      // Add newlines if needed
      const prefix = line === '' ? '' : '\n\n';
      const suffix = '\n\n';
      
      codeMirrorEditor.replaceRange(prefix + data.markdown + suffix, cursor);
      
      // Move cursor after inserted text
      const newLine = cursor.line + (prefix ? 2 : 0) + 1;
      codeMirrorEditor.setCursor(newLine, 0);
      codeMirrorEditor.focus();
      
      // Mark as dirty and trigger preview update
      isDirty = true;
      currentNote.content = codeMirrorEditor.getValue();
      updateSaveStatus();
      if (currentView === 'split' || currentView === 'preview') {
        renderPreview();
      }
      triggerAutoSave();
    }
    
    console.log('Image uploaded:', data.filename);
    saveStatus.textContent = originalStatus;
    
  } catch (error) {
    console.error('Failed to upload image:', error);
    alert(`Failed to upload image: ${error.message}`);
    saveStatus.textContent = originalStatus;
  } finally {
    // Clear file input so same file can be uploaded again
    event.target.value = '';
  }
}

// Export Functions
function showExportMenu() {
  if (!currentNote) {
    alert('No note is currently open');
    return;
  }
  
  const formats = [
    { id: 'markdown', name: 'Markdown (Clean)', desc: 'Remove front matter and export clean markdown' },
    { id: 'markdown-full', name: 'Markdown (Full)', desc: 'Export with front matter intact' },
    { id: 'hugo', name: 'Hugo Post', desc: 'Format for Hugo static site generator' },
    { id: 'jekyll', name: 'Jekyll Post', desc: 'Format for Jekyll static site generator' },
    { id: 'html', name: 'HTML', desc: 'Rendered HTML output' }
  ];
  
  const choice = prompt(
    'Select export format:\n\n' + 
    formats.map((f, i) => `${i + 1}. ${f.name} - ${f.desc}`).join('\n') +
    '\n\nEnter number (1-5):',
    '1'
  );
  
  if (!choice) return;
  
  const index = parseInt(choice) - 1;
  if (index >= 0 && index < formats.length) {
    exportNote(formats[index].id);
  } else {
    alert('Invalid selection');
  }
}

function exportNote(format) {
  if (!currentNote) return;
  
  let content = '';
  let filename = currentNote.filename.replace('.md', '');
  let ext = '.md';
  
  switch (format) {
    case 'markdown':
      // Remove front matter
      content = currentNote.content.replace(/^---\n[\s\S]*?\n---\n\n?/, '');
      filename += '-clean';
      break;
      
    case 'markdown-full':
      content = currentNote.content;
      break;
      
    case 'hugo':
      // Hugo format with TOML front matter
      const hugoDate = new Date().toISOString();
      const hugoTitle = currentNote.title || filename;
      const cleanContent = currentNote.content.replace(/^---\n[\s\S]*?\n---\n\n?/, '');
      content = `+++
title = "${hugoTitle}"
date = ${hugoDate}
draft = false
+++

${cleanContent}`;
      filename += '-hugo';
      break;
      
    case 'jekyll':
      // Jekyll format with YAML front matter
      const jekyllDate = new Date().toISOString().split('T')[0];
      const jekyllTitle = currentNote.title || filename;
      const jekyllContent = currentNote.content.replace(/^---\n[\s\S]*?\n---\n\n?/, '');
      content = `---
layout: post
title: "${jekyllTitle}"
date: ${jekyllDate}
---

${jekyllContent}`;
      filename = `${jekyllDate}-${filename}`;
      break;
      
    case 'html':
      // Render as HTML
      const htmlContent = currentNote.content.replace(/^---\n[\s\S]*?\n---\n\n?/, '');
      const rendered = marked.parse(htmlContent);
      const clean = DOMPurify.sanitize(rendered);
      content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentNote.title || filename}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
    }
    img { max-width: 100%; height: auto; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
${clean}
</body>
</html>`;
      filename += '.html';
      ext = '.html';
      break;
  }
  
  // Download the file
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = format === 'html' ? filename : filename + ext;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('Note exported:', format, filename);
}

// Navigation History Management
function addToHistory(filename) {
  // Don't add if it's the same as current position
  if (navigationHistory[navigationHistoryIndex] === filename) {
    return;
  }
  
  // If we're not at the end of history, truncate forward history
  if (navigationHistoryIndex < navigationHistory.length - 1) {
    navigationHistory = navigationHistory.slice(0, navigationHistoryIndex + 1);
  }
  
  // Add to history
  navigationHistory.push(filename);
  navigationHistoryIndex = navigationHistory.length - 1;
  
  // Limit history to 50 items
  if (navigationHistory.length > 50) {
    navigationHistory.shift();
    navigationHistoryIndex--;
  }
  
  updateNavigationButtons();
}

function navigateBack() {
  if (navigationHistoryIndex > 0) {
    navigationHistoryIndex--;
    const filename = navigationHistory[navigationHistoryIndex];
    openNoteFromHistory(filename);
  }
}

function navigateForward() {
  if (navigationHistoryIndex < navigationHistory.length - 1) {
    navigationHistoryIndex++;
    const filename = navigationHistory[navigationHistoryIndex];
    openNoteFromHistory(filename);
  }
}

async function openNoteFromHistory(filename) {
  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(filename)}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load note');
    }
    
    currentNote = data;
    isDirty = false;
    showEditor('preview');
    updateNavigationButtons();
    
  } catch (error) {
    console.error('Failed to open note from history:', error);
    alert(`Failed to open note: ${error.message}`);
  }
}

function updateNavigationButtons() {
  const backBtn = document.getElementById('backBtn');
  const forwardBtn = document.getElementById('forwardBtn');
  
  if (backBtn) {
    backBtn.disabled = navigationHistoryIndex <= 0;
  }
  
  if (forwardBtn) {
    forwardBtn.disabled = navigationHistoryIndex >= navigationHistory.length - 1;
  }
}

// Utility Functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Escape string for use in JavaScript (for onclick attributes)
function escapeJs(text) {
  return text.replace(/\\/g, '\\\\')
             .replace(/'/g, "\\'")
             .replace(/"/g, '\\"')
             .replace(/\n/g, '\\n')
             .replace(/\r/g, '\\r');
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  // Less than 24 hours
  if (diff < 24 * 60 * 60 * 1000) {
    if (diff < 60 * 60 * 1000) {
      const mins = Math.floor(diff / (60 * 1000));
      return mins <= 1 ? '1 min ago' : `${mins} mins ago`;
    }
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  
  // Less than 7 days
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  }
  
  // Format as date
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
}

// Template Selector Modal
async function showTemplateSelector() {
  return new Promise(async (resolve) => {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: #24283b;
      border: 1px solid #414868;
      border-radius: 8px;
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    `;
    
    modalContent.innerHTML = `
      <h2 style="color: #c0caf5; margin-bottom: 1rem; font-size: 1.5rem;">Choose Template</h2>
      <p style="color: #9aa5ce; margin-bottom: 1.5rem; font-size: 0.9rem;">Select a template to start with, or create a blank note.</p>
      <div id="template-list" style="margin-bottom: 1.5rem;">
        <div style="text-align: center; color: #9aa5ce;">Loading templates...</div>
      </div>
      <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
        <button id="template-cancel" style="
          padding: 0.5rem 1rem;
          background: #414868;
          color: #c0caf5;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        ">Cancel</button>
        <button id="template-blank" style="
          padding: 0.5rem 1rem;
          background: #7aa2f7;
          color: #1a1b26;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.9rem;
        ">Blank Note</button>
      </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Load templates
    try {
      const response = await fetch(`${API_BASE}/templates`);
      const data = await response.json();
      
      if (data.success && data.templates.length > 0) {
        const templateList = document.getElementById('template-list');
        templateList.innerHTML = data.templates.map(t => `
          <button class="template-option" data-template-id="${t.id}" style="
            display: block;
            width: 100%;
            padding: 0.75rem 1rem;
            margin-bottom: 0.5rem;
            background: #1a1b26;
            border: 1px solid #414868;
            border-radius: 4px;
            color: #c0caf5;
            cursor: pointer;
            text-align: left;
            transition: all 0.2s;
          " onmouseover="this.style.borderColor='#7aa2f7'; this.style.background='#24283b'" onmouseout="this.style.borderColor='#414868'; this.style.background='#1a1b26'">
            <div style="font-weight: 500; margin-bottom: 0.25rem;">${escapeHtml(t.name)}</div>
            <div style="font-size: 0.85rem; color: #9aa5ce;">${t.filename}</div>
          </button>
        `).join('');
        
        // Add click handlers for template buttons
        document.querySelectorAll('.template-option').forEach(btn => {
          btn.addEventListener('click', () => {
            const templateId = btn.dataset.templateId;
            document.body.removeChild(modal);
            resolve(templateId);
          });
        });
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      document.getElementById('template-list').innerHTML = `
        <div style="color: #f7768e; text-align: center;">Failed to load templates</div>
      `;
    }
    
    // Cancel button
    document.getElementById('template-cancel').addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve(null);
    });
    
    // Blank note button
    document.getElementById('template-blank').addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve(false);
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        resolve(null);
      }
    });
    
    // ESC key to close
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', escHandler);
        resolve(null);
      }
    };
    document.addEventListener('keydown', escHandler);
  });
}

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('notes-theme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    updateThemeIcon(true);
  }
  
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('notes-theme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    themeToggle.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  }
}

// Setup WebSocket listeners for real-time updates
function setupWebSocketListeners() {
  if (window.wsClient) {
    wsClient.on('connected', () => {
      console.log('WebSocket connected for notes');
    });
    
    wsClient.on('note_update', (data) => {
      console.log('Received note update via WebSocket:', data);
      
      // Refresh the notes list when any note is created, updated, or deleted
      if (data.action === 'create' || data.action === 'delete' || data.action === 'rename') {
        // Reload the notes list
        currentOffset = 0;
        loadNotes();
        loadStats();
        
        // Show notification
        const action = data.action === 'create' ? 'created' : 
                      data.action === 'delete' ? 'deleted' : 'renamed';
        showNotification(`Note ${action}: ${data.filename || data.newFilename}`, 'info');
      }
      
      // If the currently open note was updated by another source, reload it
      if (data.action === 'update' && currentNote && data.filename === currentNote) {
        // Optionally reload the note content (only if not currently editing)
        if (activeTab === 'preview') {
          openNote(currentNote);
          showNotification('Note updated', 'info');
        }
      }
    });
  }
}

// Show notification helper
function showNotification(message, type = 'info') {
  // Create a simple toast notification
  const notification = document.createElement('div');
  notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white transition-opacity duration-300`;
  notification.style.backgroundColor = type === 'info' ? '#7aa2f7' : 
                                       type === 'success' ? '#9ece6a' : 
                                       type === 'error' ? '#f7768e' : '#e0af68';
  notification.textContent = message;
  notification.style.zIndex = '9999';
  
  document.body.appendChild(notification);
  
  // Fade out and remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ============================================================================
// CodeMirror Editor Integration
// ============================================================================

// Load editor settings from localStorage
function loadEditorSettings() {
  const saved = localStorage.getItem('ardenEditorSettings');
  if (saved) {
    try {
      editorSettings = { ...editorSettings, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to load editor settings:', e);
    }
  }
}

// Save editor settings to localStorage
function saveEditorSettings() {
  localStorage.setItem('ardenEditorSettings', JSON.stringify(editorSettings));
}

// Initialize CodeMirror editor
function initCodeMirror(element, initialContent = '') {
  const config = {
    value: initialContent,
    mode: 'markdown',
    theme: 'default',
    lineNumbers: editorSettings.lineNumbers,
    lineWrapping: editorSettings.lineWrapping,
    styleActiveLine: editorSettings.highlightActiveLine,
    autoCloseBrackets: editorSettings.autoCloseBrackets,
    extraKeys: {
      'Enter': 'newlineAndIndentContinueMarkdownList',
      'Ctrl-S': () => saveCurrentNote(false),
      'Cmd-S': () => saveCurrentNote(false)
    },
    placeholder: 'Start writing your note...'
  };

  // Add Vim keymap if enabled
  if (editorSettings.vimMode) {
    config.keyMap = 'vim';
  }

  const editor = CodeMirror(element, config);

  // Apply custom styling
  editor.getWrapperElement().style.height = '100%';
  editor.getWrapperElement().style.fontSize = '14px';

  // Listen for changes
  editor.on('change', (cm) => {
    currentNote.content = cm.getValue();
    isDirty = true;
    updateSaveStatus();
    updateEditorStats();

    if (currentView === 'split') {
      renderPreview();
    }

    // Trigger auto-save
    triggerAutoSave();
  });

  // Vim mode indicator
  if (editorSettings.vimMode) {
    const vimIndicator = document.getElementById('vimModeIndicator');
    
    editor.on('vim-mode-change', (e) => {
      const mode = e.mode.toUpperCase();
      vimIndicator.textContent = mode;
      vimIndicator.className = 'vim-mode-indicator visible ' + e.mode;
    });

    // Set initial mode
    vimIndicator.textContent = 'NORMAL';
    vimIndicator.className = 'vim-mode-indicator visible normal';
  }

  return editor;
}

// Destroy CodeMirror instance
function destroyCodeMirror() {
  if (codeMirrorEditor) {
    const element = codeMirrorEditor.getWrapperElement();
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
    codeMirrorEditor = null;

    // Hide Vim indicator
    const vimIndicator = document.getElementById('vimModeIndicator');
    if (vimIndicator) {
      vimIndicator.classList.remove('visible');
    }
  }
}

// Update editor options
function updateEditorOptions() {
  if (!codeMirrorEditor) return;

  codeMirrorEditor.setOption('lineNumbers', editorSettings.lineNumbers);
  codeMirrorEditor.setOption('lineWrapping', editorSettings.lineWrapping);
  codeMirrorEditor.setOption('styleActiveLine', editorSettings.highlightActiveLine);
  codeMirrorEditor.setOption('autoCloseBrackets', editorSettings.autoCloseBrackets);

  // Update Vim mode
  const vimIndicator = document.getElementById('vimModeIndicator');
  if (editorSettings.vimMode) {
    codeMirrorEditor.setOption('keyMap', 'vim');
    if (vimIndicator) {
      vimIndicator.textContent = 'NORMAL';
      vimIndicator.classList.add('visible');
    }
  } else {
    codeMirrorEditor.setOption('keyMap', 'default');
    if (vimIndicator) {
      vimIndicator.classList.remove('visible');
    }
  }

  saveEditorSettings();
}

// Setup editor settings modal
function setupEditorSettingsModal() {
  const modal = document.getElementById('editorSettingsModal');
  const btn = document.getElementById('editorSettingsBtn');
  const closeBtn = document.getElementById('closeEditorSettingsBtn');

  // Checkboxes
  const vimModeToggle = document.getElementById('vimModeToggle');
  const lineNumbersToggle = document.getElementById('lineNumbersToggle');
  const lineWrappingToggle = document.getElementById('lineWrappingToggle');
  const highlightActiveLineToggle = document.getElementById('highlightActiveLineToggle');
  const autoCloseBracketsToggle = document.getElementById('autoCloseBracketsToggle');

  // Load current settings
  vimModeToggle.checked = editorSettings.vimMode;
  lineNumbersToggle.checked = editorSettings.lineNumbers;
  lineWrappingToggle.checked = editorSettings.lineWrapping;
  highlightActiveLineToggle.checked = editorSettings.highlightActiveLine;
  autoCloseBracketsToggle.checked = editorSettings.autoCloseBrackets;

  // Open modal
  if (btn) {
    btn.addEventListener('click', () => {
      modal.classList.add('visible');
    });
  }

  // Close modal
  const closeModal = () => {
    modal.classList.remove('visible');
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Handle setting changes
  vimModeToggle.addEventListener('change', (e) => {
    editorSettings.vimMode = e.target.checked;
    updateEditorOptions();
  });

  lineNumbersToggle.addEventListener('change', (e) => {
    editorSettings.lineNumbers = e.target.checked;
    updateEditorOptions();
  });

  lineWrappingToggle.addEventListener('change', (e) => {
    editorSettings.lineWrapping = e.target.checked;
    updateEditorOptions();
  });

  highlightActiveLineToggle.addEventListener('change', (e) => {
    editorSettings.highlightActiveLine = e.target.checked;
    updateEditorOptions();
  });

  autoCloseBracketsToggle.addEventListener('change', (e) => {
    editorSettings.autoCloseBrackets = e.target.checked;
    updateEditorOptions();
  });
}

// Make functions globally available
window.openNote = openNote;
window.openNoteByName = openNoteByName;
window.editNote = editNote;
window.deleteNote = deleteNote;
window.renameNote = renameNote;
window.navigateBack = navigateBack;
window.navigateForward = navigateForward;
