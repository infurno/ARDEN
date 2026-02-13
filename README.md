# ARDEN - AI Routine Daily Engagement Nexus

Voice-enabled personal AI infrastructure built on Claude Code.

## Architecture

### OpenClaw Architecture (4 Pillars)

ARDEN now implements the **OpenClaw architecture** - a 4-pillar design for proactive, memory-aware AI assistance:

```
┌─────────────────────────────────────────────────────────────────┐
│                      IDENTITY FILES                              │
│  SOUL.md · USER.md · MEMORY.md · AGENTS.md · HEARTBEAT.md       │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌──────────────────┐
│   PILLAR 1    │   │   PILLAR 2    │   │    PILLAR 3      │
│  Memory System│   │  Heartbeat    │   │    Adapters      │
├───────────────┤   ├───────────────┤   ├──────────────────┤
│ • Hybrid      │   │ • Gmail API   │   │ • Telegram       │
│   Search      │   │ • Calendar    │   │ • Discord        │
│ • Vector +    │   │ • Claude      │   │ • Web Server     │
│   BM25        │   │   Reasoning   │   │ • Slack          │
│ • FastEmbed   │   │ • 30-min loop │   │ • Terminal       │
│ • Daily logs  │   │ • Proactive   │   │                  │
│   ingested    │   │   alerts      │   │                  │
└───────────────┘   └───────────────┘   └──────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │    PILLAR 4      │
                    │  Skills Registry │
                    ├──────────────────┤
                    │ • SKILL.md       │
                    │   Discovery      │
                    │ • Auto-detect    │
                    │ • Pattern match  │
                    │ • 11 skills      │
                    └──────────────────┘
```

**Legacy Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                    ARDEN Voice Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Phone/iPad/Smart Device                                    │
│         ↓                                                    │
│  Voice API Server (Discord/Telegram Bot)                    │
│         ↓                                                    │
│  Speech-to-Text (Whisper) → AI Provider → TTS              │
│         ↓                                                    │
│  Voice Response → Device                                    │
└─────────────────────────────────────────────────────────────┘

Production Stack:
┌────────────────────────────────────────────────────────────┐
│ Native Node.js + Python Environment                        │
│  ├─ Node.js 18+ + Discord/Telegram Bot                   │
│  ├─ Python 3.10+ + Whisper (GPU accelerated)              │
│  ├─ FFmpeg for audio processing                           │
│  ├─ Winston structured logging                            │
│  └─ SQLite database for persistence                       │
│                                                            │
│ Optional: Ollama                                           │
│  └─ Local LLM with GPU acceleration                       │
└────────────────────────────────────────────────────────────┘
```

## The 4 Pillars

### Pillar 1: Memory System
Persistent, searchable memory with hybrid vector + keyword search.

**Components:**
- **Identity Files** - SOUL.md (personality), USER.md (profile), MEMORY.md (decisions/lessons)
- **Hybrid Search** - 70% vector similarity (FastEmbed 384-dim ONNX) + 30% BM25 keyword
- **Daily Logs** - Automatic ingestion of conversations and heartbeats
- **API** - Python Flask server on port 3002

**Setup:**
```bash
cd memory && ./setup.sh  # Creates venv, installs dependencies
```

### Pillar 2: Heartbeat
Proactive monitoring that pulls data sources and sends alerts.

**Components:**
- **Sources** - Gmail (unread), Google Calendar (upcoming events)
- **Reasoning** - Claude API analyzes data, decides NOTIFY vs HEARTBEAT_OK
- **Scheduling** - Every 30 minutes via APScheduler
- **Notifications** - POST to web server's /api/notify endpoint

**Setup:**
```bash
cd heartbeat && ./setup.sh  # Creates venv, installs dependencies
# Place Gmail OAuth credentials in heartbeat/credentials/
```

### Pillar 3: Adapters
Unified interface for all platforms (5 adapters, consistent lifecycle).

**Adapters:**
| Adapter | Mode | Token Env Vars |
|---------|------|----------------|
| Telegram | Polling | `TELEGRAM_BOT_TOKEN` |
| Discord | Gateway | `DISCORD_BOT_TOKEN` |
| Web | HTTP | `SESSION_SECRET` |
| Slack | Socket Mode | `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` |
| Terminal | CLI | None (interactive) |

**Usage:**
```bash
# Run any adapter
node api/telegram-bot.js      # Uses adapter pattern by default
node api/discord-bot.js       # Same
node api/web-server.js        # Same
node api/adapters/slack.js    # Direct
node api/adapters/terminal.js # Interactive CLI

