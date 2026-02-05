# 🚀 Get Started with ARDEN

**AI Routine Daily Engagement Nexus**
Your personal AI infrastructure with voice on every device

---

## What You Just Built

✅ **Complete AI Infrastructure** - Skills, agents, workflows, history tracking
✅ **Voice Processing** - Speak and hear responses on phone, iPad, desktop
✅ **Telegram Bot** - Works on any device with Telegram app
✅ **Automatic Logging** - Every interaction saved and searchable
✅ **Extensible Skills** - Easy to add domain expertise
✅ **Security** - Defense-in-depth, API key protection, audit logs

---

## Quick Start (5 Minutes)

### 1. Verify Your Setup

```bash
cd ~/ARDEN
./scripts/verify-setup.sh
```

This checks:
- ✓ Prerequisites installed
- ✓ Directory structure
- ✓ Configuration files
- ✓ Environment variables

### 2. Configure API Keys

```bash
cp .env.example .env
nano .env
```

**Required:**
```bash
OPENAI_API_KEY=sk-your-key-here
```

**For Voice Responses (Optional but Recommended):**
```bash
ELEVENLABS_API_KEY=your-key-here
TELEGRAM_BOT_TOKEN=your-token-here
```

### 3. Get Your API Keys

#### OpenAI (Required)
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy to `.env`

