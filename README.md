# ARDEN - AI Routine Daily Engagement Nexus

Voice-enabled personal AI infrastructure built on Claude Code.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ARDEN Voice Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Phone/iPad/Smart Device                                    │
│         ↓                                                    │
│  Voice API Server (api/)                                    │
│         ↓                                                    │
│  Speech-to-Text → ARDEN CLI → Claude Code → TTS            │
│         ↓                                                    │
│  Voice Response → Device                                    │
└─────────────────────────────────────────────────────────────┘
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

### 1. Voice Interaction (Recommended - Telegram Bot)

Send voice messages to your ARDEN bot on Telegram:
```bash
cd ~/ARDEN/api
node telegram-bot.js
```

### 2. Direct CLI

```bash
arden "What's on my schedule today?"
```

### 3. Voice CLI

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

## Resources

- [Setup Guide](docs/setup.md)
- [Creating Skills](docs/skills.md)
- [Voice Configuration](docs/voice.md)
- [API Reference](docs/api.md)
