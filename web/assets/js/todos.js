/**
 * TODOs Interface Handler
 */

let allTodos = [];
let filteredTodos = [];
let currentFilter = 'active'; // Default to 'active' to hide completed
let currentCategory = 'all'; // Track selected category
let searchQuery = '';
let showArchived = false; // Track archive visibility
let currentSort = 'file-asc'; // Default sort order
let availableCategories = []; // Store loaded categories

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    try {
        const authStatus = await api.verifyAuth();
        if (!authStatus.authenticated) {
            window.location.href = '/login.html';
            return;
        }
    } catch (error) {
        window.location.href = '/login.html';
        return;
    }

    // Initialize
    await loadCategories();
    await loadTodos();
    
    // Setup WebSocket listeners
    setupWebSocketListeners();
    
    // Event listeners
    document.getElementById('consolidate-btn').addEventListener('click', consolidateTodos);
    document.getElementById('new-todo-btn').addEventListener('click', showNewTodoModal);
    document.getElementById('logout-button').addEventListener('click', logout);
    document.getElementById('search-input').addEventListener('input', handleSearch);
    document.getElementById('filter-status').addEventListener('change', handleFilter);
    document.getElementById('filter-category').addEventListener('change', handleCategoryFilter);
    document.getElementById('sort-order').addEventListener('change', handleSort);
    document.getElementById('clear-filters').addEventListener('click', clearFilters);
    document.getElementById('clear-search').addEventListener('click', clearSearchInput);
    document.getElementById('toggle-archive').addEventListener('click', toggleArchive);
    
    // Update clear search button visibility on input
    updateClearSearchButton();
});

// Load categories from API
async function loadCategories() {
    try {
        const data = await api.getTodoCategories();
        
        if (data.success) {
            availableCategories = data.categories;
            updateCategoryDropdowns();
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
        // Use default categories if API fails
        availableCategories = [
            { id: 'personal', name: 'Personal' },
            { id: 'work', name: 'Work' },
            { id: 'side-projects', name: 'Side Projects' }
        ];
        updateCategoryDropdowns();
    }
}

// Update all category dropdowns
function updateCategoryDropdowns() {
    // Update filter dropdown
    const filterDropdown = document.getElementById('filter-category');
    if (filterDropdown) {
        const currentValue = filterDropdown.value;
        filterDropdown.innerHTML = '<option value="all">All Categories</option>';
        
        availableCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            filterDropdown.appendChild(option);
        });
        
        // Restore previous selection if still valid
        if (currentValue && availableCategories.find(c => c.id === currentValue)) {
            filterDropdown.value = currentValue;
        }
    }
}

// Load TODOs from API
async function loadTodos() {
    try {
        const data = await api.getTodos();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to load TODOs');
        }
        
        allTodos = data.todos.items || [];
        
        // Calculate stats from actual loaded TODOs (excludes templates and archived)
        const activeTodos = allTodos.filter(t => !t.isArchived);
        const stats = {
            total: activeTodos.length,
            unchecked: activeTodos.filter(t => !t.checked).length,
            checked: activeTodos.filter(t => t.checked).length,
            filesWithTodos: new Set(activeTodos.map(t => t.sourceFile).filter(f => f)).size
        };
        
        updateStats(stats);
        updateLastUpdated(data.todos.lastUpdated);
        
        applyFilters();
        renderTodos();
    } catch (error) {
        console.error('Failed to load TODOs:', error);
        showError('Failed to load TODOs. Try consolidating your TODOs.');
    }
}

