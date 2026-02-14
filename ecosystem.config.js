/**
 * PM2 Ecosystem Configuration for ARDEN
 * Production deployment on rocket.id10t.social
 */

const path = require('path');

// Use current directory or default to /home/arden/ARDEN
const appRoot = process.env.ARDEN_ROOT || path.resolve(__dirname);

module.exports = {
  apps: [
    {
      name: 'arden-bot',
      script: 'api/telegram-bot.js',
      cwd: appRoot,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: path.join(appRoot, 'logs', 'bot-error.log'),
      out_file: path.join(appRoot, 'logs', 'bot-out.log'),
      log_file: path.join(appRoot, 'logs', 'bot-combined.log'),
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'arden-web',
      script: 'api/web-server.js',
      cwd: appRoot,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        WEB_PORT: 3001,
        WEB_HOST: '127.0.0.1'
      },
      error_file: path.join(appRoot, 'logs', 'web-error.log'),
      out_file: path.join(appRoot, 'logs', 'web-out.log'),
      log_file: path.join(appRoot, 'logs', 'web-combined.log'),
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'arden-memory',
      script: 'memory/server.py',
      cwd: appRoot,
      instances: 1,
      exec_mode: 'fork',
      interpreter: './memory/.venv/bin/python',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        MEMORY_SERVER_PORT: 3002,
        MEMORY_DB_PATH: './data/memory.db'
      },
      error_file: path.join(appRoot, 'logs', 'memory-error.log'),
      out_file: path.join(appRoot, 'logs', 'memory-out.log'),
      log_file: path.join(appRoot, 'logs', 'memory-combined.log'),
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'arden-heartbeat',
      script: 'heartbeat/main.py',
      cwd: appRoot,
      instances: 1,
      exec_mode: 'fork',
      interpreter: './heartbeat/.venv/bin/python',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        HEARTBEAT_INTERVAL: 1800,
        // Load from .env file - these will be overridden by .env if present
        PROTONMAIL_USERNAME: process.env.PROTONMAIL_USERNAME,
        PROTONMAIL_BRIDGE_PASSWORD: process.env.PROTONMAIL_BRIDGE_PASSWORD,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
      },
      error_file: path.join(appRoot, 'logs', 'heartbeat-error.log'),
      out_file: path.join(appRoot, 'logs', 'heartbeat-out.log'),
      log_file: path.join(appRoot, 'logs', 'heartbeat-combined.log'),
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
