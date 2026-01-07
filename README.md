# ARDEN - AI Routine Daily Engagement Nexus

Voice-enabled personal AI infrastructure built on Claude Code.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ARDEN Voice Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Phone/iPad/Smart Device                                    │
│         ↓                                                    │
│  Voice API Server (Telegram Bot)                            │
│         ↓                                                    │
│  Speech-to-Text (Whisper) → AI Provider → TTS              │
│         ↓                                                    │
│  Voice Response → Device                                    │
└─────────────────────────────────────────────────────────────┘

Production Stack:
┌────────────────────────────────────────────────────────────┐
│ Native Node.js + Python Environment                        │
│  ├─ Node.js 18+ + Telegram Bot                            │
│  ├─ Python 3.10+ + Whisper (GPU accelerated)              │
│  ├─ FFmpeg for audio processing                           │
│  ├─ Winston structured logging                            │
│  └─ SQLite database for persistence                       │
│                                                            │
│ Optional: Ollama                                           │
│  └─ Local LLM with GPU acceleration                       │
└────────────────────────────────────────────────────────────┘
```

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

#### 1. Telegram Bot

Send voice or text messages to your bot.

#### 2. Web Interface

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

### Option 1: Telegram Bot (Easiest)
- Send voice messages from any device
- Works on iOS, Android, desktop
- Built-in voice message support
- See: `api/telegram-bot.js`

### Option 2: REST API + PWA
- Progressive Web App for voice input
- Works on all modern browsers
- See: `api/voice-server.js` and `api/public/`

### Option 3: iOS Shortcuts
- Use Siri to trigger ARDEN
- Dictation → webhook → ARDEN
- See: `workflows/ios-shortcut.md`

## Configuration

Edit `config/arden.json`:
```json
{
  "voice": {
    "stt_provider": "openai-whisper",
    "tts_provider": "elevenlabs",
    "voice_id": "your-voice-id",
    "language": "en"
  },
  "api": {
    "port": 3000,
    "auth_token": "your-secret-token"
  }
}
```

## Skills System

Skills are loaded automatically at session start. Each skill contains:
- `SKILL.md` - When to invoke this skill
- `workflows/` - Step-by-step procedures
- `tools/` - Executable scripts

Example skills:
- Daily Planning - Morning briefing and task prioritization
- Research - Multi-source research aggregation
- Content Creation - Writing and publishing workflows
- Communication - Email and message processing

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

**Automated One-Command Deployment:**

```bash
# Deploy to your VPS (e.g., rocket.id10t.social)
./scripts/deploy-full-auto.sh
```

This will:
- Install Node.js 20 LTS and all dependencies
- Configure Ubuntu 24.04 for Python 3.13 compatibility
- Set up Nginx with SSL (Let's Encrypt)
- Configure PM2 process management
- Set up automated daily backups
- Start ARDEN services

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