// Consolidate TODOs
async function consolidateTodos() {
    const btn = document.getElementById('consolidate-btn');
    const originalText = btn.innerHTML;
    
    try {
        btn.disabled = true;
        btn.innerHTML = '⏳ Consolidating...';
        
        const data = await api.consolidateTodos();
        
        if (!data.success) {
            throw new Error(data.error || 'Consolidation failed');
        }
        
        allTodos = data.todos.items || [];
        updateStats(data.todos.stats);
        updateLastUpdated(data.todos.lastUpdated);
        
        applyFilters();
        renderTodos();
        
        showToast('TODOs consolidated successfully!', 'success');
    } catch (error) {
        console.error('Consolidation failed:', error);
        showToast('Failed to consolidate TODOs', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Update TODO status
async function toggleTodo(id, checked) {
    try {
        const data = await api.updateTodo(id, checked);
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to update TODO');
        }
        
        // Reload TODOs to get updated list
        await loadTodos();
        showToast('TODO updated!', 'success');
    } catch (error) {
        console.error('Failed to update TODO:', error);
        showToast('Failed to update TODO', 'error');
        // Reload to restore checkbox state
        await loadTodos();
    }
}

// Show new TODO modal
function showNewTodoModal() {
    // Build category options
    let categoryOptions = '';
    availableCategories.forEach(cat => {
        const selected = cat.id === 'personal' ? 'selected' : '';
        categoryOptions += `<option value="${cat.id}" ${selected}>${escapeHtml(cat.name)}</option>`;
    });
    
    // Create modal HTML
    const modalHtml = `
        <div id="todo-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style="backdrop-filter: blur(4px);">
            <div class="bg-surface border border-border rounded-lg p-6 max-w-md w-full mx-4" style="background-color: #24283b; border-color: #414868;">
                <h3 class="text-xl font-bold mb-4" style="color: #c0caf5;">Create New TODO</h3>
                
                <div class="mb-4">
                    <div class="flex items-center justify-between mb-2">
                        <label class="block text-sm font-medium" style="color: #c0caf5;">Category</label>
                        <button id="new-category-btn" class="text-xs px-2 py-1 rounded hover:bg-opacity-80 transition-colors" 
                                style="background-color: #bb9af7; color: #1a1b26;"
                                title="Create new category">
                            + New Category
                        </button>
                    </div>
                    <select id="new-todo-category" class="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                            style="background-color: #1a1b26; border: 1px solid #414868; color: #c0caf5;">
                        ${categoryOptions}
                    </select>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2" style="color: #c0caf5;">TODO Text</label>
                    <textarea id="new-todo-text" 
                              class="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                              style="background-color: #1a1b26; border: 1px solid #414868; color: #c0caf5;"
                              rows="3"
                              placeholder="Enter your TODO..."></textarea>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2" style="color: #c0caf5;">Due Date (Optional)</label>
                    <input type="date" 
                           id="new-todo-due-date" 
                           class="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                           style="background-color: #1a1b26; border: 1px solid #414868; color: #c0caf5;">
                </div>
                
                <div class="flex justify-end space-x-3">
                    <button id="cancel-todo-btn" class="px-4 py-2 rounded-lg hover:bg-opacity-80 transition-colors"
                            style="background-color: #414868; color: #c0caf5;">
                        Cancel
                    </button>
                    <button id="create-todo-btn" class="px-4 py-2 rounded-lg hover:bg-opacity-80 transition-colors"
                            style="background-color: #7aa2f7; color: #1a1b26;">
                        Create TODO
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.getElementById('todo-modal');
    const textArea = document.getElementById('new-todo-text');
    const dueDateInput = document.getElementById('new-todo-due-date');
    const createBtn = document.getElementById('create-todo-btn');
    const cancelBtn = document.getElementById('cancel-todo-btn');
    const newCategoryBtn = document.getElementById('new-category-btn');
    
    // Focus on textarea
    textArea.focus();
    
    // Close modal function
    const closeModal = () => modal.remove();
    
    // Create TODO handler
    const handleCreate = () => {
        const text = textArea.value.trim();
        if (!text) {
            textArea.focus();
            return;
        }
        
        const category = document.getElementById('new-todo-category').value;
        const dueDate = dueDateInput.value || null;
        createTodo(text, category, dueDate);
        closeModal();
    };
    
    // New category handler
    newCategoryBtn.addEventListener('click', () => {
        closeModal();
        showNewCategoryModal(() => {
            // Reopen TODO modal after category is created
            showNewTodoModal();
        });
    });
    
    // Event listeners
    createBtn.addEventListener('click', handleCreate);
    cancelBtn.addEventListener('click', closeModal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
    
    // Create on Enter (Ctrl+Enter)
    textArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleCreate();
        }
    });
}

// Create new TODO
async function createTodo(text, category = 'personal', dueDate = null) {
    try {
        // If due date is provided, append it to the text
        let fullText = text;
        if (dueDate) {
            fullText += ` 📅 ${dueDate}`;
        }
        
        const data = await api.createTodo(fullText, category);
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to create TODO');
        }
        
        showToast(`TODO created in ${category} category!`, 'success');
        await loadTodos();
    } catch (error) {
        console.error('Failed to create TODO:', error);
        showToast('Failed to create TODO', 'error');
    }
}

// Show new category modal
function showNewCategoryModal(onSuccess = null) {
    const modalHtml = `
        <div id="new-category-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style="backdrop-filter: blur(4px);">
            <div class="bg-surface border border-border rounded-lg p-6 max-w-md w-full mx-4" style="background-color: #24283b; border-color: #414868;">
                <h3 class="text-xl font-bold mb-4" style="color: #c0caf5;">Create New Category</h3>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2" style="color: #c0caf5;">Category Name</label>
                    <input type="text" 
                           id="new-category-name" 
                           class="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                           style="background-color: #1a1b26; border: 1px solid #414868; color: #c0caf5;"
                           placeholder="e.g., Fitness, Learning, Projects..."
                           autocomplete="off">
                    <p class="text-xs mt-2" style="color: #9aa5ce;">
                        Category names will be converted to lowercase with hyphens (e.g., "My Projects" → "my-projects.md")
                    </p>
                </div>
                
                <div class="flex justify-end space-x-3">
                    <button id="cancel-category-btn" class="px-4 py-2 rounded-lg hover:bg-opacity-80 transition-colors"
                            style="background-color: #414868; color: #c0caf5;">
                        Cancel
                    </button>
                    <button id="create-category-btn" class="px-4 py-2 rounded-lg hover:bg-opacity-80 transition-colors"
                            style="background-color: #bb9af7; color: #1a1b26;">
                        Create Category
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.getElementById('new-category-modal');
    const nameInput = document.getElementById('new-category-name');
    const createBtn = document.getElementById('create-category-btn');
    const cancelBtn = document.getElementById('cancel-category-btn');
    
    // Focus on input
    nameInput.focus();
    
    // Close modal function
    const closeModal = () => modal.remove();
    
    // Create category handler
    const handleCreate = async () => {
        const name = nameInput.value.trim();
        if (!name) {
            nameInput.focus();
            return;
        }
        
        try {
            createBtn.disabled = true;
            createBtn.textContent = 'Creating...';
            
            const data = await api.createTodoCategory(name);
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to create category');
            }
            
            showToast(`Category "${data.category.name}" created!`, 'success');
            
            // Reload categories
            await loadCategories();
            
            closeModal();
            
            // Call success callback if provided
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Failed to create category:', error);
            showToast(error.message || 'Failed to create category', 'error');
            createBtn.disabled = false;
            createBtn.textContent = 'Create Category';
        }
    };
    
    // Event listeners
    createBtn.addEventListener('click', handleCreate);
    cancelBtn.addEventListener('click', closeModal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
    
    // Create on Enter
    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleCreate();
        }
    });
}