#### Telegram Bot (For Voice)
1. Open Telegram, message [@BotFather](https://t.me/botfather)
2. Send `/newbot`
3. Follow prompts, copy token to `.env`

#### Text-to-Speech (Optional - for voice responses)

**🎉 FREE Options Available! (Recommended)**
```bash
# Run the free TTS setup script
./scripts/setup-free-tts.sh
```

Choose from:
- **Edge TTS** - FREE, Microsoft's voices, 400+ options
- **Piper** - FREE, self-hosted, works offline
- **OpenAI TTS** - ~$1/month, uses same key as Whisper

**Or use ElevenLabs (paid - $11-15/month):**
1. Go to https://elevenlabs.io
2. Sign up, get API key from profile
3. Copy to `.env`

📖 **See `FREE_TTS_GUIDE.md` for details on free alternatives**

### 4. Install Dependencies

```bash
cd ~/ARDEN/api
npm install
```

### 5. Start the Bot

**Test mode:**
```bash
npm start
```

**Production (24/7):**
```bash
npm install -g pm2
pm2 start telegram-bot.js --name arden-bot
pm2 save
pm2 startup  # Follow instructions
```

### 6. Test It!

1. Open Telegram
2. Search for your bot
3. Send `/start`
4. Send a message: "Hello ARDEN!"
5. Send a voice message: "What can you do?"

---

## What Can You Do?

### Voice Interactions

**On Your Phone/iPad:**
- Open Telegram
- Send voice message to your bot
- Get text + voice response

**Examples:**
- "Good morning, what's my day look like?"
- "Help me plan my next 2 hours"
- "Summarize this article: [URL]"
- "What should I focus on today?"

### Text Interactions

**Via Telegram:**
Just type your message like you would to a person.

**Via CLI:**
```bash
arden "What's on my schedule?"
```

### Automated Routines

Edit `config/arden.json`:
```json
{
  "routines": {
    "morning_briefing": {
      "enabled": true,
      "time": "08:00"
    },
    "evening_review": {
      "enabled": true,
      "time": "18:00"
    }
  }
}
```

---

## Understanding the System

### Voice Flow

```
Your Voice (on phone)
  ↓
Telegram App
  ↓
ARDEN Bot
  ↓
Speech-to-Text (Whisper)
  ↓
Claude Code Processing
  ↓
Text-to-Speech (ElevenLabs)
  ↓
Voice Response (back to phone)
```

### Skills System

Skills are auto-loaded expertise modules. You have:
- **Daily Planning** - Morning briefings, task prioritization

Create more in `skills/`:
```bash
mkdir -p ~/ARDEN/skills/research
nano ~/ARDEN/skills/research/SKILL.md
```

### History Tracking

Everything is logged:
```
history/
├── sessions/     # Every conversation
├── learnings/    # Extracted insights
├── decisions/    # Important decisions
└── research/     # Research findings
```

### Voice Storage

Temporary voice files (auto-deleted after 7 days):
```
voice/
├── recordings/   # Incoming voice messages
└── responses/    # Outgoing TTS audio
```

---

## Common Tasks

### Check Bot Status
```bash
pm2 list
pm2 logs arden-bot
```

### Stop/Restart Bot
```bash
pm2 stop arden-bot
pm2 restart arden-bot
```

### View Recent Sessions
```bash
ls -lt ~/ARDEN/history/sessions/
cat ~/ARDEN/history/sessions/2026-01-*/session_*.md
```

### Test Voice Transcription
Send a voice message to your bot in Telegram.

### Update Configuration
```bash
nano ~/ARDEN/config/arden.json
pm2 restart arden-bot  # Apply changes
```

---

## Customization

### Change Voice

Edit `config/arden.json`:
```json
{
  "voice": {
    "tts_config": {
      "voice_id": "21m00Tcm4TlvDq8ikWAM"
    }
  }
}
```

**Popular Voices:**
- `21m00Tcm4TlvDq8ikWAM` - Rachel (calm, professional)
- `EXAVITQu4vr4xnSDxMaL` - Bella (friendly, warm)
- `pNInz6obpgDQGcFmaJgB` - Adam (deep, authoritative)

Find more at: https://elevenlabs.io/voice-library

### Create Your First Skill

```bash
mkdir -p ~/ARDEN/skills/my-skill
cat > ~/ARDEN/skills/my-skill/SKILL.md << 'SKILLEOF'
# My Custom Skill

## Purpose
[What this skill does]

## When to Invoke
[Keywords or phrases that trigger this skill]

## Capabilities
- [Capability 1]
- [Capability 2]

## Workflows
- [Workflow 1]
- [Workflow 2]
SKILLEOF
```

### Add Automated Routine

1. Create a cron job:
```bash
crontab -e
```

2. Add:
```bash
0 8 * * * cd ~/ARDEN && bin/arden "morning briefing" > /dev/null 2>&1
```

---

## Cost Tracking

### Typical Monthly Usage (10 interactions/day)

**Voice Processing:**
- OpenAI Whisper (STT): ~$0.90
- ElevenLabs (TTS): ~$10-15

**Total: ~$11-16/month**

### Monitor Usage

**OpenAI:** https://platform.openai.com/usage
**ElevenLabs:** Dashboard → Usage

---

## Troubleshooting

### "Bot not responding"

```bash
# Check if running
pm2 list

# View logs
pm2 logs arden-bot

# Restart
pm2 restart arden-bot
```

### "Voice transcription failed"

```bash
# Check API key
cat ~/ARDEN/.env | grep OPENAI

# Test manually
echo $OPENAI_API_KEY
```

### "No voice responses"

That's normal if you haven't set up ElevenLabs. Bot works fine with text-only responses. To add voice responses, set `ELEVENLABS_API_KEY` in `.env`.

### "Command not found: arden"

Add to your shell config (~/.zshrc or ~/.bashrc):
```bash
export PATH="$HOME/ARDEN/bin:$PATH"
```

Then: `source ~/.zshrc`

---

## Documentation

### Quick Reference
- **This File** - Get started guide
- `QUICKSTART.md` - 10-minute setup
- `README.md` - System overview

### Detailed Guides
- `docs/setup.md` - Complete installation
- `docs/voice.md` - Voice configuration
- `docs/architecture.md` - Technical architecture

### Reference
- `PROJECT_SUMMARY.md` - What was built
- `config/arden.json` - Configuration reference

---

## Next Steps

### Day 1: Get Comfortable
- [x] Setup complete
- [ ] Send 5 test messages
- [ ] Try a voice message
- [ ] Review your first session log

### Week 1: Daily Use
- [ ] Use morning briefing daily
- [ ] Create 2-3 custom skills
- [ ] Set up automated routines
- [ ] Configure your preferred voice

### Month 1: Mastery
- [ ] Build comprehensive skill library
- [ ] Optimize voice workflows
- [ ] Track productivity improvements
- [ ] Share learnings

---

## Example Interactions

### Morning Routine

**You:** [Voice] "Good morning ARDEN, what's my day?"

**ARDEN:** [Text + Voice]
> Good morning! You have 3 meetings today:
> - 9 AM team standup
> - 2 PM client review
> - 4 PM project planning
>
> Your top priorities:
> 1. Finish Q1 report (2 hours)
> 2. Review Sarah's proposal (30 minutes)
>
> Recommendation: Block 10-12 for deep work.

### Research Task

**You:** "Research the latest developments in AI agents"

**ARDEN:**
> I'll search for recent AI agent developments...
> [Provides comprehensive summary]
> 
> Would you like me to create a detailed report?

### Task Planning

**You:** "I have 20 tasks, help me prioritize"

**ARDEN:**
> Based on urgency and impact:
> 
> High Priority (Do Today):
> 1. [Task] - Due today, high impact
> 2. [Task] - Blocking others
> ...

---

## Getting Help

1. **Verification:** `./scripts/verify-setup.sh`
2. **Logs:** `pm2 logs arden-bot`
3. **Sessions:** `cat ~/ARDEN/history/sessions/*/session_*.md`
4. **Documentation:** `cat ~/ARDEN/docs/setup.md`

---

## Philosophy

ARDEN is inspired by Daniel Miessler's PAI (Personal AI Infrastructure) with these principles:

1. **Scaffolding > Raw Intelligence** - System design matters more than model capability
2. **Voice-First** - Designed for natural interaction on any device
3. **Privacy-Focused** - Your infrastructure, your data
4. **Extensible** - Skills and agents adapt to your needs
5. **Measurable** - Track everything, improve systematically

---

## Support & Community

**Built With:**
- Claude Code (Anthropic)
- OpenAI Whisper
- ElevenLabs
- Telegram Bot API

**Inspired By:**
- Daniel Miessler's PAI v2
- UNIX philosophy
- Modern voice UX

---

## Quick Commands Cheat Sheet

```bash
# Verify setup
~/ARDEN/scripts/verify-setup.sh

# Start bot (test)
cd ~/ARDEN/api && npm start

# Start bot (production)
pm2 start telegram-bot.js --name arden-bot

# Check status
pm2 list

# View logs
pm2 logs arden-bot

# Restart
pm2 restart arden-bot

# CLI usage
arden "your query here"

# View today's sessions
cat ~/ARDEN/history/sessions/$(date +%Y-%m-%d)/session_*.md

# Edit config
nano ~/ARDEN/config/arden.json

# Edit API keys
nano ~/ARDEN/.env
```

---

## Ready to Go!

Your ARDEN system is ready. Start with:

```bash
# Verify everything
./scripts/verify-setup.sh

# Start the bot
cd api && npm start

# Open Telegram and say hello!
```

**Welcome to your personal AI infrastructure!**

---

**ARDEN** - AI Routine Daily Engagement Nexus
*Your intelligent assistant, everywhere you need it* 🚀
