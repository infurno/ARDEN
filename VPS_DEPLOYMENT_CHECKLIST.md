# VPS Deployment Checklist for ARDEN

This checklist ensures your ARDEN bot is ready to run on your VPS (rocket.id10t.social).

## Pre-Deployment Checklist

### 1. Required Credentials
- [ ] Telegram Bot Token (from @BotFather)
- [ ] OpenAI API Key (for GPT-4o-mini and Whisper)
- [ ] SSH access to your VPS
- [ ] Domain DNS configured (rocket.id10t.social → your VPS IP)

### 2. Local Repository Status
- [ ] All changes committed to git
- [ ] `.env` file NOT committed (in .gitignore)
- [ ] `arden-prod` branch exists and is up to date
- [ ] Scripts have executable permissions

### 3. VPS Server Requirements
- [ ] Ubuntu 20.04+ or Debian 11+
- [ ] Minimum 1GB RAM (2GB recommended)
- [ ] 10GB+ available disk space
- [ ] Port 22, 80, and 443 accessible

---

## Deployment Steps

### Phase 1: Initial VPS Setup

#### 1.1 Create ARDEN User
```bash
# SSH into your VPS as root or sudo user
ssh root@rocket.id10t.social

# Create arden user
sudo useradd -m -s /bin/bash arden
sudo usermod -aG sudo arden
sudo passwd arden  # Set a password

# Switch to arden user
sudo su - arden
```

#### 1.2 Run Automated Setup Script
```bash
# Download and run the VPS setup script
curl -fsSL https://raw.githubusercontent.com/yourusername/ARDEN/arden-prod/scripts/setup-vps.sh | bash

# OR if you have the repo already:
cd ~/ARDEN
./scripts/setup-vps.sh
```

**What this installs:**
- Node.js 18+ via NVM
- PM2 process manager
- Nginx web server
- Certbot for SSL
- Build tools (gcc, make, etc.)
- Python 3 development headers
- SQLite3 libraries
- FFmpeg (for audio processing)

#### 1.3 Clone Repository
```bash
# Clone your ARDEN repository
cd ~
git clone https://github.com/yourusername/ARDEN.git
cd ARDEN

# Checkout production branch
git checkout arden-prod
```

---

### Phase 2: Configuration

#### 2.1 Configure Environment Variables
```bash
cd ~/ARDEN

# Copy production template
cp .env.example .env

# Edit with your actual API keys
nano .env
```

**Required variables in .env:**
```bash
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
OPENAI_API_KEY=sk-your-openai-api-key
ARDEN_API_TOKEN=$(openssl rand -hex 32)
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
```

**Optional but recommended:**
```bash
# For session security
SESSION_SECRET=$(openssl rand -hex 32)
```

#### 2.2 Verify Configuration
```bash
# Check that .env file has proper permissions
chmod 600 .env

# Verify critical values are set
grep -E "TELEGRAM_BOT_TOKEN|OPENAI_API_KEY|ARDEN_API_TOKEN" .env
```

#### 2.3 Configure Production Settings
```bash
# The production config is already set in config/arden.production.json
# Verify it exists:
cat config/arden.production.json
```

---

### Phase 3: Install Dependencies

#### 3.1 Install Node.js Dependencies
```bash
cd ~/ARDEN/api

# IMPORTANT: Deactivate any Python venv first
deactivate 2>/dev/null || true

# Ensure npm uses system Python
export npm_config_python=/usr/bin/python3

# Install dependencies
rm -rf node_modules package-lock.json  # Clean install
npm cache clean --force
npm install --production
```

**If you see errors about better-sqlite3:**
- Check [QUICK_FIX_VPS.md](QUICK_FIX_VPS.md)
- Ensure build-essential and python3-dev are installed
- Verify npm is using system Python: `npm config get python`

#### 3.2 Verify Installation
```bash
# Check that critical packages installed
npm list better-sqlite3 node-telegram-bot-api express

# You should see version numbers, not errors
```

---

### Phase 4: Nginx and SSL Setup

#### 4.1 Configure Nginx
```bash
# Copy nginx configuration
sudo cp ~/ARDEN/config/nginx-rocket.conf /etc/nginx/sites-available/arden

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/arden /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t
```

#### 4.2 Get SSL Certificate
```bash
# Get Let's Encrypt certificate
sudo certbot --nginx -d rocket.id10t.social

# Follow the prompts:
# - Enter email for renewal notifications
# - Agree to terms of service
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)
```

#### 4.3 Restart Nginx
```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

---

### Phase 5: Create Required Directories

```bash
cd ~/ARDEN

# Create log directory
sudo mkdir -p /var/log/arden
sudo chown -R arden:arden /var/log/arden

# Create data directories
mkdir -p ~/Notes
mkdir -p ~/Documents
mkdir -p voice/recordings
mkdir -p voice/responses
```

---

### Phase 6: Start Services

#### 6.1 Start with PM2
```bash
cd ~/ARDEN

# Load environment variables (PM2 will inherit them)
export $(cat .env | xargs)

# Start services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs (usually requires sudo)
```

#### 6.2 Verify Services are Running
```bash
# Check PM2 status
pm2 status

# You should see:
# - arden-bot: online
# - arden-web: online

# View logs
pm2 logs --lines 50

