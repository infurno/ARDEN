/**
 * Settings Routes
 * Handles reading and updating ARDEN configuration
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

// Path to arden.json config file
const CONFIG_PATH = path.join(__dirname, '../../config/arden.json');

/**
 * GET /api/settings
 * Read current configuration
 */
router.get('/', async (req, res) => {
    try {
        logger.system.info('Reading configuration from ' + CONFIG_PATH);
        
        // Read config file
        const configData = await fs.readFile(CONFIG_PATH, 'utf8');
        const config = JSON.parse(configData);
        
        res.json({
            success: true,
            config: config
        });
    } catch (error) {
        logger.system.error('Error reading config:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to read configuration: ' + error.message
        });
    }
});

/**
 * PUT /api/settings
 * Update configuration
 */
router.put('/', async (req, res) => {
    try {
        const { config } = req.body;
        
        if (!config) {
            return res.status(400).json({
                success: false,
                error: 'Configuration data is required'
            });
        }
        
        logger.system.info('Updating configuration');
        
        // Validate config structure (basic validation)
        if (!config.version || !config.name) {
            return res.status(400).json({
                success: false,
                error: 'Invalid configuration structure'
            });
        }
        
        // Create backup of current config
        try {
            const currentConfig = await fs.readFile(CONFIG_PATH, 'utf8');
            const backupPath = CONFIG_PATH + '.backup.' + Date.now();
            await fs.writeFile(backupPath, currentConfig, 'utf8');
            logger.system.info('Created config backup at ' + backupPath);
        } catch (backupError) {
            logger.system.warn('Could not create backup:', backupError);
        }
        
        // Write new config
        await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
        
        logger.system.info('Configuration updated successfully');
        
        res.json({
            success: true,
            message: 'Configuration updated successfully'
        });
    } catch (error) {
        logger.system.error('Error updating config:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update configuration: ' + error.message
        });
    }
});

module.exports = router;
