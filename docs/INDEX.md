# ARDEN Documentation Index

Quick links to all documentation for the ARDEN project.

---

## 📖 Core Documentation

### Session & Project State
- **[SESSION_STATE.md](../SESSION_STATE.md)** - Complete current project state, progress, and resume instructions
  - Current configuration and services
  - What's working, what's not
  - How to pick up from any session
  - Technical decisions made
  - Known issues and workarounds

### Quick Reference
- **[QUICK_START.md](QUICK_START.md)** - One-page reference for common tasks
  - Access URLs
  - Service management
  - Common commands
  - Quick troubleshooting

---

## 🎤 Voice Features

### Testing & Setup
- **[VOICE_TESTING.md](VOICE_TESTING.md)** - Comprehensive voice testing guide
  - Step-by-step testing procedures
  - Browser compatibility
  - Common issues and solutions
  - Performance benchmarks
  - Security considerations

### TTS Configuration
- **[TTS_OPTIONS.md](TTS_OPTIONS.md)** - Text-to-speech provider options
  - Comparison of all TTS providers (edge-tts, OpenAI, Piper, ElevenLabs)
  - How to switch providers
  - Voice options and samples
  - Cost comparison
  - Setup instructions

---

## 🤖 AI Model Configuration

### Model Selection
- **[BEST_MODELS_FOR_NOTES.md](BEST_MODELS_FOR_NOTES.md)** - AI model comparison for note editing
  - Detailed comparison of models for markdown/notes
  - Performance metrics
  - VRAM usage
  - Use case recommendations
  - Specialized models for different tasks

### Model Upgrade
- **[QUICK_MODEL_UPGRADE.md](QUICK_MODEL_UPGRADE.md)** - Step-by-step upgrade guide
  - Before/after comparison
  - 3-minute upgrade instructions
  - Real-world examples
  - Testing procedures

---

## 📚 Additional Resources

### Project Files
```
/home/hal/ARDEN/
├── SESSION_STATE.md          # Current project state (READ THIS FIRST!)
├── README.md                 # Original project README
├── config/arden.json         # Main configuration
├── .env                      # Environment variables (API keys)
├── docs/                     # This directory
│   ├── INDEX.md             # This file
│   ├── QUICK_START.md       # Quick reference
│   ├── VOICE_TESTING.md     # Voice feature testing
│   ├── TTS_OPTIONS.md       # TTS provider guide
│   ├── BEST_MODELS_FOR_NOTES.md  # Model comparison
│   └── QUICK_MODEL_UPGRADE.md    # Upgrade guide
├── scripts/                  # Management scripts
│   ├── start.sh             # Start Telegram bot
│   ├── stop.sh              # Stop Telegram bot
│   ├── restart.sh           # Restart Telegram bot
│   ├── status.sh            # Check bot status
│   ├── start-web.sh         # Start web interface
│   ├── stop-web.sh          # Stop web interface
│   ├── setup-firewall.sh    # Configure UFW
│   ├── consolidate-todos.sh # Consolidate TODOs
│   └── todo-summary.sh      # Show TODO summary
└── api/logs/                # Log files
    ├── arden.log            # Telegram bot logs
    └── web-server.log       # Web interface logs
```

### User Files
```
/home/hal/Notes/
├── profile.md               # Your profile (loaded by ARDEN)
├── todo.md                  # Consolidated TODOs
└── *.md                     # 576+ markdown files (Obsidian vault)
```

---

## 🚀 Getting Started

### First Time Setup
1. Read [SESSION_STATE.md](../SESSION_STATE.md) for complete project overview
2. Check services are running (see [QUICK_START.md](QUICK_START.md))
3. Access web interface: http://192.168.4.57:3001
4. Login with ARDEN_API_TOKEN from `.env`

### Testing Voice Features
1. Follow [VOICE_TESTING.md](VOICE_TESTING.md)
2. Configure firewall if needed: `sudo ./scripts/setup-firewall.sh`
3. Test microphone and TTS
4. Try voice conversations

### Changing AI Model
1. Review [BEST_MODELS_FOR_NOTES.md](BEST_MODELS_FOR_NOTES.md)
2. Follow [QUICK_MODEL_UPGRADE.md](QUICK_MODEL_UPGRADE.md)
3. Restart services

### Changing TTS Voice
1. Review options in [TTS_OPTIONS.md](TTS_OPTIONS.md)
2. Edit `config/arden.json`
3. Restart web interface

---

## 🆘 Troubleshooting

### Common Issues

**"JSON parse error"**
→ Session expired, hard refresh (Ctrl+Shift+R) and login again
→ See SESSION_STATE.md → Known Issues → Session Expiry

**"Can't access from laptop"**
→ Check firewall: `sudo ./scripts/setup-firewall.sh`
→ Verify services: `./scripts/status.sh`
→ See QUICK_START.md → Troubleshooting

**"Voice not working"**
→ Check microphone permissions in browser
→ Follow VOICE_TESTING.md → Troubleshooting
→ Check logs: `tail -f api/logs/web-server.log`

**"ARDEN doesn't know about my notes"**
→ Context is loading, ask more specific questions
→ Try: "What's my name?" or "What do I do at FedEx?"
→ See SESSION_STATE.md → Context & Notes Integration

### Getting Help

1. Check relevant documentation above
2. View logs: `tail -f api/logs/*.log`
3. Check SESSION_STATE.md for current status
4. Restart services if needed

---

## 📝 Quick Command Reference

```bash
# Navigate to project
cd /home/hal/ARDEN

# Check status
./scripts/status.sh                    # Telegram bot
ps aux | grep web-server               # Web interface
nvidia-smi                             # GPU usage

# Start services
./scripts/start.sh                     # Telegram bot
./scripts/start-web.sh                 # Web interface

# Stop services
./scripts/stop.sh                      # Telegram bot
./scripts/stop-web.sh                  # Web interface

# Restart services
./scripts/restart.sh                   # Telegram bot
./scripts/stop-web.sh && ./scripts/start-web.sh  # Web

# View logs
tail -f api/logs/arden.log             # Telegram bot
tail -f api/logs/web-server.log        # Web interface
tail -f api/logs/*.log                 # All logs

# Update TODOs
./scripts/consolidate-todos.sh         # Consolidate
./scripts/todo-summary.sh              # Summary

# Test Ollama
ollama list                            # List models
ollama run qwen2.5-coder:14b "test"   # Test model

# Get auth token
grep ARDEN_API_TOKEN .env              # For web login
```

---

## 🔗 External Links

- **GitHub Repository**: https://github.com/infurno/ARDEN
- **Ollama Models**: https://ollama.ai/library
- **Qwen2.5-Coder**: https://ollama.ai/library/qwen2.5-coder
- **Edge-TTS Voices**: https://github.com/rhasspy/piper/blob/master/VOICES.md
- **Whisper Models**: https://github.com/openai/whisper

---

## 📅 Document Status

**Last Updated**: 2026-01-02 21:35:00
**ARDEN Version**: 1.0.0
**Current Model**: qwen2.5-coder:14b
**Status**: All services operational

---

**Start Here**: If you're resuming work from a previous session, read [SESSION_STATE.md](../SESSION_STATE.md) first!
