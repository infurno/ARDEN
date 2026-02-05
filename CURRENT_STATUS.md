# ARDEN Project Status - January 7, 2026

## Current Production Deployment

**VPS:** `rocket.id10t.social` (Ubuntu 24.04 LTS)  
**User:** `arden`  
**Deployment Method:** Ansible  
**Status:** ✅ Fully Operational

### Live Services

#### 1. Web Dashboard
- **URL:** https://rocket.id10t.social
- **Port:** 3001 (proxied via Nginx with SSL)
- **Features:**
  - Chat interface with OpenAI gpt-4o-mini
  - Notes management (Markdown editor)
  - TODO tracking
  - Skills configuration
  - System monitoring (CPU, memory, disk)
  - **Session Management** (NEW!)
    - View all active sessions
    - Kill individual sessions
    - Cleanup expired sessions
    - Real-time stats (auto-refresh)
  - Analytics dashboard
  - Settings management
- **Authentication:** Token-based (ARDEN_API_TOKEN)
- **PM2 Process:** `arden-web`

#### 2. Discord Bot
- **Status:** ✅ Online
- **Bot Name:** ARDEN BOT#6497
- **Bot ID:** 1458599213570064517
- **Features:**
  - Direct messages (DMs)
  - Server channel mentions (@ARDEN BOT)
  - Commands: !help, !status, !ping, !clear
  - Rate limiting: 10 messages/min per user
  - AI Provider: OpenAI gpt-4o-mini
  - Message chunking (2000 char limit)
- **PM2 Process:** `arden-discord`
- **Documentation:** [Discord Setup Guide](docs/DISCORD_SETUP.md)

#### 3. Telegram Bot  
- **Status:** ✅ Online
- **Token:** your-telegram-token
- **Features:**
  - Voice message support
  - Text messages
  - Commands support
  - AI Provider: OpenAI gpt-4o-mini
- **PM2 Process:** `arden-bot`

## Architecture

### Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Stack                          │
├─────────────────────────────────────────────────────────────┤
│  VPS: rocket.id10t.social (Ubuntu 24.04 LTS)                │
│  ├─ Node.js 20 LTS (via NVM)                                │
│  ├─ Discord.js (Discord bot)                                │
│  ├─ node-telegram-bot-api (Telegram bot)                    │
│  ├─ Express.js (Web server)                                 │
│  ├─ SQLite (Session & data persistence)                     │
│  ├─ PM2 (Process management)                                │
│  ├─ Nginx (Reverse proxy + SSL)                             │
│  └─ Let's Encrypt (SSL certificates)                        │
│                                                              │
│  AI Provider: OpenAI                                         │
│  └─ Model: gpt-4o-mini                                      │
└──────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
/home/arden/ARDEN/
├── api/                          # Backend services
│   ├── discord-bot.js           # Discord bot (NEW!)
│   ├── telegram-bot.js          # Telegram bot
│   ├── web-server.js            # Web dashboard server
│   ├── routes/                  # API endpoints
│   │   ├── sessions.js          # Session management (NEW!)
│   │   ├── auth.js              # Authentication
│   │   ├── chat.js              # Chat API
│   │   ├── notes.js             # Notes CRUD
│   │   ├── todos.js             # TODO management
│   │   ├── skills.js            # Skills API
│   │   └── analytics.js         # Analytics data
│   ├── services/                # Business logic
│   │   ├── ai-providers.js      # AI integration
│   │   ├── database.js          # SQLite operations
│   │   ├── session-store.js     # Session persistence
│   │   └── websocket.js         # Real-time updates
│   ├── handlers/                # Message handlers
│   ├── middleware/              # Express middleware
│   └── utils/                   # Utilities
├── web/                         # Frontend (static files)
│   ├── dashboard.html
│   ├── chat.html
│   ├── notes.html
│   ├── todos.html
│   ├── skills.html
│   ├── sessions.html            # Session management UI (NEW!)
│   ├── settings.html
│   └── assets/                  # CSS, JS, images
├── ansible/                     # Deployment automation
│   ├── deploy.yml               # Main playbook
│   ├── inventory.yml            # Server configuration
│   └── roles/                   # Ansible roles
│       ├── system/              # Ubuntu packages, firewall
│       ├── nodejs/              # Node.js + NVM + PM2
│       ├── application/         # Git clone, npm install
│       ├── nginx/               # Reverse proxy + SSL
│       ├── pm2/                 # Process management
│       └── backup/              # Daily backups
├── docs/                        # Documentation
│   ├── DISCORD_SETUP.md         # Discord bot setup (NEW!)
│   ├── UBUNTU_24_04_NOTES.md
│   └── ...
├── config/                      # Configuration
│   └── arden.json               # Main config
├── data/                        # SQLite database
│   └── arden.db
├── voice/                       # Voice processing
│   ├── recordings/
│   └── responses/
├── .env                         # Environment variables
├── ecosystem.config.js          # PM2 configuration
└── package.json                 # Dependencies
```

## Configuration

### Environment Variables (.env on VPS)

```bash
# AI Provider
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-proj-...