# Legacy mode (original code)
ARDEN_LEGACY_TELEGRAM=1 node api/telegram-bot.js
```

### Pillar 4: Skills Registry
Auto-discoverable skills with standardized SKILL.md frontmatter.

**Discovery:**
- Scans `skills/*/SKILL.md` at startup
- Parses YAML frontmatter for triggers, patterns, tools
- Compiles regex patterns for auto-detection
- Hot-reloadable via `skillRegistry.load()`

**SKILL.md Format:**
```yaml
---
name: weather
version: 1.0.0
enabled: true
triggers:
  - "weather in {location}"
patterns:
  - "weather\\s+in\\s+(.+)"
entry: tools/get-weather.sh
timeout: 15000
agents: [assistant, analyst]
---
```

**Skills:** 11 total (6 active, 5 planned)
- ✅ weather, todo-management, note-taking, daily-planning, user-context, clawdbot-partner
- 🚧 content-engine, direct-integrations, yt-script, pptx-generator, excalidraw-diagram

## Directory Structure

```
~/ARDEN/
├── skills/              # Domain expertise modules
│   ├── daily-planning/
│   ├── research/
│   └── content-creation/
├── history/             # Universal Output Capture System
│   ├── sessions/        # Complete session transcripts
│   ├── learnings/       # Extracted insights
│   ├── decisions/       # Decision log
│   ├── research/        # Research findings
│   └── security/        # Security audit logs
├── agents/              # Specialized agent configurations
├── workflows/           # Automated procedures
├── context/             # Knowledge bases
├── config/              # Settings and hooks
├── voice/               # Voice processing
│   ├── recordings/      # Incoming voice files
│   └── responses/       # TTS output files
├── api/                 # Voice API server
└── scripts/             # Utility scripts
```

## Quick Start

### Setup

**Run ARDEN natively on your system:**

```bash
# 1. Configure environment
cp .env.production .env
nano .env  # Add your TELEGRAM_BOT_TOKEN and API keys

# 2. Install dependencies (if not already done)
cd ~/ARDEN/api
npm install

# 3. Start ARDEN
cd ~/ARDEN
./scripts/start.sh

# 4. Start Web Interface
./scripts/start-web.sh

# 5. Check status
./scripts/status.sh

# 6. Follow logs
tail -f api/logs/arden.log

# Stop ARDEN
./scripts/stop.sh

# Stop Web Interface
./scripts/stop-web.sh

# Restart ARDEN
./scripts/restart.sh
```

**Prerequisites:**
- Node.js 20+ (tested with v20 LTS)
- Python 3.10+ with virtual environment
- FFmpeg for audio processing
- NVIDIA GPU with drivers (optional, for GPU-accelerated Whisper)

**Access Web Interface:**
- http://localhost:3001

## Usage

## Usage

#### 1. Discord Bot

Send messages to your bot in Discord servers or DMs.
- Zero spam (private server, invite-only)
- Rich formatting and embeds
- Excellent mobile apps
- See: [Discord Setup Guide](docs/DISCORD_SETUP.md)

#### 2. Telegram Bot

Send voice or text messages to your bot.

#### 3. Web Interface

Access the dashboard at http://localhost:3001 for:
- Chat interface
- Notes management
- TODO tracking
- System monitoring
- Skills configuration

#### 3. Direct CLI

```bash
arden "What's on my schedule today?"
```

#### 4. Voice CLI

```bash
arden --voice
# Speaks: "What can I help you with?"
# You speak your request
# ARDEN responds with voice
```

## Voice Integration Options

### Option 1: Discord Bot (Recommended for spam-free experience)
- Send messages from any device
- Works on iOS, Android, desktop
- Private servers with full control
- Zero spam, invite-only
- **Setup:** See [Discord Setup Guide](docs/DISCORD_SETUP.md)
- Code: `api/discord-bot.js`

### Option 2: Telegram Bot (Easy setup)
- Send voice messages from any device  
- Works on iOS, Android, desktop
- Built-in voice message support
- Code: `api/telegram-bot.js`

### Option 3: REST API + PWA
- Progressive Web App for voice input
- Works on all modern browsers
- Voice debug interface included
- See: `api/web-server.js` and `web/`

### Option 4: Voice Debug Interface
- Advanced voice testing and development
- Real-time STT/TTS pipeline monitoring
- Audio processing diagnostics
- Access at: http://localhost:3001/voice-debug.html
- **Setup:** Automatically available with web interface

### Option 5: iOS Shortcuts
- Use Siri to trigger ARDEN
- Dictation → webhook → ARDEN
- See: `workflows/ios-shortcut.md`

## Configuration

Edit `config/arden.json`:
```json
{
  "voice": {
    "stt_provider": "openai-whisper",
    "stt_config": {
      "model": "base",
      "language": "en",
      "device": "cuda"
    },
    "tts_provider": "elevenlabs",
    "voice_id": "your-voice-id",
    "language": "en"
  },
  "api": {
    "port": 3000,
    "auth_token": "your-secret-token"
  },
  "clawdbot_partnership": {
    "enabled": true,
    "api_url": "http://127.0.0.1:18789/api",
    "supported_platforms": ["whatsapp", "telegram"],
    "automation_enabled": true,
    "collaboration_mode": "bidirectional"
  }
}
```

## Recent Updates

### 🚀 OpenClaw Architecture Migration (February 2026)

Complete architectural overhaul implementing the 4-pillar OpenClaw design:

**Pillar 1: Memory System**
- Hybrid search with FastEmbed (384-dim ONNX) + BM25
- Identity files: SOUL.md, USER.md, MEMORY.md, AGENTS.md, HEARTBEAT.md
- Daily log ingestion and persistent memory
- Python Flask server on port 3002

**Pillar 2: Heartbeat**
- Proactive monitoring every 30 minutes
- Gmail + Calendar integration via Google APIs
- Claude-powered reasoning (NOTIFY/HEARTBEAT_OK pattern)
- Automatic alerts sent to all adapters

**Pillar 3: Adapters**
- Unified adapter interface with consistent lifecycle
- 5 adapters: Telegram, Discord, Web, Slack (Socket Mode), Terminal
- Backward compatibility maintained (legacy mode available)
- Base adapter class with shared auth, rate limiting, message processing

**Pillar 4: Skills Registry**
- Auto-discovery from SKILL.md frontmatter
- Standardized YAML format for triggers, patterns, tools
- 11 skills (6 active + 5 planned placeholders)
- Pattern-based auto-detection with compiled regex

### Previous Features

- **🤝 Clawdbot Partnership Integration** - Cross-platform AI collaboration
- **🎤 Voice Debug Interface** - Real-time voice testing
- **⚡ System Improvements** - CUDA support, rate limiting, PM2
- **📱 Better Mobile Experience** - Responsive design

## Skills System

ARDEN includes an integrated skills system that automatically detects and executes specialized tasks through natural language.

### Available Skills

#### 📝 Note-Taking
Capture notes via voice or text and save as markdown files.

**Trigger Phrases:**
- "Take a note: [content]"
- "Save this: [content]"
- "Create a note: [content]"
- "Remember this: [content]"

**Auto-detects note types:** meeting, idea, todo, quick

**Example:**  
`"Take a note: Follow up with Sarah about the Q1 report"`

---

#### ✅ TODO Management
Add tasks to categorized TODO lists with smart category detection.

**Trigger Phrases:**
- "Add a todo: [task]"
- "Remind me to [task]"
- "I need to [task]"
- "Don't forget to [task]"

**Categories:**
- **Work** - deploy, review, PR, meeting, client, presentation
- **Personal** - groceries, bills, doctor, errands (default)
- **Side Projects** - ARDEN, learn, tutorial, experiment

**Example:**  
`"Remind me to review pull request #42"` → Auto-categorized as **Work**

---

#### 📅 Daily Planning
Get comprehensive briefings of your TODOs and recent notes.

**Trigger Phrases:**
- "Morning briefing"
- "Plan my day"
- "What's on my agenda"
- "What should I do today"

**Provides:**
- TODO summary by category
- Top pending tasks
- Recent notes (last 7 days)
- New notes created today
- Quick stats and recommendations

---

#### 👤 User Context
Retrieve your user profile and context information.

**Trigger Phrases:**
- "Who am I"
- "My profile"
- "Show my context"

**Returns:** Full user profile from `~/Notes/profile.md`

---

#### 🤝 Clawdbot Partnership
Cross-platform AI collaboration and messaging delegation.

**Trigger Phrases:**
- "Send [message] via WhatsApp"
- "Tell Clawdbot to [task]"
- "Delegate [task] to Clawdbot"
- "Work with Clawdbot on [project]"

**Supported Platforms:**
- WhatsApp, Telegram, Discord, Slack
- Email automation
- Smart home integration
- Calendar and reminder systems

**Example:**  
`"Send 'Meeting moved to 3pm' via WhatsApp"` → Routes to external messaging platform

---

#### 🌤️ Weather
Get current weather and forecasts for any location.

**Trigger Phrases:**
- "Weather in [location]"
- "What's the weather in Chicago?"
- "Forecast for [location]"

---

### Skill Architecture

Skills are loaded automatically at session start. Each skill contains:
- `SKILL.md` - Documentation and trigger patterns
- `workflows/` - Step-by-step procedures
- `tools/` - Executable scripts
- `context/` - Domain knowledge

**Location:** `~/ARDEN/skills/`

**See also:** Individual skill documentation in `skills/*/SKILL.md`

## Agents

Specialized agents with unique personalities:
- **Strategist** - High-level planning and decision-making
- **Researcher** - Deep analysis and fact-finding
- **Engineer** - Code and technical implementation
- **Analyst** - Data processing and insights
- **Assistant** - General tasks and coordination

## Security

Defense-in-depth security layers:
1. Configuration hardening
2. Constitutional principles
3. Pre-execution validation hooks
4. Audit logging

All security events logged to `history/security/`

## Next Steps

1. Configure voice providers in `config/arden.json`
2. Set up your preferred voice interface (Telegram recommended)
3. Create your first skill in `skills/`
4. Start using ARDEN with voice commands!

## Deployment

### Production Deployment (Ubuntu 24.04 VPS)

**Recommended: Ansible Deployment (Most Reliable)**

```bash
# Install Ansible
brew install ansible  # macOS
# OR
sudo apt install ansible  # Ubuntu/Debian

