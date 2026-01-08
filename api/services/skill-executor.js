/**
 * Skill Executor Service
 * Executes ARDEN skills by detecting patterns and running the appropriate scripts
 */

const { exec } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');

const ARDEN_ROOT = path.resolve(__dirname, '../..');

/**
 * Detect if message is requesting weather information
 */
function detectWeatherRequest(message) {
  const weatherPatterns = [
    /weather\s+in\s+(.+)/i,
    /weather\s+for\s+(.+)/i,
    /what'?s\s+the\s+weather\s+in\s+(.+)/i,
    /what'?s\s+the\s+weather\s+for\s+(.+)/i,
    /how'?s\s+the\s+weather\s+in\s+(.+)/i,
    /temperature\s+in\s+(.+)/i,
    /current\s+conditions?\s+(?:for|in)\s+(.+)/i,
    /conditions?\s+(?:for|in)\s+(.+)/i,
    /forecast\s+(?:for|in)\s+(.+)/i,
  ];

  for (const pattern of weatherPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Execute weather skill
 */
function executeWeatherSkill(location) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(ARDEN_ROOT, 'skills/weather/tools/get-weather.sh');
    const command = `bash "${scriptPath}" "${location}"`;

    logger.system.info('Executing weather skill', { location, command });

    exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
      if (error) {
        logger.system.error('Weather skill execution failed', { 
          error: error.message, 
          stderr 
        });
        reject(new Error(`Failed to get weather: ${error.message}`));
        return;
      }

      logger.system.info('Weather skill executed successfully', { location });
      resolve(stdout.trim());
    });
  });
}

/**
 * Process message and execute skills if detected
 * Returns skill output if executed, null otherwise
 */
async function executeSkillIfDetected(message) {
  // Check for weather request
  const weatherLocation = detectWeatherRequest(message);
  if (weatherLocation) {
    try {
      const weatherOutput = await executeWeatherSkill(weatherLocation);
      return weatherOutput;
    } catch (error) {
      logger.system.error('Skill execution error', { error: error.message });
      return `Error getting weather: ${error.message}`;
    }
  }

  return null;
}

module.exports = {
  executeSkillIfDetected,
  detectWeatherRequest,
  executeWeatherSkill
};
