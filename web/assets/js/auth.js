/**
 * Authentication Handler
 * 
 * Handles login form submission
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const tokenInput = document.getElementById('token');
    const loginButton = document.getElementById('login-button');
    const loginText = document.getElementById('login-text');
    const loginSpinner = document.getElementById('login-spinner');
    const errorMessage = document.getElementById('error-message');
    
    // Show error
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }
    
    // Hide error
    function hideError() {
        errorMessage.classList.add('hidden');
    }
    
    // Set loading state
    function setLoading(loading) {
        if (loading) {
            loginButton.disabled = true;
            loginText.textContent = 'Logging in...';
            loginSpinner.classList.remove('hidden');
            tokenInput.disabled = true;
        } else {
            loginButton.disabled = false;
            loginText.textContent = 'Login';
            loginSpinner.classList.add('hidden');
            tokenInput.disabled = false;
        }
    }
    
    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();
        
        const token = tokenInput.value.trim();
        
        if (!token) {
            showError('Please enter your API token');
            return;
        }
        
        setLoading(true);
        
        try {
            // Simple API call without using the API client
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ token }),
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Redirect to dashboard
                window.location.href = '/dashboard.html';
            } else {
                showError(data.error || 'Login failed');
                setLoading(false);
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Connection error. Please try again.');
            setLoading(false);
        }
    });
    
    // Focus token input on load
    tokenInput.focus();
});