# Bots
TELEGRAM_BOT_TOKEN=your-telegram-token
DISCORD_BOT_TOKEN=your-discord-token

# Security
ARDEN_API_TOKEN=your-api-token

# Optional Services
ELEVENLABS_API_KEY=your-elevenlabs-key
```

### PM2 Processes

```bash
┌────┬──────────────────┬─────────┬──────────┬────────┐
│ id │ name             │ status  │ memory   │ uptime │
├────┼──────────────────┼─────────┼──────────┼────────┤
│ 0  │ arden-bot        │ online  │ 74.0mb   │ 2h     │
│ 1  │ arden-web        │ online  │ 66.6mb   │ 2h     │
│ 2  │ arden-discord    │ online  │ 54.2mb   │ 1h     │
└────┴──────────────────┴─────────┴──────────┴────────┘
```

## Recent Updates (This Session)

### 1. Session Management Feature ✅
**Added:** Jan 7, 2026

- New REST API: `/api/sessions`
  - `GET /api/sessions` - List all sessions with stats
  - `GET /api/sessions/stats` - Session statistics
  - `DELETE /api/sessions/:id` - Kill specific session
  - `DELETE /api/sessions` - Kill all (except current)
  - `POST /api/sessions/cleanup` - Cleanup expired

- New UI: `/sessions.html`
  - Statistics cards (total, active, idle, web, telegram)
  - Sessions table with full details
  - Kill session buttons (with protection)
  - Auto-refresh every 10 seconds
  - Confirmation modals

- **Purpose:** Memory management and session monitoring

### 2. Discord Bot Support ✅
**Added:** Jan 7, 2026

- Full Discord.js integration
- File: `api/discord-bot.js` (383 lines)
- Features:
  - DM support (just send a message)
  - Server mentions (@ARDEN BOT)
  - Built-in commands (!help, !status, !ping, !clear)
  - Rate limiting (10 req/min per user)
  - Authorization via config.json
  - Message chunking (2000 char limit)
  - Typing indicators
  - Status: "Watching your messages | !help"

- **Why Discord?**
  - Zero spam (private servers, invite-only)
  - Better than Telegram for control
  - Excellent mobile apps
  - Rich formatting support

- Documentation: `docs/DISCORD_SETUP.md`

### 3. AI Provider Configuration ✅
**Fixed:** Jan 7, 2026

- VPS now correctly using OpenAI gpt-4o-mini
- All bots (Telegram, Discord, Web) use same AI provider
- Dashboard shows correct provider info

### 4. Deployment Updates ✅

- Updated Ansible inventory with Discord bot
- Updated PM2 ecosystem config
- All services auto-start on boot
- Daily backups at 2 AM (7-day retention)

## Development Workflow

### Local Development

```bash
# Location
/Users/hal/ARDEN

# Install dependencies
cd api && npm install

# Test locally
node api/discord-bot.js
node api/telegram-bot.js
node api/web-server.js

# Or use PM2
pm2 start ecosystem.config.js
```

### Deployment Process

**Method 1: Ansible (Recommended)**
```bash
cd /Users/hal/ARDEN/ansible
ansible-playbook deploy.yml
```

**Method 2: Quick Update**
```bash
# Push changes
git add .
git commit -m "Your changes"
git push origin arden-prod

# Deploy
cd ansible
ansible-playbook deploy.yml --tags application,pm2
```

**Method 3: Manual**
```bash
ssh arden@rocket.id10t.social
cd ~/ARDEN
git pull origin arden-prod
npm install
source ~/.nvm/nvm.sh
pm2 restart all --update-env
pm2 save
```

### Git Workflow

```bash
# Current branch
arden-prod

# Remote
git@github.com:infurno/ARDEN.git (public)

# Recent commits
29be7f3 - Add Discord bot support
62c8b93 - Add session management feature
270047f - Fix port number (3001)
```

## Database Schema

### SQLite Database: `data/arden.db`

**Tables:**
- `sessions` - User sessions (web + bots)
- `chat_history` - Conversation history
- `notes` - Note-taking system
- `todos` - Task management
- `skill_executions` - Skill tracking
- `api_usage` - AI API usage logs
- `settings` - User preferences

**Key Functions:**
- `getActiveSessions()` - Session monitoring
- `getChatHistory()` - Conversation retrieval
- `saveNote()` - Note persistence
- `recordApiUsage()` - Usage tracking

## Access & Credentials

### SSH Access
```bash
ssh arden@rocket.id10t.social
# Password-based (consider adding SSH keys)
```

### Web Dashboard
- **URL:** https://rocket.id10t.social
- **Token:** `your-api-token`

### Discord Bot
- **Application ID:** Get from Discord Developer Portal
- **Invite URL Template:**
  ```
  https://discord.com/api/oauth2/authorize?client_id=YOUR_APP_ID&permissions=2147485696&scope=bot
  ```

### Telegram Bot
- **Username:** Find via @BotFather
- **Token:** In .env file

## Monitoring & Maintenance

### Check System Health

```bash
ssh arden@rocket.id10t.social

