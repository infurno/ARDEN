/**
 * Skills Configuration Handler
 */

let allSkills = [];
let currentSkill = null;

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
    await loadSkills();
    
    // Event listeners
    document.getElementById('logout-button').addEventListener('click', logout);
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-execute').addEventListener('click', executeCurrentSkill);
    
    // Close modal on background click
    document.getElementById('skill-modal').addEventListener('click', (e) => {
        if (e.target.id === 'skill-modal') {
            closeModal();
        }
    });
});

// Load skills from API
async function loadSkills() {
    try {
        const data = await api.getSkills();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to load skills');
        }
        
        allSkills = data.skills || [];
        updateStats();
        renderSkills();
    } catch (error) {
        console.error('Failed to load skills:', error);
        showError('Failed to load skills. Please try again.');
    }
}

// Update stats display
function updateStats() {
    const total = allSkills.length;
    const enabled = allSkills.filter(s => s.enabled).length;
    const disabled = total - enabled;
    
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-enabled').textContent = enabled;
    document.getElementById('stat-disabled').textContent = disabled;
}

// Render skills list
function renderSkills() {
    const container = document.getElementById('skills-container');
    
    if (allSkills.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12" style="color: #9aa5ce;">
                <div class="text-4xl mb-4">📭</div>
                <p>No skills found</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
    
    allSkills.forEach(skill => {
        html += renderSkillCard(skill);
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Add event listeners to skill cards
    document.querySelectorAll('.skill-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const skillId = e.currentTarget.dataset.skillId;
            showSkillDetails(skillId);
        });
    });
    
    // Add event listeners to toggle switches
    document.querySelectorAll('.skill-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            const skillId = e.target.dataset.skillId;
            const enabled = e.target.checked;
            toggleSkill(skillId, enabled);
        });
    });
}

// Render single skill card
function renderSkillCard(skill) {
    const statusClass = skill.enabled ? 'skill-enabled' : 'skill-disabled';
    const statusColor = skill.enabled ? '#9ece6a' : '#565f89';
    
    return `
        <div class="skill-card ${statusClass} bg-surface border border-border rounded-lg p-6 cursor-pointer" data-skill-id="${escapeHtml(skill.id)}">
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <h3 class="text-lg font-semibold mb-1" style="color: #c0caf5;">${escapeHtml(skill.name)}</h3>
                    <p class="text-sm" style="color: #9aa5ce;">${escapeHtml(skill.description)}</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer ml-4" onclick="event.stopPropagation()">
                    <input type="checkbox" 
                           class="skill-toggle sr-only peer" 
                           data-skill-id="${escapeHtml(skill.id)}"
                           ${skill.enabled ? 'checked' : ''}>
                    <div class="w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" 
                         style="background-color: ${skill.enabled ? '#9ece6a' : '#414868'};"></div>
                </label>
            </div>
            
            <div class="flex items-center space-x-4 text-xs" style="color: #565f89;">
                <span>📁 ${escapeHtml(skill.id)}</span>
                ${skill.enabled ? '<span style="color: #9ece6a;">● Active</span>' : '<span>○ Inactive</span>'}
            </div>
        </div>
    `;
}