// Apply filters
function applyFilters() {
    filteredTodos = allTodos.filter(todo => {
        // Archive filter - hide archived items unless showArchived is true or viewing 'all'/'completed'
        if (!showArchived && todo.isArchived && currentFilter !== 'completed' && currentFilter !== 'all') {
            return false;
        }
        
        // Filter by status
        if (currentFilter === 'active' && (todo.checked || todo.isArchived)) return false; // Hide completed/archived in 'active' mode
        if (currentFilter === 'pending' && todo.checked) return false;
        if (currentFilter === 'completed' && !todo.checked) return false;
        
        // Filter by category
        if (currentCategory !== 'all') {
            const sourceFile = todo.sourceFile || '';
            const categoryInFile = sourceFile.toLowerCase().includes(`todos/${currentCategory}`);
            if (!categoryInFile) return false;
        }
        
        // Filter by search query
        if (searchQuery && !todo.text.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        
        return true;
    });
}

// Handle search
function handleSearch(e) {
    searchQuery = e.target.value.trim();
    updateClearSearchButton();
    applyFilters();
    renderTodos();
}

// Handle filter
function handleFilter(e) {
    currentFilter = e.target.value;
    applyFilters();
    renderTodos();
}

// Handle category filter
function handleCategoryFilter(e) {
    currentCategory = e.target.value;
    applyFilters();
    renderTodos();
}

// Handle sort
function handleSort(e) {
    currentSort = e.target.value;
    renderTodos();
}

// Extract date from filename (supports formats like: YYYY-MM-DD, daily/YYYY-MM-DD, etc.)
function extractDateFromFilename(filename) {
    if (!filename) return null;
    
    // Match YYYY-MM-DD pattern
    const dateMatch = filename.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
        return new Date(dateMatch[0]);
    }
    
    // Match YYYYMMDD pattern
    const compactMatch = filename.match(/(\d{4})(\d{2})(\d{2})/);
    if (compactMatch) {
        return new Date(`${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`);
    }
    
    return null;
}

