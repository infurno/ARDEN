module.exports = {
  apps: [{
    name: 'arden-bot',
    script: './api/telegram-bot.js',
    cwd: '/home/arden/ARDEN',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PATH: process.env.PATH + ':/home/arden/ARDEN/venv/bin'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