// Show skill details in modal
async function showSkillDetails(skillId) {
    try {
        const data = await api.getSkillDetails(skillId);
        
        if (!data.success || !data.skill) {
            throw new Error('Skill not found');
        }
        
        currentSkill = data.skill;
        
        // Update modal title
        document.getElementById('modal-title').textContent = currentSkill.name;
        
        // Build modal content
        let content = `
            <div class="space-y-6">
                <!-- Status Badge -->
                <div class="flex items-center space-x-2">
                    <span class="px-3 py-1 rounded-full text-sm" style="background-color: ${currentSkill.enabled ? '#9ece6a' : '#565f89'}; color: #1a1b26;">
                        ${currentSkill.enabled ? '✓ Enabled' : '○ Disabled'}
                    </span>
                </div>
                
                <!-- Description -->
                <div>
                    <h4 class="text-sm font-semibold mb-2" style="color: #9aa5ce;">Description</h4>
                    <p style="color: #c0caf5;">${escapeHtml(currentSkill.description)}</p>
                </div>
                
                <!-- Purpose -->
                ${currentSkill.purpose ? `
                <div>
                    <h4 class="text-sm font-semibold mb-2" style="color: #9aa5ce;">Purpose</h4>
                    <pre class="whitespace-pre-wrap text-sm p-3 rounded" style="background-color: #1a1b26; color: #c0caf5;">${escapeHtml(currentSkill.purpose)}</pre>
                </div>
                ` : ''}
                
                <!-- Tools -->
                ${currentSkill.tools && currentSkill.tools.length > 0 ? `
                <div>
                    <h4 class="text-sm font-semibold mb-2" style="color: #9aa5ce;">Tools (${currentSkill.tools.length})</h4>
                    <div class="space-y-2">
                        ${currentSkill.tools.map(tool => `
                            <div class="flex items-center space-x-2 text-sm p-2 rounded" style="background-color: #1a1b26;">
                                <span style="color: #7aa2f7;">📄</span>
                                <span style="color: #c0caf5;">${escapeHtml(tool.name)}</span>
                                <span class="text-xs px-2 py-0.5 rounded" style="background-color: #414868; color: #9aa5ce;">${escapeHtml(tool.type)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Workflows -->
                ${currentSkill.workflows && currentSkill.workflows.length > 0 ? `
                <div>
                    <h4 class="text-sm font-semibold mb-2" style="color: #9aa5ce;">Workflows (${currentSkill.workflows.length})</h4>
                    <div class="space-y-2">
                        ${currentSkill.workflows.map(workflow => `
                            <div class="flex items-center space-x-2 text-sm p-2 rounded" style="background-color: #1a1b26;">
                                <span style="color: #bb9af7;">🔄</span>
                                <span style="color: #c0caf5;">${escapeHtml(workflow.name)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Context Files -->
                ${currentSkill.context && currentSkill.context.length > 0 ? `
                <div>
                    <h4 class="text-sm font-semibold mb-2" style="color: #9aa5ce;">Context Files (${currentSkill.context.length})</h4>
                    <div class="space-y-2">
                        ${currentSkill.context.map(ctx => `
                            <div class="flex items-center space-x-2 text-sm p-2 rounded" style="background-color: #1a1b26;">
                                <span style="color: #e0af68;">📋</span>
                                <span style="color: #c0caf5;">${escapeHtml(ctx.name)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Path -->
                <div>
                    <h4 class="text-sm font-semibold mb-2" style="color: #9aa5ce;">Location</h4>
                    <code class="text-xs px-2 py-1 rounded block" style="background-color: #1a1b26; color: #7aa2f7;">${escapeHtml(currentSkill.path)}</code>
                </div>
            </div>
        `;
        
        document.getElementById('modal-content').innerHTML = content;
        
        // Show modal
        const modal = document.getElementById('skill-modal');
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Failed to load skill details:', error);
        showToast('Failed to load skill details', 'error');
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('skill-modal');
    modal.style.display = 'none';
    currentSkill = null;
}

// Execute current skill
async function executeCurrentSkill() {
    if (!currentSkill) return;
    
    showToast('Skill execution not yet implemented', 'info');
    // TODO: Implement skill execution
}

// Toggle skill enabled/disabled
async function toggleSkill(skillId, enabled) {
    // TODO: Implement skill toggle in backend
    showToast(`Skill ${enabled ? 'enabled' : 'disabled'} (feature coming soon)`, 'info');
    
    // Update local state
    const skill = allSkills.find(s => s.id === skillId);
    if (skill) {
        skill.enabled = enabled;
        updateStats();
    }
}

// Show error message
function showError(message) {
    const container = document.getElementById('skills-container');
    container.innerHTML = `
        <div class="text-center py-12">
            <div class="text-4xl mb-4" style="color: #f7768e;">⚠️</div>
            <p style="color: #f7768e;">${escapeHtml(message)}</p>
            <button onclick="loadSkills()" class="mt-4 bg-primary hover:bg-opacity-80 px-4 py-2 rounded-lg" style="color: #1a1b26;">
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
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }
`;
document.head.appendChild(style);
