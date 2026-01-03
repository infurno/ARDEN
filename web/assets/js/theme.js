/**
 * ARDEN Theme Switcher
 * Shared theme management for all pages
 */

// Initialize theme on page load
function initArdenTheme() {
  const savedTheme = localStorage.getItem('arden-theme') || 'dark';
  const htmlElement = document.documentElement;
  
  if (savedTheme === 'light') {
    htmlElement.classList.remove('dark');
  } else {
    htmlElement.classList.add('dark');
  }
  
  updateThemeIcon(savedTheme === 'dark');
  
  // Setup theme toggle button
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleArdenTheme);
  }
}

// Toggle theme between dark and light
function toggleArdenTheme() {
  const htmlElement = document.documentElement;
  const isDark = htmlElement.classList.toggle('dark');
  
  localStorage.setItem('arden-theme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);
}

// Update theme toggle button icon and title
function updateThemeIcon(isDark) {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    themeToggle.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  }
}

// Initialize theme immediately (before DOMContentLoaded to prevent flash)
(function() {
  const savedTheme = localStorage.getItem('arden-theme') || 'dark';
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  }
})();

// Initialize theme management when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initArdenTheme);
} else {
  initArdenTheme();
}
