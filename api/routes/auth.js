/**
 * Authentication Routes
 * 
 * Handles login, logout, and session management
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { verifyToken } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Authenticate user with token
 */
router.post('/login', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    logger.system.warn('Login attempt without token');
    return res.status(400).json({ 
      success: false, 
      error: 'Token required' 
    });
  }
  
  if (verifyToken(token)) {
    // Set session
    req.session.authenticated = true;
    req.session.loginTime = new Date().toISOString();
    
    logger.system.info('Successful login', {
      ip: req.ip,
      timestamp: req.session.loginTime
    });
    
    return res.json({ 
      success: true,
      message: 'Authentication successful'
    });
  }
  
  logger.system.warn('Failed login attempt', {
    ip: req.ip
  });
  
  return res.status(401).json({ 
    success: false, 
    error: 'Invalid token' 
  });
});

/**
 * POST /api/auth/logout
 * End user session
 */
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        logger.system.error('Error destroying session', { error: err.message });
        return res.status(500).json({ 
          success: false, 
          error: 'Logout failed' 
        });
      }
      
      logger.system.info('User logged out', { ip: req.ip });
      
      return res.json({ 
        success: true,
        message: 'Logged out successfully'
      });
    });
  } else {
    return res.json({ 
      success: true,
      message: 'No active session'
    });
  }
});

/**
 * GET /api/auth/verify
 * Check if current session is authenticated
 */
router.get('/verify', (req, res) => {
  const isAuthenticated = req.session && req.session.authenticated;
  
  return res.json({ 
    authenticated: isAuthenticated,
    loginTime: req.session?.loginTime || null
  });
});

module.exports = router;
