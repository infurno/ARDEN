# Deploy to rocket.id10t.social - Quick Guide

## Overview
Your ARDEN bot is ready to deploy to **rocket.id10t.social** (CPU-only VPS).

Since the VPS doesn't have a GPU, we'll use **OpenAI APIs** for fast performance instead of local AI.

## What You Need

1. **Telegram Bot Token** (from @BotFather) ✓ You have this
2. **OpenAI API Key** (from https://platform.openai.com/api-keys)
3. **Your Telegram User ID** (from @userinfobot)

## Expected Costs

**Recommended Setup (Fast):**
- OpenAI GPT-4o-mini: ~$1-2/month
- OpenAI Whisper API: ~$1-2/month
- Edge-TTS: Free
- **Total: ~$2-4/month**

**Budget Setup (Slower transcription):**
- OpenAI GPT-4o-mini: ~$1-2/month
- Local Whisper (CPU): Free but slow
- Edge-TTS: Free
- **Total: ~$1-2/month**

## Quick Deploy

### Option 1: Automated (Recommended)

```bash
# SSH as root
ssh root@rocket.id10t.social

# Run deployment
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/ARDEN/remote-server/scripts/deploy-rocket.sh | bash

# Then follow the prompts to:
# 1. Switch to arden user
# 2. Clone repository
# 3. Run deploy script again as arden user
# 4. Configure .env with your API keys
```

### Option 2: Manual

```bash
# SSH as root
ssh root@rocket.id10t.social

# Install dependencies
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs python3 python3-pip python3-venv build-essential git

# Create arden user
adduser arden
usermod -aG sudo arden
su - arden

# Clone and deploy
cd ~
git clone https://github.com/YOUR_USERNAME/ARDEN.git
cd ARDEN
git checkout remote-server
chmod +x scripts/deploy-rocket.sh
./scripts/deploy-rocket.sh
```

### Configure .env

Edit `~/ARDEN/.env` with:

```bash
# Required
TELEGRAM_BOT_TOKEN=your_bot_token_here

# OpenAI (for fast AI responses)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini

# Use OpenAI Whisper API for fast transcription (recommended)
USE_OPENAI_WHISPER=true

# Auto-generated security token (don't change)
ARDEN_API_TOKEN=<random-token>
```

### Start the Bot

```bash
pm2 start ecosystem.config.js
pm2 save
```

## Performance

**With OpenAI Whisper API (Recommended):**
- Total response time: **3-6 seconds**
- Cost: ~$2-4/month

**With Local Whisper (Budget):**
- Total response time: **7-19 seconds** (slower transcription)
- Cost: ~$1-2/month

## Management

```bash
# Check status
pm2 status

# View logs
pm2 logs arden-bot

# Restart
pm2 restart arden-bot

# Create backup
./scripts/backup.sh
```

## Security

1. Add your Telegram User ID to `config/arden.json`
2. Firewall is auto-configured (SSH only)
3. Fail2ban installed for SSH protection

## Documentation

- **Quick Guide:** `DEPLOY_ROCKET.md` (detailed instructions)
- **General VPS Guide:** `docs/HETZNER_DEPLOYMENT.md`
- **Deployment Checklist:** `DEPLOYMENT_CHECKLIST.md`

## Troubleshooting

**Slow responses?**
- Set `USE_OPENAI_WHISPER=true` in `.env`
- Or edit voice processing to use "tiny" Whisper model

**Out of memory?**
- `pm2 restart arden-bot`
- Check: `free -h`

**Bot not responding?**
- `pm2 logs arden-bot` to check errors
- Verify API keys in `.env`

---

**Ready to deploy!** Start with: `ssh root@rocket.id10t.social`
