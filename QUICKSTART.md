# ARDEN Quick Start Guide

Get your AI Routine Daily Engagement Nexus running in 10 minutes.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Claude Code CLI installed
- [ ] OpenAI API key (for voice transcription)
- [ ] Telegram account (for easiest voice setup)

## 5-Minute Setup

### Step 1: Install Dependencies (2 min)

```bash
cd ~/ARDEN
./scripts/install.sh
```

### Step 2: Configure API Keys (1 min)

```bash
nano ~/ARDEN/.env
```

Add:
```bash
OPENAI_API_KEY=sk-your-key-here
```

### Step 3: Set Up Telegram Bot (2 min)

1. Open Telegram, message [@BotFather](https://t.me/botfather)
2. Send `/newbot`
3. Name your bot (e.g., "My ARDEN")
4. Copy the token

Add to `.env`:
```bash
TELEGRAM_BOT_TOKEN=1234567890:ABCdef...
```

Enable in config:
```bash
nano ~/ARDEN/config/arden.json
```

Change:
```json
"telegram": {
  "enabled": true,
  ...
}
```

### Step 4: Start the Bot (30 sec)

```bash
cd ~/ARDEN/api
npm install
npm start
```

### Step 5: Test It! (30 sec)

1. Open Telegram
2. Search for your bot
3. Send `/start`
4. Send a voice message: "Hello ARDEN!"

## Basic Usage

### Via Telegram (Recommended)

**Text:**
- "What's on my schedule today?"
- "Summarize this article: [URL]"
- "Help me plan my day"

**Voice:**
- Just record and send a voice message
- ARDEN transcribes, processes, and responds

### Via CLI

```bash
# Add to PATH first
export PATH="$HOME/ARDEN/bin:$PATH"

# Then use
arden "What can you do?"
```

## Next Steps

### Add Text-to-Speech (Optional)

1. Get ElevenLabs API key: https://elevenlabs.io
2. Add to `.env`:
   ```bash
   ELEVENLABS_API_KEY=your-key-here
   ```
3. Restart bot
4. Now ARDEN responds with voice too!

### Keep Bot Running 24/7

```bash
npm install -g pm2
cd ~/ARDEN/api
pm2 start telegram-bot.js --name arden-bot
pm2 save
pm2 startup
```

### Create Your First Skill

```bash
mkdir -p ~/ARDEN/skills/my-skill
nano ~/ARDEN/skills/my-skill/SKILL.md
```

See `docs/skills.md` for examples.

### Set Up Automated Routines

Edit `config/arden.json`:
```json
{
  "routines": {
    "morning_briefing": {
      "enabled": true,
      "time": "08:00"
    }
  }
}
```

## Common Commands

### Telegram Bot

```bash
# Start
cd ~/ARDEN/api && npm start

# Start with auto-restart
pm2 start telegram-bot.js --name arden-bot

# View logs
pm2 logs arden-bot

# Stop
pm2 stop arden-bot
```

### ARDEN CLI

```bash
# Basic query
arden "help me with this task"

# Load specific context
arden --context ~/Projects "explain this codebase"

# Future: Voice mode
arden --voice
```

## Troubleshooting

### Bot not responding

```bash
# Check if running
pm2 list

# Check logs
pm2 logs arden-bot

# Restart
pm2 restart arden-bot
```

### "OPENAI_API_KEY not set"

```bash
# Check .env
cat ~/ARDEN/.env

# Make sure bot loads it
cd ~/ARDEN/api
node -e "require('dotenv').config({path:'../.env'}); console.log(process.env.OPENAI_API_KEY)"
```

### Voice transcription fails

1. Verify OpenAI API key is correct
2. Check you have credits: https://platform.openai.com/usage
3. Make sure voice file is in supported format (OGG, MP3, WAV)

## Example Interactions

### Morning Briefing

**You:** "Good morning ARDEN, what's my day look like?"

**ARDEN:**
> Good morning! You have 3 meetings today:
> - 9 AM team standup
> - 2 PM client review
> - 4 PM project planning
>
> Your top priorities:
> 1. Finish Q1 report (due today)
> 2. Review Sarah's proposal
> 3. Prepare client presentation
>
> Recommendation: Block 10-12 for focused work on the Q1 report.

### Research Request

**You:** "Research the latest AI developments this week"

**ARDEN:**
> I'll search for recent AI news and developments. Here's what I found:
>
> [Summarized findings...]
>
> Would you like me to create a detailed report?

### Task Management

**You:** "I have 20 tasks, help me prioritize"

**ARDEN:**
> Based on urgency and impact, here are your top 5 priorities:
>
> 1. [High urgency, high impact task]
> 2. [High urgency, medium impact task]
> ...

## Advanced Features

### Voice on All Devices

- **Phone:** Telegram app
- **iPad:** Telegram app
- **Desktop:** Telegram web or app
- **Smart speaker:** Via Telegram on phone
- **Siri:** iOS Shortcuts integration

### Skills System

Create domain-specific expertise:
- Daily planning
- Research & analysis
- Content creation
- Code review
- Data processing

See `docs/skills.md` for details.

### Agent System

Specialized AI agents:
- **Assistant** - General tasks
- **Strategist** - Planning & decisions
- **Researcher** - Deep analysis
- **Engineer** - Code & technical
- **Analyst** - Data & insights

### History Tracking

Everything is logged:
- `history/sessions/` - Full transcripts
- `history/learnings/` - Extracted insights
- `history/decisions/` - Decision log
- `history/research/` - Research findings

## Resources

- **Full Setup Guide:** `docs/setup.md`
- **Voice Configuration:** `docs/voice.md`
- **Creating Skills:** `docs/skills.md`
- **API Reference:** `docs/api.md`

## Getting Help

1. Check the logs: `pm2 logs arden-bot`
2. Review session history: `cat ~/ARDEN/history/sessions/*/session_*.md`
3. Read troubleshooting: `docs/troubleshooting.md`

## What's Next?

Now that ARDEN is running:

1. **Use it daily** - Morning briefings, task planning, research
2. **Create skills** - Build expertise for your specific needs
3. **Set up routines** - Automate recurring tasks
4. **Customize agents** - Tailor AI personalities to your workflow
5. **Iterate** - ARDEN learns from your usage patterns

Welcome to your personal AI infrastructure!

---

**ARDEN** - AI Routine Daily Engagement Nexus
Built on Claude Code | Inspired by Daniel Miessler's PAI
