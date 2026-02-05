#!/usr/bin/env node
/**
 * Quick test script to verify AI provider integration
 * Usage: node test-claude-api.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { executeArden } = require('./services/ai-providers');

async function testAIProvider() {
  const provider = process.env.AI_PROVIDER || 'claude';
  console.log(`🧪 Testing ${provider.toUpperCase()} integration...\n`);
  
  // Check provider-specific requirements
  if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    console.log('Get your key at: https://aistudio.google.com/apikey');
    process.exit(1);
  } else if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not found in environment');
    console.log('Get your key at: https://console.anthropic.com/settings/keys');
    process.exit(1);
  } else if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment');
    console.log('Get your key at: https://platform.openai.com/api-keys');
    process.exit(1);
  }
  
  console.log('✅ Configuration found');
  console.log(`📊 AI Provider: ${provider}`);
  
  if (provider === 'gemini') {
    console.log(`📊 Model: ${process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'}`);
  } else if (provider === 'anthropic' || provider === 'claude') {
    console.log(`📊 Model: ${process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'}`);
  } else if (provider === 'openai') {
    console.log(`📊 Model: ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`);
  }
  
  console.log('');
  
  try {
    console.log('📤 Sending test message: "Hello! What AI are you?"');
    const startTime = Date.now();
    
    const response = await executeArden(
      'Hello! What AI are you? Respond in one short sentence.',
      'test-user',
      'test-session'
    );
    
    const duration = Date.now() - startTime;
    
    console.log('\n✅ Response received!');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📝 Response: ${response}\n`);
    
    // Test execution layer with a simple command
    console.log('🧪 Testing execution layer...');
    console.log(`📤 Sending: "Take a note: Testing ${provider} integration"`);
    
    const noteResponse = await executeArden(
      `Take a note: Testing ${provider} integration`,
      'test-user',
      'test-session'
    );
    
    console.log(`\n📝 Response: ${noteResponse}\n`);
    
    console.log('✅ All tests passed!');
    console.log(`🚀 ARDEN is ready with ${provider.toUpperCase()}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error.message);
    
    if (error.message.includes('authentication') || error.message.includes('API key')) {
      console.log(`\n💡 Tip: Check that your ${provider.toUpperCase()}_API_KEY is valid`);
    }
    
    process.exit(1);
  }
}

testAIProvider();
