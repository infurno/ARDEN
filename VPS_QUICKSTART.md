# ARDEN VPS Deployment - Quick Start

Deploy ARDEN on your Hetzner VPS in minutes.

## Prerequisites

- Hetzner VPS with Ubuntu 22.04+ (recommended: CPX41 - 8 vCPU, 16 GB RAM)
- Telegram Bot Token (get from @BotFather)
- Your Telegram User ID (get from @userinfobot)
- SSH access to your server

## Quick Deploy (Automated)

1. **SSH into your Hetzner VPS:**
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

2. **Create user and setup basics:**
   ```bash
   apt update && apt upgrade -y
   apt install -y curl git build-essential
   adduser arden
   usermod -aG sudo arden
   su - arden
   ```

3. **Install Node.js 18+:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs python3 python3-pip python3-venv
   ```

4. **Install Ollama (local AI):**
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ollama pull llama3.2
   ```

5. **Clone and deploy ARDEN:**
   ```bash
   cd ~
   git clone https://github.com/YOUR_USERNAME/ARDEN.git
   cd ARDEN
   chmod +x scripts/deploy-vps.sh
   ./scripts/deploy-vps.sh
   ```

6. **Configure your bot:**
   - Edit `.env` and add your `TELEGRAM_BOT_TOKEN`
   - The script will guide you through this

7. **Done!** Your bot is now running 24/7

## Manual Deployment

See detailed instructions in: `docs/HETZNER_DEPLOYMENT.md`

## Management Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs arden-bot

# Restart bot
pm2 restart arden-bot

# Stop bot
pm2 stop arden-bot

# Create backup
./scripts/backup.sh
```

## Alternative: systemd Service

If you prefer systemd over PM2:

```bash
# Edit service file with your username/paths
sudo nano scripts/arden-bot.service

# Install service
sudo cp scripts/arden-bot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable arden-bot
sudo systemctl start arden-bot

# Check status
sudo systemctl status arden-bot

# View logs
sudo journalctl -u arden-bot -f
```

## Files Created

- `docs/HETZNER_DEPLOYMENT.md` - Complete deployment guide
- `ecosystem.config.js` - PM2 configuration
- `scripts/deploy-vps.sh` - Automated deployment script
- `scripts/backup.sh` - Backup utility
- `scripts/arden-bot.service` - systemd service file
- `scripts/nginx-arden.conf` - Optional nginx reverse proxy

## Security Checklist

- [ ] Configure firewall: `sudo ufw allow OpenSSH && sudo ufw enable`
- [ ] Set up fail2ban: `sudo apt install fail2ban`
- [ ] Add your Telegram User ID to `config/arden.json`
- [ ] Keep `.env` file secure (never commit to git)
- [ ] Set up regular backups with `scripts/backup.sh`

## Estimated Costs

**Self-hosted on Hetzner:**
- CPX41 VPS: €28.79/month
- Ollama + Edge-TTS: €0/month
- **Total: €28.79/month (~$31/month)**

**vs Cloud Alternative:**
- Hetzner VPS: €28.79/month
- OpenAI GPT-4o-mini: €2/month
- ElevenLabs: €30/month
- **Total: €60.79/month (~$66/month)**

**Savings with local AI: ~€384/year (~$420/year)**

## Support

- Full documentation: `docs/HETZNER_DEPLOYMENT.md`
- Hetzner docs: https://docs.hetzner.com/
- Issues: Check logs with `pm2 logs arden-bot`

## Performance

With GPU (RTX 5070 or similar):
- Response time: 1.5-4 seconds
- ~10x faster than CPU-only

CPU-only:
- Response time: 15-40 seconds
- Consider using smaller models or OpenAI API

---

**Ready to deploy!** Start with `./scripts/deploy-vps.sh`
