/**
 * Configuration Validation Module
 * 
 * Validates ARDEN configuration and environment variables
 */

/**
 * Validate configuration object structure
 * @param {Object} config - Configuration object
 * @throws {Error} If configuration is invalid
 * @returns {boolean} True if valid
 */
function validateConfig(config) {
  if (!config) {
    throw new Error('Configuration object is required');
  }

  // Check required top-level sections
  const requiredSections = ['voice', 'telegram', 'api'];
  for (const section of requiredSections) {
    if (!config[section]) {
      throw new Error(`Missing required configuration section: ${section}`);
    }
  }

  // Validate voice configuration
  if (typeof config.voice.enabled !== 'boolean') {
    throw new Error('voice.enabled must be a boolean');
  }

  const validSTTProviders = ['local-whisper', 'openai-whisper'];
  if (!validSTTProviders.includes(config.voice.stt_provider)) {
    throw new Error(`Invalid STT provider: ${config.voice.stt_provider}. Must be one of: ${validSTTProviders.join(', ')}`);
  }

  const validTTSProviders = ['elevenlabs', 'edge-tts', 'piper', 'openai-tts', 'none'];
  if (!validTTSProviders.includes(config.voice.tts_provider)) {
    throw new Error(`Invalid TTS provider: ${config.voice.tts_provider}. Must be one of: ${validTTSProviders.join(', ')}`);
  }

  // Validate telegram configuration
  if (typeof config.telegram.enabled !== 'boolean') {
    throw new Error('telegram.enabled must be a boolean');
  }

  if (!Array.isArray(config.telegram.allowed_users)) {
    throw new Error('telegram.allowed_users must be an array');
  }

  // Validate API configuration
  if (typeof config.api.port !== 'number' || config.api.port < 1 || config.api.port > 65535) {
    throw new Error('api.port must be a number between 1 and 65535');
  }

  return true;
}

/**
 * Validate environment variables
 * @param {Object} env - Environment variables object (defaults to process.env)
 * @param {Object} config - Configuration object for provider-specific validation
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validateEnvironment(env = process.env, config = {}) {
  const errors = [];

  // Telegram bot token is always required
  if (!env.TELEGRAM_BOT_TOKEN) {
    errors.push('TELEGRAM_BOT_TOKEN environment variable is required');
  }

  // Check AI provider-specific requirements
  const aiProvider = env.AI_PROVIDER || 'claude';
  
  if (aiProvider === 'openai' && !env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY required when AI_PROVIDER=openai');
  }

  if (aiProvider === 'ollama') {
    const ollamaUrl = env.OLLAMA_URL || 'http://localhost:11434';
    if (!ollamaUrl.startsWith('http://') && !ollamaUrl.startsWith('https://')) {
      errors.push('OLLAMA_URL must be a valid HTTP/HTTPS URL');
    }
  }

  // Check STT provider requirements
  if (config.voice && config.voice.stt_provider === 'openai-whisper' && !env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY required when stt_provider is openai-whisper');
  }

  // Check TTS provider requirements
  if (config.voice && config.voice.tts_provider === 'elevenlabs' && !env.ELEVENLABS_API_KEY) {
    errors.push('ELEVENLABS_API_KEY required when tts_provider is elevenlabs');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get sanitized environment info (safe for logging)
 * @param {Object} env - Environment variables object
 * @returns {Object} - Sanitized environment info
 */
function getSanitizedEnvInfo(env = process.env) {
  return {
    AI_PROVIDER: env.AI_PROVIDER || 'claude',
    OLLAMA_MODEL: env.OLLAMA_MODEL || 'llama3.2',
    OPENAI_MODEL: env.OPENAI_MODEL || 'gpt-4o-mini',
    HAS_TELEGRAM_TOKEN: !!env.TELEGRAM_BOT_TOKEN,
    HAS_OPENAI_KEY: !!env.OPENAI_API_KEY,
    HAS_ELEVENLABS_KEY: !!env.ELEVENLABS_API_KEY,
  };
}

module.exports = {
  validateConfig,
  validateEnvironment,
  getSanitizedEnvInfo,
};
