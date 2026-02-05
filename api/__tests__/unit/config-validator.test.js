/**
 * Configuration Validator Unit Tests
 */

const { validateConfig, validateEnvironment, getSanitizedEnvInfo } = require('../../utils/config-validator');
const { MOCK_CONFIG } = require('../fixtures');

describe('Config Validator', () => {
  describe('validateConfig()', () => {
    test('should validate correct configuration', () => {
      expect(() => validateConfig(MOCK_CONFIG)).not.toThrow();
      expect(validateConfig(MOCK_CONFIG)).toBe(true);
    });

    test('should throw error if config is null', () => {
      expect(() => validateConfig(null)).toThrow('Configuration object is required');
    });

    test('should throw error if missing required section', () => {
      const invalidConfig = { voice: {} };
      expect(() => validateConfig(invalidConfig)).toThrow('Missing required configuration section');
    });

    test('should throw error if voice.enabled is not boolean', () => {
      const invalidConfig = {
        ...MOCK_CONFIG,
        voice: { ...MOCK_CONFIG.voice, enabled: 'true' }
      };
      expect(() => validateConfig(invalidConfig)).toThrow('voice.enabled must be a boolean');
    });

    test('should throw error for invalid STT provider', () => {
      const invalidConfig = {
        ...MOCK_CONFIG,
        voice: { ...MOCK_CONFIG.voice, stt_provider: 'invalid-provider' }
      };
      expect(() => validateConfig(invalidConfig)).toThrow('Invalid STT provider');
    });

    test('should throw error for invalid TTS provider', () => {
      const invalidConfig = {
        ...MOCK_CONFIG,
        voice: { ...MOCK_CONFIG.voice, tts_provider: 'invalid-provider' }
      };
      expect(() => validateConfig(invalidConfig)).toThrow('Invalid TTS provider');
    });

    test('should throw error if allowed_users is not an array', () => {
      const invalidConfig = {
        ...MOCK_CONFIG,
        telegram: { enabled: true, allowed_users: 'not-an-array' }
      };
      expect(() => validateConfig(invalidConfig)).toThrow('telegram.allowed_users must be an array');
    });

    test('should throw error for invalid port', () => {
      const invalidConfig = {
        ...MOCK_CONFIG,
        api: { port: 99999, host: '0.0.0.0' }
      };
      expect(() => validateConfig(invalidConfig)).toThrow('api.port must be a number between 1 and 65535');
    });
  });

  describe('validateEnvironment()', () => {
    test('should pass with required environment variables', () => {
      const env = {
        TELEGRAM_BOT_TOKEN: 'test-token',
        AI_PROVIDER: 'ollama'
      };
      const result = validateEnvironment(env);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail without TELEGRAM_BOT_TOKEN', () => {
      const env = {};
      const result = validateEnvironment(env);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('TELEGRAM_BOT_TOKEN environment variable is required');
    });

    test('should require OPENAI_API_KEY when AI_PROVIDER is openai', () => {
      const env = {
        TELEGRAM_BOT_TOKEN: 'test-token',
        AI_PROVIDER: 'openai'
      };
      const result = validateEnvironment(env);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('OPENAI_API_KEY required when AI_PROVIDER=openai');
    });

    test('should validate OLLAMA_URL format', () => {
      const env = {
        TELEGRAM_BOT_TOKEN: 'test-token',
        AI_PROVIDER: 'ollama',
        OLLAMA_URL: 'invalid-url'
      };
      const result = validateEnvironment(env);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('OLLAMA_URL must be a valid HTTP/HTTPS URL');
    });

    test('should require OPENAI_API_KEY for openai-whisper STT', () => {
      const env = {
        TELEGRAM_BOT_TOKEN: 'test-token'
      };
      const config = {
        voice: { stt_provider: 'openai-whisper' }
      };
      const result = validateEnvironment(env, config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('OPENAI_API_KEY required when stt_provider is openai-whisper');
    });

    test('should require ELEVENLABS_API_KEY for elevenlabs TTS', () => {
      const env = {
        TELEGRAM_BOT_TOKEN: 'test-token'
      };
      const config = {
        voice: { tts_provider: 'elevenlabs' }
      };
      const result = validateEnvironment(env, config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('ELEVENLABS_API_KEY required when tts_provider is elevenlabs');
    });
  });

  describe('getSanitizedEnvInfo()', () => {
    test('should return sanitized environment info', () => {
      const env = {
        TELEGRAM_BOT_TOKEN: 'secret-token',
        OPENAI_API_KEY: 'sk-secret',
        AI_PROVIDER: 'openai',
        OPENAI_MODEL: 'gpt-4'
      };
      const info = getSanitizedEnvInfo(env);
      
      expect(info.AI_PROVIDER).toBe('openai');
      expect(info.OPENAI_MODEL).toBe('gpt-4');
      expect(info.HAS_TELEGRAM_TOKEN).toBe(true);
      expect(info.HAS_OPENAI_KEY).toBe(true);
      
      // Should not include actual secrets
      expect(info.TELEGRAM_BOT_TOKEN).toBeUndefined();
      expect(info.OPENAI_API_KEY).toBeUndefined();
    });

    test('should show false for missing API keys', () => {
      const env = {
        TELEGRAM_BOT_TOKEN: 'test-token'
      };
      const info = getSanitizedEnvInfo(env);
      
      expect(info.HAS_OPENAI_KEY).toBe(false);
      expect(info.HAS_ELEVENLABS_KEY).toBe(false);
    });

    test('should use default values', () => {
      const env = {
        TELEGRAM_BOT_TOKEN: 'test-token'
      };
      const info = getSanitizedEnvInfo(env);
      
      expect(info.AI_PROVIDER).toBe('claude');
      expect(info.OLLAMA_MODEL).toBe('llama3.2');
      expect(info.OPENAI_MODEL).toBe('gpt-4o-mini');
    });
  });
});
