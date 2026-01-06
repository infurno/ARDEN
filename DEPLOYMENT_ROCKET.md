# ARDEN Production Deployment Guide
## rocket.id10t.social (Hetzner VPS)

This guide covers deploying ARDEN to your Hetzner VPS with a CPU-optimized configuration using OpenAI APIs.

---

## 📋 Overview

**Server:** rocket.id10t.social  
**Platform:** Hetzner VPS  
**Configuration:** CPU-only (no GPU required)  
**AI Provider:** OpenAI (GPT-4o-mini + Whisper API)  
**Expected Cost:** ~$3-5/month  
**Response Time:** ~3-6 seconds  

---

## 🚀 Quick Deployment

### 1. Prerequisites on VPS

**Option A: Automated Setup (Recommended)**

```bash
# Create ARDEN user (if not exists)
sudo useradd -m -s /bin/bash arden
sudo usermod -aG sudo arden

# Switch to arden user
sudo su - arden

# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/infurno/ARDEN/arden-prod/scripts/setup-vps.sh | bash
```

**Option B: Manual Setup**

SSH into your server and set up the environment:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install build tools and dependencies (IMPORTANT for better-sqlite3)
sudo apt install -y \
    build-essential \
    python3-dev \
    python3-pip \
    python3-setuptools \
    python3-distutils \
    git \
    curl \
    wget \
    nginx \
    certbot \
    python3-certbot-nginx \
    sqlite3 \
    libsqlite3-dev

# Install Node.js (via NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Install PM2 globally
npm install -g pm2

# Create ARDEN user (if not exists)
sudo useradd -m -s /bin/bash arden
sudo usermod -aG sudo arden

# Switch to arden user
sudo su - arden
```

### 2. Clone Repository

```bash
# Clone the repo
cd ~
git clone https://github.com/yourusername/ARDEN.git
cd ARDEN

# Checkout production branch
git checkout arden-prod

# Install dependencies
cd api
npm install --production
cd ..
```

### 3. Configure Environment

```bash
# Copy production environment template
cp .env.rocket .env

# Edit with your actual API keys
nano .env
```

Required values in `.env`:
- `TELEGRAM_BOT_TOKEN` - Get from @BotFather
- `OPENAI_API_KEY` - Get from https://platform.openai.com/api-keys
- `SESSION_SECRET` - Generate with: `openssl rand -hex 32`
- `ARDEN_API_TOKEN` - Generate with: `openssl rand -hex 32`

### 4. Setup SSL Certificate

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot certonly --nginx -d rocket.id10t.social
```

### 5. Configure Nginx

```bash
# Copy nginx config
sudo cp config/nginx-rocket.conf /etc/nginx/sites-available/arden
sudo ln -s /etc/nginx/sites-available/arden /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### 6. Create Log Directory

```bash
sudo mkdir -p /var/log/arden
sudo chown -R arden:arden /var/log/arden
```

### 7. Start Services with PM2

```bash
# Start all services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions from the command output
```

### 8. Setup Systemd Service (Optional)

For automatic startup on system boot:

```bash
# Copy service file
sudo cp config/arden.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable arden

# Start service
sudo systemctl start arden
```

---

## 🔧 Configuration Details

### Environment Variables (.env)

The production environment uses:
- **AI_PROVIDER:** openai
- **OPENAI_MODEL:** gpt-4o-mini (fast & cheap)
- **STT:** OpenAI Whisper API (cloud-based)
- **TTS:** Edge TTS (free Microsoft TTS)

### PM2 Configuration

Two processes run via PM2:
1. **arden-bot** - Telegram bot (port 3000)
2. **arden-web** - Web interface (port 3001)

### Nginx Configuration

- **Port 80:** Redirects to HTTPS
- **Port 443:** SSL/TLS enabled
- Proxies to local services on ports 3000/3001
- WebSocket support for real-time updates

---

## 📊 Monitoring

### Check Service Status

```bash
# PM2 status
pm2 status

# View logs
pm2 logs

# View specific service logs
pm2 logs arden-bot
pm2 logs arden-web

