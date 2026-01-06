# ARDEN Configuration for rocket.id10t.social

## Selected Configuration

**Server:** rocket.id10t.social (CPU-only VPS)  
**AI Provider:** OpenAI GPT-4o-mini  
**Voice Transcription:** OpenAI Whisper API  
**Voice Generation:** Edge-TTS (Microsoft, free)

## Cost Estimate

- **GPT-4o-mini:** ~$1-2/month
- **Whisper API:** ~$2/month
- **Edge-TTS:** Free
- **Total:** ~$3-4/month

## Performance

- **Voice transcription:** 1-2 seconds
- **AI processing:** 1-2 seconds  
- **Voice generation:** 1-2 seconds
- **Total response time:** 3-6 seconds ⚡

## Required API Keys

You'll need to get these before deploying:

1. **Telegram Bot Token**
   - Go to @BotFather on Telegram
   - Send `/newbot`
   - Follow prompts
   - Copy the token

2. **OpenAI API Key**
   - Go to https://platform.openai.com/api-keys
   - Create new secret key
   - Copy the key (starts with `sk-`)

3. **Your Telegram User ID**
   - Message @userinfobot on Telegram
   - Copy your numeric user ID

## .env Configuration

When you deploy, your `.env` file should look like this:

```bash
# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# OpenAI (for both AI and Whisper)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-4o-mini

# Use OpenAI Whisper API (fast transcription)
USE_OPENAI_WHISPER=true

# Security (auto-generated)
ARDEN_API_TOKEN=<random-hex-string>
```

## Deployment Steps

1. **SSH to server:**
   ```bash
   ssh root@rocket.id10t.social
   ```

2. **Run deployment:**
   ```bash
   # Install system dependencies
   apt update && apt upgrade -y
   curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
   apt install -y nodejs python3 python3-pip python3-venv build-essential git

   # Create user
   adduser arden
   usermod -aG sudo arden
   su - arden

   # Clone and deploy
   cd ~
   git clone <your-repo-url>
   cd ARDEN
   git checkout remote-server
   ./scripts/deploy-rocket.sh
   ```

3. **Configure .env** with your API keys (script will prompt you)

4. **Start bot:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```

5. **Test:** Send a voice message to your bot on Telegram!

## Monitoring Costs

Track your OpenAI usage at:
- https://platform.openai.com/usage

Typical usage:
- 30 messages/day = ~$3-4/month
- 10 messages/day = ~$1-2/month

## Alternative: Switch to Local Whisper

If costs are too high, you can switch to free local Whisper:

1. Edit `.env`:
   ```bash
   USE_OPENAI_WHISPER=false
   ```

2. Restart bot:
   ```bash
   pm2 restart arden-bot
   ```

This saves ~$2/month but adds 5-10 seconds to transcription time.

## Support

- Full deployment guide: `DEPLOY_ROCKET.md`
- Troubleshooting: Check `pm2 logs arden-bot`
- OpenAI docs: https://platform.openai.com/docs

---

**Configuration finalized:** January 6, 2026  
**Optimized for:** Fast responses on CPU-only VPS  
**Estimated cost:** $3-4/month