# PM2 status
source ~/.nvm/nvm.sh
pm2 status

# View logs
pm2 logs arden-discord --lines 50
pm2 logs arden-web --lines 50
pm2 logs arden-bot --lines 50

# System resources
htop

# Nginx status
sudo systemctl status nginx

# SSL certificate
sudo certbot certificates
```

### Daily Backups

- **Schedule:** 2:00 AM daily
- **Location:** `/home/arden/backups/`
- **Retention:** 7 days
- **Includes:**
  - SQLite database
  - .env file
  - PM2 config
  - Logs

**Script:** `/home/arden/backup.sh`

### Update AI Model

```bash
ssh arden@rocket.id10t.social
nano ~/ARDEN/.env

# Change:
OPENAI_MODEL=gpt-4o-mini
# To:
OPENAI_MODEL=gpt-4o

# Restart
source ~/.nvm/nvm.sh
pm2 restart all --update-env
```

## Key Features

### 1. Multi-Platform Access
- ✅ Web Dashboard (desktop/mobile browser)
- ✅ Discord Bot (desktop/mobile app)
- ✅ Telegram Bot (desktop/mobile app)

### 2. Session Management
- View all active sessions across platforms
- Kill idle sessions to free memory
- Monitor session duration and activity
- Automatic cleanup of expired sessions

### 3. AI Integration
- Provider: OpenAI
- Model: gpt-4o-mini
- Shared across all platforms
- Context-aware conversations

### 4. Notes System
- Markdown editor
- File attachments
- Search functionality
- Organized by categories

### 5. Task Management
- TODO lists
- Priority levels
- Due dates
- Completion tracking

### 6. Analytics
- Session statistics
- API usage tracking
- Skill execution logs
- System metrics

## Documentation Index

### Setup Guides
- [Discord Bot Setup](docs/DISCORD_SETUP.md) - Complete Discord configuration
- [Quick Start](docs/QUICK_START.md) - Getting started guide
- [Linux Deployment](docs/LINUX_DEPLOYMENT.md) - VPS deployment guide
- [Ubuntu 24.04 Notes](docs/UBUNTU_24_04_NOTES.md) - Ubuntu-specific info

### Technical Documentation
- [Architecture](docs/architecture.md) - System architecture
- [Voice Setup](docs/voice.md) - Voice feature configuration
- [Web Interface](docs/WEB-INTERFACE-README.md) - Dashboard documentation

### Deployment
- [Deployment Rocket](DEPLOYMENT_ROCKET.md) - Rocket VPS deployment
- [VPS Deployment Checklist](VPS_DEPLOYMENT_CHECKLIST.md) - Pre-deployment checklist
- Ansible playbooks in `ansible/` directory

### Project Context
- [Project Summary](PROJECT_SUMMARY.md) - Overall project status
- [Session State](SESSION_STATE.md) - Session management details
- [TODO List](TODO_LIST.md) - Pending tasks

## Troubleshooting

### Discord Bot Not Responding

1. **Check MESSAGE CONTENT INTENT is enabled**
   - Discord Developer Portal → Bot → Privileged Gateway Intents
   - ✅ MESSAGE CONTENT INTENT must be ON

2. **Verify bot is online**
   ```bash
   pm2 status
   pm2 logs arden-discord
   ```

3. **Check token is valid**
   ```bash
   grep DISCORD_BOT_TOKEN ~/ARDEN/.env
   ```

4. **Restart with updated env**
   ```bash
   pm2 restart arden-discord --update-env
   ```

### Web Dashboard Not Loading

1. **Check Nginx**
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

2. **Check PM2**
   ```bash
   pm2 status
   pm2 logs arden-web
   ```

3. **Check port**
   ```bash
   sudo netstat -tlnp | grep 3001
   ```

### AI Responses Failing

1. **Verify API key**
   ```bash
   grep OPENAI_API_KEY ~/ARDEN/.env
   ```

2. **Check provider setting**
   ```bash
   grep AI_PROVIDER ~/ARDEN/.env
   # Should be: AI_PROVIDER=openai
   ```

3. **View error logs**
   ```bash
   pm2 logs --err
   ```

## Future Enhancements

### Planned Features
- [ ] Slash commands for Discord bot
- [ ] Voice channel support in Discord
- [ ] Web push notifications
- [ ] Mobile PWA
- [ ] Multi-user support with roles
- [ ] Enhanced analytics dashboards
- [ ] Custom AI fine-tuning
- [ ] Integration with calendar services
- [ ] Email notifications

### Infrastructure
- [ ] Add SSH key authentication
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Implement log rotation
- [ ] Add Redis for caching
- [ ] Database backups to S3
- [ ] Staging environment

## Contact & Support

**Repository:** https://github.com/infurno/ARDEN  
**Branch:** arden-prod  
**VPS:** rocket.id10t.social  
**Admin:** hal@borlandtech.com

---

**Last Updated:** January 7, 2026  
**Status:** Production - Fully Operational  
**Version:** 1.0.0