// Sort TODOs based on current sort order
function sortTodos(todos) {
    const sorted = [...todos];
    
    switch (currentSort) {
        case 'file-asc':
            sorted.sort((a, b) => {
                const fileA = (a.sourceFile || '').toLowerCase();
                const fileB = (b.sourceFile || '').toLowerCase();
                return fileA.localeCompare(fileB);
            });
            break;
            
        case 'file-desc':
            sorted.sort((a, b) => {
                const fileA = (a.sourceFile || '').toLowerCase();
                const fileB = (b.sourceFile || '').toLowerCase();
                return fileB.localeCompare(fileA);
            });
            break;
            
        case 'date-desc':
            sorted.sort((a, b) => {
                const dateA = extractDateFromFilename(a.sourceFile);
                const dateB = extractDateFromFilename(b.sourceFile);
                
                // Files without dates go to bottom
                if (!dateA && !dateB) return (a.sourceFile || '').localeCompare(b.sourceFile || '');
                if (!dateA) return 1;
                if (!dateB) return -1;
                
                return dateB - dateA; // Newest first
            });
            break;
            
        case 'date-asc':
            sorted.sort((a, b) => {
                const dateA = extractDateFromFilename(a.sourceFile);
                const dateB = extractDateFromFilename(b.sourceFile);
                
                // Files without dates go to bottom
                if (!dateA && !dateB) return (a.sourceFile || '').localeCompare(b.sourceFile || '');
                if (!dateA) return 1;
                if (!dateB) return -1;
                
                return dateA - dateB; // Oldest first
            });
            break;
            
        case 'text-asc':
            sorted.sort((a, b) => {
                return (a.text || '').toLowerCase().localeCompare((b.text || '').toLowerCase());
            });
            break;
            
        case 'text-desc':
            sorted.sort((a, b) => {
                return (b.text || '').toLowerCase().localeCompare((a.text || '').toLowerCase());
            });
            break;
    }
    
    return sorted;
}

// Clear search input
function clearSearchInput() {
    searchQuery = '';
    document.getElementById('search-input').value = '';
    updateClearSearchButton();
    applyFilters();
    renderTodos();
}

// Update clear search button visibility
function updateClearSearchButton() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search');
    
    if (searchInput.value.trim().length > 0) {
        clearBtn.style.opacity = '1';
        clearBtn.style.pointerEvents = 'auto';
    } else {
        clearBtn.style.opacity = '0';
        clearBtn.style.pointerEvents = 'none';
    }
}

// Toggle archive visibility
function toggleArchive() {
    showArchived = !showArchived;
    
    const archiveBtn = document.getElementById('toggle-archive');
    const archiveIcon = document.getElementById('archive-icon');
    const archiveText = document.getElementById('archive-text');
    
    if (showArchived) {
        archiveIcon.textContent = '📂';
        archiveText.textContent = 'Hide Archived';
        archiveBtn.style.backgroundColor = '#9ece6a';
        archiveBtn.style.color = '#1a1b26';
    } else {
        archiveIcon.textContent = '📦';
        archiveText.textContent = 'Show Archived';
        archiveBtn.style.backgroundColor = '#414868';
        archiveBtn.style.color = '#c0caf5';
    }
    
    applyFilters();
    renderTodos();
}

