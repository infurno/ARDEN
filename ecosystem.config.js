module.exports = {
  apps: [
    {
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
      error_file: './logs/pm2-bot-error.log',
      out_file: './logs/pm2-bot-out.log',
      log_file: './logs/pm2-bot-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'arden-web',
      script: './api/web-server.js',
      cwd: '/home/arden/ARDEN',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        WEB_PORT: 3000,
        WEB_HOST: '0.0.0.0'
      },
      error_file: './logs/pm2-web-error.log',
      out_file: './logs/pm2-web-out.log',
      log_file: './logs/pm2-web-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
