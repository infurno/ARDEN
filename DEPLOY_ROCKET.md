# Deploy ARDEN to rocket.id10t.social

Quick deployment guide for your Hetzner VPS (CPU-only configuration).

## Server Info
- **Host:** rocket.id10t.social
- **CPU-only:** Using OpenAI API for fast responses
- **Current user:** root (will create `arden` user during setup)

## Prerequisites

You'll need:
- [x] SSH access to rocket.id10t.social
- [ ] Telegram Bot Token (from @BotFather)
- [ ] Your Telegram User ID (from @userinfobot)
- [ ] OpenAI API Key (for GPT-4o-mini - ~$1-2/month)

## Quick Deploy

### 1. SSH into server
```bash
ssh root@rocket.id10t.social
```

### 2. Run one-command deployment
```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/ARDEN/remote-server/scripts/deploy-rocket.sh | bash
```

Or manually:

### 3. Manual Deployment Steps

```bash
# Update system
apt update && apt upgrade -y

# Install dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs python3 python3-pip python3-venv build-essential git ufw fail2ban

# Create non-root user
adduser arden --gecos "" --disabled-password
echo "arden:$(openssl rand -base64 12)" | chpasswd
usermod -aG sudo arden

# Switch to arden user
su - arden

# Clone ARDEN
cd ~
git clone https://github.com/YOUR_USERNAME/ARDEN.git
cd ARDEN
git checkout remote-server

# Run deployment script
chmod +x scripts/deploy-vps.sh
./scripts/deploy-vps.sh
```

### 4. Configure Environment

Edit `.env` file:
```bash
nano ~/ARDEN/.env
```

**Required configuration for CPU-only setup:**
```bash
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Use OpenAI for fast responses (CPU-only optimization)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini

# Voice (free services)
# Whisper will use CPU - may be slow, consider OpenAI Whisper API
# TTS using Edge-TTS (Microsoft, free)

# Optional: Use OpenAI Whisper API for faster transcription
OPENAI_WHISPER_API=true  # Add this to use API instead of local

# Security
ARDEN_API_TOKEN=$(openssl rand -hex 32)
```

### 5. Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw enable
```

### 6. Start Bot

```bash
cd ~/ARDEN
pm2 start ecosystem.config.js
pm2 save
sudo pm2 startup systemd -u arden --hp /home/arden
```

### 7. Verify

```bash
pm2 status
pm2 logs arden-bot
```

Send a message to your bot on Telegram!

## Performance Expectations (CPU-only)

**With Local Whisper (CPU):**
- Whisper transcription: 5-15 seconds
- OpenAI GPT-4o-mini: 1-2 seconds
- Edge-TTS: 1-2 seconds
- **Total: 7-19 seconds**

**With OpenAI Whisper API (Recommended):**
- Whisper API: 1-2 seconds
- OpenAI GPT-4o-mini: 1-2 seconds
- Edge-TTS: 1-2 seconds
- **Total: 3-6 seconds**

## Cost Estimate

**Recommended setup (OpenAI APIs):**
- GPT-4o-mini: ~$1-2/month
- Whisper API: ~$1-2/month
- Edge-TTS: Free
- **Total: ~$2-4/month + VPS cost**

**Budget setup (local Whisper):**
- GPT-4o-mini: ~$1-2/month
- Local Whisper: Free (but slow)
- Edge-TTS: Free
- **Total: ~$1-2/month + VPS cost**

## Optimization Tips for CPU-Only

1. **Use smaller Whisper model** (edit voice processing):
   ```python
   model = whisper.load_model("tiny")  # Fastest, good enough for voice
   ```

2. **Or use OpenAI Whisper API** (recommended):
   - Much faster than local
   - Only ~$0.006 per minute of audio
   - ~$1-2/month for typical usage

3. **Keep GPT-4o-mini** for AI:
   - Fast cloud inference
   - Cheap (~$0.15 per 1M input tokens)
   - Much better than CPU Ollama

## Troubleshooting

**Slow voice transcription:**
- Switch to OpenAI Whisper API or use "tiny" model

**Out of memory:**
- Restart bot: `pm2 restart arden-bot`
- Check usage: `free -h`

**Bot not responding:**
- Check logs: `pm2 logs arden-bot`
- Verify .env has correct tokens

## Management Commands

```bash
# Status
pm2 status

# Logs
pm2 logs arden-bot

# Restart
pm2 restart arden-bot

# Backup
./scripts/backup.sh

# Update ARDEN
cd ~/ARDEN
git pull origin remote-server
pm2 restart arden-bot
```

## Security Checklist

- [x] Firewall enabled (UFW)
- [x] Fail2ban installed
- [ ] Add your Telegram User ID to `config/arden.json`
- [ ] Set strong passwords (done automatically)
- [ ] Regular backups scheduled

## Next Steps

1. Test voice messages
2. Optimize Whisper (local vs API)
3. Set up automated backups
4. Monitor costs in OpenAI dashboard

---

**Server:** rocket.id10t.social  
**User:** arden  
**Path:** /home/arden/ARDEN  
**Logs:** `pm2 logs arden-bot`