# Deploy to VPS
cd ansible
ansible-galaxy install -r requirements.yml
ansible-playbook deploy.yml
```

See [ansible/README.md](ansible/README.md) for complete Ansible deployment guide.

**Alternative: Bash Script Deployment**

```bash
# Deploy to your VPS (e.g., rocket.id10t.social)
./scripts/deploy-full-auto.sh
```

**What Gets Deployed:**
- Node.js 20 LTS and all dependencies
- Ubuntu 24.04 compatibility (Python 3.13 support)
- Nginx reverse proxy with SSL (Let's Encrypt)
- PM2 process management
- Automated daily backups (2 AM, 7-day retention)
- UFW firewall configuration

**Manual Deployment:**

See [DEPLOYMENT_ROCKET.md](DEPLOYMENT_ROCKET.md) for complete production deployment guide.

**Ubuntu 24.04 Specific Notes:**

See [docs/UBUNTU_24_04_NOTES.md](docs/UBUNTU_24_04_NOTES.md) for Ubuntu 24.04 LTS specific information.

**Production Features:**
- CPU-optimized (no GPU required)
- OpenAI API-based (GPT-4o-mini + Whisper)
- PM2 process management
- Nginx reverse proxy with SSL
- Systemd service integration
- Estimated cost: ~$3-5/month

## Resources

- [Setup Guide](docs/setup.md)
- [Creating Skills](docs/skills.md)
- [Voice Configuration](docs/voice.md)
- [API Reference](docs/api.md)
- [Production Deployment](DEPLOYMENT_ROCKET.md)
