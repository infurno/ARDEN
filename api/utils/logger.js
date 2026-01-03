/**
 * Logger Module
 * 
 * Centralized logging using Winston with multiple transports
 */

const winston = require('winston');
const path = require('path');

// Determine ARDEN_ROOT
const ARDEN_ROOT = process.env.ARDEN_ROOT || path.resolve(__dirname, '../..');

// Log levels: error, warn, info, http, verbose, debug, silly
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
};

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// JSON format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    // Console output
    new winston.transports.Console({
      format: consoleFormat,
      silent: process.env.NODE_ENV === 'test', // Quiet during tests
    }),
    
    // Error log file
    new winston.transports.File({
      filename: path.join(ARDEN_ROOT, 'api/logs/error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(ARDEN_ROOT, 'api/logs/combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  // Handle exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(ARDEN_ROOT, 'api/logs/exceptions.log'),
      format: fileFormat,
    }),
  ],
  // Handle promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(ARDEN_ROOT, 'api/logs/rejections.log'),
      format: fileFormat,
    }),
  ],
});

/**
 * Log voice processing events
 */
logger.voice = {
  transcribe: (userId, duration, provider) => {
    logger.info('Voice transcription', { 
      event: 'voice_transcribe',
      userId, 
      duration, 
      provider 
    });
  },
  
  synthesize: (userId, textLength, provider) => {
    logger.info('Voice synthesis', {
      event: 'voice_synthesize',
      userId,
      textLength,
      provider
    });
  },
  
  error: (userId, error, provider) => {
    logger.error('Voice processing error', {
      event: 'voice_error',
      userId,
      error: error.message,
      provider
    });
  },
};

/**
 * Log AI provider interactions
 */
logger.ai = {
  request: (userId, provider, model, promptLength) => {
    logger.info('AI request', {
      event: 'ai_request',
      userId,
      provider,
      model,
      promptLength
    });
  },
  
  response: (userId, provider, responseLength, duration) => {
    logger.info('AI response', {
      event: 'ai_response',
      userId,
      provider,
      responseLength,
      duration
    });
  },
  
  error: (userId, provider, error) => {
    logger.error('AI provider error', {
      event: 'ai_error',
      userId,
      provider,
      error: error.message
    });
  },
};

/**
 * Log rate limiting events
 */
logger.rateLimit = {
  allowed: (userId, remaining) => {
    logger.debug('Rate limit check passed', {
      event: 'rate_limit_allowed',
      userId,
      remaining
    });
  },
  
  blocked: (userId, waitTime) => {
    logger.warn('Rate limit exceeded', {
      event: 'rate_limit_blocked',
      userId,
      waitTime
    });
  },
};

/**
 * Log user interactions
 */
logger.user = {
  message: (userId, username, type) => {
    logger.info('User message received', {
      event: 'user_message',
      userId,
      username,
      type // 'text' or 'voice'
    });
  },
  
  unauthorized: (userId, username) => {
    logger.warn('Unauthorized access attempt', {
      event: 'unauthorized',
      userId,
      username
    });
  },
};

/**
 * Log system events
 */
logger.system = {
  startup: (config) => {
    logger.info('ARDEN bot starting', {
      event: 'system_startup',
      aiProvider: config.aiProvider,
      voiceEnabled: config.voiceEnabled,
      sttProvider: config.sttProvider,
      ttsProvider: config.ttsProvider
    });
  },
  
  ready: () => {
    logger.info('ARDEN bot ready', {
      event: 'system_ready'
    });
  },
  
  error: (error) => {
    logger.error('System error', {
      event: 'system_error',
      error: error.message,
      stack: error.stack
    });
  },
};

module.exports = logger;
