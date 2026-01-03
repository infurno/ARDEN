/**
 * TODOs Interface Handler
 */

let allTodos = [];
let filteredTodos = [];
let currentFilter = 'active'; // Default to 'active' to hide completed
let searchQuery = '';
let showArchived = false; // Track archive visibility
let currentSort = 'file-asc'; // Default sort order

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
    await loadTodos();
    
    // Setup WebSocket listeners
    setupWebSocketListeners();
    
    // Event listeners
    document.getElementById('consolidate-btn').addEventListener('click', consolidateTodos);
    document.getElementById('new-todo-btn').addEventListener('click', showNewTodoModal);
    document.getElementById('logout-button').addEventListener('click', logout);
    document.getElementById('search-input').addEventListener('input', handleSearch);
    document.getElementById('filter-status').addEventListener('change', handleFilter);
    document.getElementById('sort-order').addEventListener('change', handleSort);
    document.getElementById('clear-filters').addEventListener('click', clearFilters);
    document.getElementById('clear-search').addEventListener('click', clearSearchInput);
    document.getElementById('toggle-archive').addEventListener('click', toggleArchive);
    
    // Update clear search button visibility on input
    updateClearSearchButton();
});

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
    const text = prompt('Enter new TODO:');
    if (!text || !text.trim()) return;
    
    createTodo(text.trim());
}

// Create new TODO
async function createTodo(text) {
    try {
        const data = await api.createTodo(text);
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to create TODO');
        }
        
        showToast('TODO created!', 'success');
        await loadTodos();
    } catch (error) {
        console.error('Failed to create TODO:', error);
        showToast('Failed to create TODO', 'error');
    }
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
    currentSort = 'file-asc';
    showArchived = false;
    document.getElementById('search-input').value = '';
    document.getElementById('filter-status').value = 'active';
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
}

// Render single TODO item
function renderTodoItem(todo) {
    return `
        <div class="todo-item ${todo.checked ? 'todo-checked' : ''} bg-surface border border-border rounded-lg p-3 flex items-start space-x-3">
            <input type="checkbox" 
                   class="todo-checkbox mt-1 w-4 h-4 cursor-pointer" 
                   data-id="${todo.id}"
                   ${todo.checked ? 'checked' : ''}
                   style="accent-color: #9ece6a;">
            <div class="flex-1">
                <div class="todo-text" style="color: #c0caf5;">${escapeHtml(todo.text)}</div>
                ${todo.sourceFile && todo.sourceLine ? `
                    <div class="text-xs mt-1" style="color: #565f89;">
                        ${escapeHtml(todo.sourceFile)}:${todo.sourceLine}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
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