# Test the bot
# Send a message to your Telegram bot
```

---

### Phase 7: Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

---

### Phase 8: Testing

#### 8.1 Test Telegram Bot
- [ ] Send a text message to your bot
- [ ] Send a voice message to your bot
- [ ] Verify responses work

#### 8.2 Test Web Interface
- [ ] Open https://rocket.id10t.social in browser
- [ ] Verify SSL certificate is valid (no warnings)
- [ ] Try logging in
- [ ] Test basic functionality

#### 8.3 Check Logs
```bash
# PM2 logs
pm2 logs arden-bot --lines 100
pm2 logs arden-web --lines 100

# System logs
tail -f /var/log/arden/bot-combined.log
tail -f /var/log/arden/web-combined.log

# Nginx logs
sudo tail -f /var/log/nginx/arden-access.log
sudo tail -f /var/log/nginx/arden-error.log
```

---

## Post-Deployment

### Monitoring
```bash
# Check PM2 status
pm2 status

# Monitor resource usage
pm2 monit

# Check disk space
df -h

# Check memory
free -h
```

### Maintenance

#### Update ARDEN
```bash
cd ~/ARDEN
git pull origin arden-prod
cd api && npm install --production && cd ..
pm2 restart all
```

#### Restart Services
```bash
pm2 restart all
```

#### Stop Services
```bash
pm2 stop all
```

#### View Logs
```bash
pm2 logs
```

#### SSL Certificate Renewal
```bash
# Certbot auto-renews, but you can test:
sudo certbot renew --dry-run

# Force renewal if needed:
sudo certbot renew
sudo systemctl reload nginx
```

---

## Troubleshooting

### Bot Not Responding
```bash
# Check if services are running
pm2 status

# Check logs for errors
pm2 logs arden-bot

# Restart bot
pm2 restart arden-bot
```

### NPM Install Fails (better-sqlite3)
See [QUICK_FIX_VPS.md](QUICK_FIX_VPS.md)

Key fixes:
1. Install build-essential and python3-dev
2. Deactivate any Python venv
3. Set npm to use system Python: `export npm_config_python=/usr/bin/python3`
4. Clean install: `rm -rf node_modules && npm install`

### Nginx 502 Bad Gateway
```bash
# Check if services are running
pm2 status

# Check service ports
sudo netstat -tulpn | grep :300

# Restart services
pm2 restart all
sudo systemctl restart nginx
```

### High Memory Usage
```bash
# Check memory
free -h

# Restart services to clear memory
pm2 restart all
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew
sudo systemctl reload nginx
```

---

## Security Hardening (Recommended)

### 1. Disable Password Authentication for SSH
```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Set:
PasswordAuthentication no
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

### 2. Restrict Telegram Bot to Specific Users
```bash
# Edit production config
nano ~/ARDEN/config/arden.production.json

# Add your Telegram user ID to allowed_users:
"telegram": {
  "allowed_users": [123456789]
}

# Restart bot
pm2 restart arden-bot
```

### 3. Set Secure File Permissions
```bash
chmod 600 ~/.env
chmod 700 ~/ARDEN/voice/recordings
chmod 700 ~/ARDEN/voice/responses
```

### 4. Enable Fail2Ban (Optional)
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Quick Reference Commands

### Service Management
```bash
pm2 start ecosystem.config.js   # Start all services
pm2 restart all                   # Restart all services
pm2 stop all                      # Stop all services
pm2 logs                          # View logs
pm2 status                        # Check status
pm2 monit                         # Monitor resources
```

### Deployment
```bash
./scripts/deploy-rocket.sh        # Automated deployment from local
```

### Nginx
```bash
sudo nginx -t                     # Test config
sudo systemctl restart nginx      # Restart
sudo systemctl status nginx       # Check status
```

### SSL
```bash
sudo certbot renew               # Renew certificates
sudo certbot certificates        # List certificates
```

---

## Success Criteria

Your deployment is successful when:
- [ ] PM2 shows both services as "online"
- [ ] Telegram bot responds to messages
- [ ] Voice messages are processed correctly
- [ ] Web interface loads at https://rocket.id10t.social
- [ ] SSL certificate is valid (no browser warnings)
- [ ] Logs show no critical errors
- [ ] Services restart automatically after reboot

---

## Getting Help

1. Check logs first: `pm2 logs`
2. Review error messages
3. See [DEPLOYMENT_ROCKET.md](DEPLOYMENT_ROCKET.md) for detailed guide
4. See [QUICK_FIX_VPS.md](QUICK_FIX_VPS.md) for common issues

---

## Estimated Costs

- **VPS:** Varies by provider (Hetzner: ~$5-10/month)
- **OpenAI API:** ~$3-5/month for moderate usage
  - GPT-4o-mini: ~$0.15 per 1M input tokens
  - Whisper: $0.006 per minute of audio
- **SSL Certificate:** Free (Let's Encrypt)
- **Total:** ~$8-15/month

---

## Deployment Timeline

- **Initial setup:** 30-60 minutes
- **Configuration:** 15-30 minutes
- **Testing:** 15-30 minutes
- **Total:** 1-2 hours for first deployment

Subsequent deployments with `./scripts/deploy-rocket.sh`: ~2-5 minutes
