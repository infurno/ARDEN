/**
 * Mobile Navigation Enhancement for ARDEN Web Interface
 * 
 * This script adds a mobile-responsive hamburger menu to all pages
 * that have the standard ARDEN header structure.
 */

(function() {
    'use strict';
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        enhanceNavigation();
        addMobileMenuButton();
        createMobileMenu();
        setupEventListeners();
        highlightActivePage();
    }
    
    /**
     * Enhance existing navigation for mobile responsiveness
     */
    function enhanceNavigation() {
        const header = document.querySelector('header');
        if (!header) return;
        
        // Find the existing navigation
        const nav = header.querySelector('nav');
        if (!nav) return;
        
        // Ensure navigation is hidden on mobile
        if (!nav.classList.contains('hidden') && !nav.classList.contains('md:flex')) {
            nav.classList.add('hidden', 'md:flex');
        }
        
        // Add data attributes to nav links for mobile menu
        const links = nav.querySelectorAll('a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                const page = href.replace('.html', '').replace('/', '');
                link.setAttribute('data-page', page);
                link.classList.add('nav-link');
            }
        });
        
        // Hide status indicator on mobile
        const statusIndicator = document.getElementById('status-indicator');
        if (statusIndicator) {
            statusIndicator.classList.remove('flex');
            statusIndicator.classList.add('hidden', 'md:flex');
        }
        
        // Hide logout button on mobile
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.classList.add('hidden', 'md:block');
        }
    }
    
    /**
     * Add mobile menu button to header
     */
    function addMobileMenuButton() {
        const header = document.querySelector('header');
        if (!header) return;
        
        // Check if button already exists
        if (document.getElementById('mobile-menu-button')) return;
        
        // Find the right-side button container
        const buttonContainer = header.querySelector('.flex.items-center.space-x-4');
        if (!buttonContainer) return;
        
        // Create mobile menu button
        const button = document.createElement('button');
        button.id = 'mobile-menu-button';
        button.className = 'md:hidden text-2xl hover:text-primary tn-text-secondary';
        button.title = 'Menu';
        button.textContent = '☰';
        button.setAttribute('aria-label', 'Toggle mobile menu');
        
        // Insert before logout button or at the end
        buttonContainer.appendChild(button);
    }
    
    /**
     * Create mobile menu structure
     */
    function createMobileMenu() {
        const header = document.querySelector('header');
        if (!header) return;
        
        // Check if menu already exists
        if (document.getElementById('mobile-menu')) return;
        
        // Get nav links
        const desktopNav = header.querySelector('nav');
        if (!desktopNav) return;
        
        const links = desktopNav.querySelectorAll('a');
        
        // Page emoji mapping
        const pageEmojis = {
            'chat': '💬',
            'notes': '📝',
            'todos': '✓',
            'skills': '🛠️',
            'dashboard': '📊',
            'sessions': '👥',
            'settings': '⚙️'
        };
        
        // Create mobile menu container
        const mobileMenu = document.createElement('nav');
        mobileMenu.id = 'mobile-menu';
        mobileMenu.className = 'hidden md:hidden mt-4 pb-2 space-y-2';
        
        // Add navigation links
        links.forEach(link => {
            const mobileLink = document.createElement('a');
            mobileLink.href = link.href;
            mobileLink.className = 'block py-2 px-4 hover:bg-background rounded tn-text-secondary no-underline mobile-nav-link';
            
            const page = link.getAttribute('data-page') || '';
            mobileLink.setAttribute('data-page', page);
            
            const emoji = pageEmojis[page] || '';
            mobileLink.textContent = `${emoji} ${link.textContent}`.trim();
            
            mobileMenu.appendChild(mobileLink);
        });
        
        // Add divider
        const divider = document.createElement('div');
        divider.className = 'border-t border-border my-2';
        mobileMenu.appendChild(divider);
        
        // Add status indicator for mobile
        const statusIndicator = document.getElementById('status-indicator');
        if (statusIndicator) {
            const mobileStatus = document.createElement('div');
            mobileStatus.id = 'mobile-status-indicator';
            mobileStatus.className = 'py-2 px-4 flex items-center space-x-2';
            mobileStatus.innerHTML = statusIndicator.innerHTML;
            mobileMenu.appendChild(mobileStatus);
        }
        
        // Add mobile logout button
        const desktopLogout = document.getElementById('logout-button');
        if (desktopLogout) {
            const mobileLogout = document.createElement('button');
            mobileLogout.id = 'mobile-logout-button';
            mobileLogout.className = 'w-full text-left py-2 px-4 hover:bg-background rounded text-danger';
            mobileLogout.textContent = '🚪 Logout';
            mobileMenu.appendChild(mobileLogout);
        }
        
        // Insert mobile menu into header
        const headerContainer = header.querySelector('.max-w-6xl');
        if (headerContainer) {
            headerContainer.appendChild(mobileMenu);
        }
    }
    
    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileLogoutButton = document.getElementById('mobile-logout-button');
        const logoutButton = document.getElementById('logout-button');
        
        // Toggle mobile menu
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', function() {
                mobileMenu.classList.toggle('hidden');
                
                // Toggle icon
                if (mobileMenu.classList.contains('hidden')) {
                    mobileMenuButton.textContent = '☰';
                } else {
                    mobileMenuButton.textContent = '✕';
                }
            });
            
            // Close menu when clicking a link
            const mobileLinks = mobileMenu.querySelectorAll('a');
            mobileLinks.forEach(link => {
                link.addEventListener('click', function() {
                    mobileMenu.classList.add('hidden');
                    mobileMenuButton.textContent = '☰';
                });
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', function(event) {
                if (!mobileMenu.contains(event.target) && 
                    !mobileMenuButton.contains(event.target) && 
                    !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                    mobileMenuButton.textContent = '☰';
                }
            });
        }
        
        // Sync mobile logout with desktop logout
        if (mobileLogoutButton && logoutButton) {
            mobileLogoutButton.addEventListener('click', function() {
                logoutButton.click();
            });
        }
        
        // Sync status indicators
        const mobileStatusIndicator = document.getElementById('mobile-status-indicator');
        const statusIndicator = document.getElementById('status-indicator');
        
        if (mobileStatusIndicator && statusIndicator) {
            const observer = new MutationObserver(function() {
                mobileStatusIndicator.innerHTML = statusIndicator.innerHTML;
            });
            observer.observe(statusIndicator, { childList: true, subtree: true, characterData: true });
        }
    }
    
    /**
     * Highlight active page in navigation
     */
    function highlightActivePage() {
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'dashboard';
        
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            if (link.getAttribute('data-page') === currentPage) {
                link.classList.add('text-primary', 'font-medium');
                link.style.textDecoration = 'none';
            } else {
                link.classList.remove('text-primary', 'font-medium');
            }
        });
    }
    
    // Add CSS for mobile navigation
    const style = document.createElement('style');
    style.textContent = `
        /* Mobile navigation enhancements */
        .nav-link, .mobile-nav-link {
            text-decoration: none !important;
        }
        
        #mobile-menu {
            transition: all 0.3s ease-in-out;
        }
        
        .nav-link.text-primary,
        .mobile-nav-link.text-primary {
            color: #7aa2f7 !important;
            font-weight: 500;
        }
        
        /* Ensure mobile menu button is visible */
        @media (max-width: 768px) {
            #mobile-menu-button {
                display: block;
            }
        }
    `;
    document.head.appendChild(style);
    
})();