// Clear filters
function clearFilters() {
    searchQuery = '';
    currentFilter = 'active';
    currentCategory = 'all';
    currentSort = 'file-asc';
    showArchived = false;
    document.getElementById('search-input').value = '';
    document.getElementById('filter-status').value = 'active';
    document.getElementById('filter-category').value = 'all';
    document.getElementById('sort-order').value = 'file-asc';
    
    // Reset archive button
    const archiveBtn = document.getElementById('toggle-archive');
    const archiveIcon = document.getElementById('archive-icon');
    const archiveText = document.getElementById('archive-text');
    archiveIcon.textContent = '📦';
    archiveText.textContent = 'Show Archived';
    archiveBtn.style.backgroundColor = '#414868';
    archiveBtn.style.color = '#c0caf5';
    
    updateClearSearchButton();
    applyFilters();
    renderTodos();
}

// Render TODOs
function renderTodos() {
    const container = document.getElementById('todos-container');
    
    if (filteredTodos.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12" style="color: #9aa5ce;">
                <div class="text-4xl mb-4">✨</div>
                <p>${searchQuery || currentFilter !== 'all' ? 'No TODOs match your filters' : 'No TODOs found. Create one to get started!'}</p>
            </div>
        `;
        return;
    }
    
    // Sort the filtered TODOs
    const sortedTodos = sortTodos(filteredTodos);
    
    // Group TODOs by source file
    const grouped = {};
    sortedTodos.forEach(todo => {
        const file = todo.sourceFile || 'Uncategorized';
        if (!grouped[file]) grouped[file] = [];
        grouped[file].push(todo);
    });
    
    let html = '';
    
    // Sort file groups based on sort order
    let fileOrder = Object.keys(grouped);
    if (currentSort.startsWith('date-')) {
        // For date sorting, maintain the order from sorted TODOs
        fileOrder = [];
        const seen = new Set();
        sortedTodos.forEach(todo => {
            const file = todo.sourceFile || 'Uncategorized';
            if (!seen.has(file)) {
                fileOrder.push(file);
                seen.add(file);
            }
        });
    } else if (currentSort === 'file-desc') {
        fileOrder.sort().reverse();
    } else if (currentSort === 'file-asc') {
        fileOrder.sort();
    } else {
        // For text sorting, keep files but sort is per-item
        fileOrder.sort();
    }
    
    fileOrder.forEach(file => {
        html += `
            <div class="mb-6">
                <h3 class="text-sm font-semibold mb-3 px-2" style="color: #7aa2f7;">
                    📄 ${escapeHtml(file)}
                </h3>
                <div class="space-y-1">
        `;
        
        grouped[file].forEach(todo => {
            html += renderTodoItem(todo);
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add event listeners to checkboxes
    document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const checked = e.target.checked;
            toggleTodo(id, checked);
        });
    });
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.edit-todo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const text = e.currentTarget.dataset.text;
            const dueDate = e.currentTarget.dataset.dueDate;
            showEditTodoModal(id, text, dueDate);
        });
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-todo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            confirmDeleteTodo(id);
        });
    });
}

// Render single TODO item
function renderTodoItem(todo) {
    // Extract category from sourceFile path
    let category = 'Other';
    let categoryColor = '#565f89';
    
    if (todo.sourceFile) {
        const sourceFile = todo.sourceFile.toLowerCase();
        if (sourceFile.includes('todos/work')) {
            category = 'Work';
            categoryColor = '#7aa2f7'; // Blue
        } else if (sourceFile.includes('todos/personal')) {
            category = 'Personal';
            categoryColor = '#9ece6a'; // Green
        } else if (sourceFile.includes('todos/side-projects')) {
            category = 'Side Projects';
            categoryColor = '#bb9af7'; // Purple
        }
    }
    
    // Check if due date is overdue
    let dueDateHtml = '';
    if (todo.dueDate) {
        const dueDate = new Date(todo.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        
        const isOverdue = dueDate < today && !todo.checked;
        const isToday = dueDate.getTime() === today.getTime();
        
        let dueDateColor = '#9aa5ce';
        let dueDateIcon = '📅';
        
        if (isOverdue) {
            dueDateColor = '#f7768e'; // Red
            dueDateIcon = '⚠️';
        } else if (isToday) {
            dueDateColor = '#e0af68'; // Yellow
            dueDateIcon = '⏰';
        }
        
        dueDateHtml = `
            <span class="px-2 py-0.5 rounded text-xs font-medium" style="background-color: ${dueDateColor}20; color: ${dueDateColor}; border: 1px solid ${dueDateColor}40;">
                ${dueDateIcon} ${todo.dueDate}
            </span>
        `;
    }
    
    return `
        <div class="todo-item ${todo.checked ? 'todo-checked' : ''} bg-surface border border-border rounded-lg p-3 flex items-start space-x-3 group">
            <input type="checkbox" 
                   class="todo-checkbox mt-1 w-4 h-4 cursor-pointer flex-shrink-0" 
                   data-id="${todo.id}"
                   ${todo.checked ? 'checked' : ''}
                   style="accent-color: #9ece6a;">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <span class="px-2 py-0.5 rounded text-xs font-medium" style="background-color: ${categoryColor}20; color: ${categoryColor}; border: 1px solid ${categoryColor}40;">
                        ${escapeHtml(category)}
                    </span>
                    ${dueDateHtml}
                </div>
                <div class="todo-text break-words" style="color: #c0caf5;">${escapeHtml(todo.text)}</div>
                ${todo.sourceFile && todo.sourceLine ? `
                    <div class="text-xs mt-1" style="color: #565f89;">
                        ${escapeHtml(todo.sourceFile)}:${todo.sourceLine}
                    </div>
                ` : ''}
            </div>
            <div class="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button class="edit-todo-btn p-1 rounded hover:bg-opacity-80 transition-colors" 
                        data-id="${todo.id}"
                        data-text="${escapeHtml(todo.text)}"
                        data-due-date="${todo.dueDate || ''}"
                        title="Edit TODO"
                        style="background-color: #7aa2f7; color: #1a1b26;">
                    ✏️
                </button>
                <button class="delete-todo-btn p-1 rounded hover:bg-opacity-80 transition-colors" 
                        data-id="${todo.id}"
                        title="Delete TODO"
                        style="background-color: #f7768e; color: #1a1b26;">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

// Show edit TODO modal
function showEditTodoModal(id, text, dueDate = '') {
    // Create modal HTML
    const modalHtml = `
        <div id="edit-todo-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style="backdrop-filter: blur(4px);">
            <div class="bg-surface border border-border rounded-lg p-6 max-w-md w-full mx-4" style="background-color: #24283b; border-color: #414868;">
                <h3 class="text-xl font-bold mb-4" style="color: #c0caf5;">Edit TODO</h3>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2" style="color: #c0caf5;">TODO Text</label>
                    <textarea id="edit-todo-text" 
                              class="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                              style="background-color: #1a1b26; border: 1px solid #414868; color: #c0caf5;"
                              rows="3">${escapeHtml(text)}</textarea>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2" style="color: #c0caf5;">Due Date (Optional)</label>
                    <input type="date" 
                           id="edit-todo-due-date" 
                           value="${dueDate}"
                           class="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                           style="background-color: #1a1b26; border: 1px solid #414868; color: #c0caf5;">
                </div>
                
                <div class="flex justify-end space-x-3">
                    <button id="cancel-edit-btn" class="px-4 py-2 rounded-lg hover:bg-opacity-80 transition-colors"
                            style="background-color: #414868; color: #c0caf5;">
                        Cancel
                    </button>
                    <button id="save-edit-btn" class="px-4 py-2 rounded-lg hover:bg-opacity-80 transition-colors"
                            style="background-color: #7aa2f7; color: #1a1b26;">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.getElementById('edit-todo-modal');
    const textArea = document.getElementById('edit-todo-text');
    const dueDateInput = document.getElementById('edit-todo-due-date');
    const saveBtn = document.getElementById('save-edit-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    
    // Focus on textarea
    textArea.focus();
    textArea.setSelectionRange(textArea.value.length, textArea.value.length);
    
    // Close modal function
    const closeModal = () => modal.remove();
    
    // Save TODO handler
    const handleSave = () => {
        const newText = textArea.value.trim();
        if (!newText) {
            textArea.focus();
            return;
        }
        
        const newDueDate = dueDateInput.value || null;
        editTodo(id, newText, newDueDate);
        closeModal();
    };
    
    // Event listeners
    saveBtn.addEventListener('click', handleSave);
    cancelBtn.addEventListener('click', closeModal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
    
    // Save on Ctrl+Enter
    textArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleSave();
        }
    });
}

// Edit TODO
async function editTodo(id, text, dueDate) {
    try {
        const data = await api.editTodo(id, text, dueDate);
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to edit TODO');
        }
        
        showToast('TODO updated successfully!', 'success');
        await loadTodos();
    } catch (error) {
        console.error('Failed to edit TODO:', error);
        showToast('Failed to edit TODO', 'error');
    }
}

// Confirm and delete TODO
function confirmDeleteTodo(id) {
    // Create confirmation modal
    const modalHtml = `
        <div id="delete-confirm-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style="backdrop-filter: blur(4px);">
            <div class="bg-surface border border-border rounded-lg p-6 max-w-sm w-full mx-4" style="background-color: #24283b; border-color: #414868;">
                <h3 class="text-xl font-bold mb-4" style="color: #f7768e;">Delete TODO?</h3>
                <p class="mb-6" style="color: #c0caf5;">Are you sure you want to delete this TODO? This action cannot be undone.</p>
                
                <div class="flex justify-end space-x-3">
                    <button id="cancel-delete-btn" class="px-4 py-2 rounded-lg hover:bg-opacity-80 transition-colors"
                            style="background-color: #414868; color: #c0caf5;">
                        Cancel
                    </button>
                    <button id="confirm-delete-btn" class="px-4 py-2 rounded-lg hover:bg-opacity-80 transition-colors"
                            style="background-color: #f7768e; color: #1a1b26;">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.getElementById('delete-confirm-modal');
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const cancelBtn = document.getElementById('cancel-delete-btn');
    
    // Close modal function
    const closeModal = () => modal.remove();
    
    // Confirm delete handler
    const handleDelete = () => {
        deleteTodo(id);
        closeModal();
    };
    
    // Event listeners
    confirmBtn.addEventListener('click', handleDelete);
    cancelBtn.addEventListener('click', closeModal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

// Delete TODO
async function deleteTodo(id) {
    try {
        const data = await api.deleteTodo(id);
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to delete TODO');
        }
        
        showToast('TODO deleted successfully!', 'success');
        await loadTodos();
    } catch (error) {
        console.error('Failed to delete TODO:', error);
        showToast('Failed to delete TODO', 'error');
    }
}

// Update stats display
function updateStats(stats) {
    document.getElementById('stat-total').textContent = stats.total || 0;
    document.getElementById('stat-pending').textContent = stats.unchecked || 0;
    document.getElementById('stat-completed').textContent = stats.checked || 0;
    document.getElementById('stat-files').textContent = stats.filesWithTodos || 0;
}

// Update last updated display
function updateLastUpdated(timestamp) {
    const elem = document.getElementById('last-updated');
    if (timestamp) {
        elem.textContent = `Last updated: ${timestamp}`;
    } else {
        elem.textContent = 'Not yet consolidated';
    }
}

// Show error message
function showError(message) {
    const container = document.getElementById('todos-container');
    container.innerHTML = `
        <div class="text-center py-12">
            <div class="text-4xl mb-4" style="color: #f7768e;">⚠️</div>
            <p style="color: #f7768e;">${escapeHtml(message)}</p>
            <button onclick="loadTodos()" class="mt-4 bg-primary hover:bg-opacity-80 px-4 py-2 rounded-lg" style="color: #1a1b26;">
                Retry
            </button>
        </div>
    `;
}

// Show toast notification
function showToast(message, type = 'info') {
    const colors = {
        success: '#9ece6a',
        error: '#f7768e',
        info: '#7aa2f7'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: #1a1b26;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Logout
async function logout() {
    try {
        await api.logout();
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Setup WebSocket listeners for real-time updates
function setupWebSocketListeners() {
    if (window.wsClient) {
        wsClient.on('connected', () => {
            console.log('WebSocket connected for todos');
        });
        
        wsClient.on('todo_update', (data) => {
            console.log('Received TODO update via WebSocket:', data);
            
            // Reload TODOs when any TODO is created, toggled, or updated
            loadTodos();
            
            // Show notification
            let message = 'TODO updated';
            if (data.action === 'create') {
                message = 'New TODO created';
            } else if (data.action === 'toggle') {
                message = data.checked ? 'TODO completed' : 'TODO unchecked';
            }
            
            showNotification(message, 'info');
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