# System service status
sudo systemctl status arden
```

### View Logs

```bash
# PM2 logs
pm2 logs

# Application logs
tail -f /var/log/arden/bot-combined.log
tail -f /var/log/arden/web-combined.log

# Nginx logs
sudo tail -f /var/log/nginx/arden-access.log
sudo tail -f /var/log/nginx/arden-error.log
```

---

## 🔄 Updates & Deployment

### Automated Deployment

From your local machine:

```bash
./scripts/deploy-rocket.sh
```

This script will:
1. Connect to rocket.id10t.social
2. Pull latest changes
3. Install dependencies
4. Restart services

### Manual Update

On the server:

```bash
cd ~/ARDEN
git pull origin arden-prod
cd api && npm install --production && cd ..
pm2 restart all
```

---

## 🔒 Security Checklist

- [ ] SSL certificate configured (Let's Encrypt)
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] SSH key authentication enabled
- [ ] Password authentication disabled for SSH
- [ ] .env file permissions set to 600
- [ ] PM2 logs rotation enabled
- [ ] Regular security updates scheduled
- [ ] Telegram bot restricted to authorized users

### Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 💰 Cost Breakdown

### OpenAI API Usage (estimated)

- **GPT-4o-mini:** $0.15 per 1M input tokens, $0.60 per 1M output tokens
- **Whisper API:** $0.006 per minute
- **Estimated monthly usage:**
  - ~1000 messages/month
  - ~100 voice messages/month
  - **Total:** ~$3-5/month

### Server Costs

- **Hetzner VPS:** Variable (check your plan)
- **Total monthly cost:** VPS cost + $3-5

---

## 🐛 Troubleshooting

### NPM Install Fails (better-sqlite3 build error)

If you see errors about `distutils` or `node-gyp` during `npm install`:

**Root Cause:** Python 3.13+ removed the `distutils` module, and node-gyp may be using your venv Python instead of system Python.

**Solution:**

```bash
# Install Python build dependencies
sudo apt install -y \
    build-essential \
    python3-dev \
    python3-pip \
    python3-setuptools \
    sqlite3 \
    libsqlite3-dev

# Deactivate any active venv
deactivate 2>/dev/null || true

# Force node-gyp to use system Python
export npm_config_python=/usr/bin/python3

# Clean npm cache and retry
cd ~/ARDEN/api
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --production
```

**Alternative (if above doesn't work):**

```bash
# Install setuptools in venv (provides distutils for Python 3.13+)
source ~/ARDEN/venv/bin/activate
pip install setuptools

# Retry installation
cd ~/ARDEN/api
npm install --production
```

**Permanent Fix:** Add to `~/.bashrc`:
```bash
export npm_config_python=/usr/bin/python3
```

### Service Won't Start

```bash
# Check PM2 logs
pm2 logs

# Check for port conflicts
sudo netstat -tulpn | grep :300

# Restart services
pm2 restart all
```

### Nginx 502 Bad Gateway

```bash
# Check if services are running
pm2 status

# Check nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew

# Test auto-renewal
sudo certbot renew --dry-run
```

### High Memory Usage

```bash
# Check memory
free -h

# PM2 restart with memory cleanup
pm2 restart all

# Check process memory
pm2 monit
```

---

## 📞 Support & Resources

- **Documentation:** See `/docs` directory
- **Issues:** Check application logs first
- **Updates:** Pull latest from `arden-prod` branch

---

## 🎯 Next Steps

After deployment:

1. **Test the bot:** Send a message on Telegram
2. **Access web interface:** https://rocket.id10t.social
3. **Monitor logs:** `pm2 logs`
4. **Set up backups:** Configure automated backups of `.env` and data
5. **Configure allowed users:** Update `telegram.allowed_users` in config

---

## 📝 Notes

- Default web interface credentials will be set on first login
- Session data is stored in SQLite database
- Voice recordings are NOT stored to save space
- Logs rotate automatically via PM2
- SSL certificates auto-renew via certbot

For questions or issues, check the logs first:
```bash
pm2 logs
```
