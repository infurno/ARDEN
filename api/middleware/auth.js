/**
 * Authentication Middleware
 * 
 * Handles token-based authentication for ARDEN web interface
 */

const logger = require('../utils/logger');

/**
 * Verify API token from environment
 */
function verifyToken(token) {
  const validToken = process.env.ARDEN_API_TOKEN;
  
  if (!validToken) {
    logger.system.warn('ARDEN_API_TOKEN not set in environment');
    return false;
  }
  
  return token === validToken;
}

/**
 * Authentication middleware for protected routes
 */
function requireAuth(req, res, next) {
  // Check session
  if (req.session && req.session.authenticated) {
    return next();
  }
  
  // Check Authorization header (for API calls)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (verifyToken(token)) {
      return next();
    }
  }
  
  // Not authenticated
  logger.system.warn('Unauthorized access attempt', {
    path: req.path,
    ip: req.ip
  });
  
  // Return JSON for API routes, redirect for web pages
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Session expired. Please log in again.' 
    });
  }
  
  // For HTML pages, redirect to login
  res.redirect('/login.html');
}

/**
 * Optional auth - allows both authenticated and unauthenticated access
 */
function optionalAuth(req, res, next) {
  // Check session
  if (req.session && req.session.authenticated) {
    req.isAuthenticated = true;
  } else {
    req.isAuthenticated = false;
  }
  next();
}

module.exports = {
  verifyToken,
  requireAuth,
  optionalAuth
};
