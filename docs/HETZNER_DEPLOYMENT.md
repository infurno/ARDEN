# ARDEN Deployment Guide - Hetzner VPS

This guide will help you deploy ARDEN on a Hetzner VPS with GPU support for optimal performance.

## Server Requirements

### Recommended Hetzner Server
- **CPX41** (8 vCPU, 16 GB RAM) - €28.79/month - For CPU-only
- **CCX33** (8 vCPU, 32 GB RAM) - €57.99/month - For CPU-intensive workloads
- **GPU Server** (if available in your region) - For GPU-accelerated inference

### Minimum Requirements
- Ubuntu 22.04 LTS
- 4 GB RAM (8+ GB recommended)
- 20 GB storage (50+ GB recommended)
- Root or sudo access

## Pre-Deployment Checklist

Before starting, ensure you have:

- [ ] Hetzner VPS provisioned and accessible via SSH
- [ ] Telegram Bot Token (create with @BotFather)
- [ ] Your Telegram User ID (get from @userinfobot)
- [ ] (Optional) OpenAI API key if not using Ollama
- [ ] SSH key configured for secure access

## Quick Deployment

### 1. Initial Server Setup

```bash
# SSH into your Hetzner VPS
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Install basic dependencies
apt install -y curl git build-essential ufw fail2ban

# Configure firewall
ufw allow OpenSSH
ufw enable

# Create a non-root user (recommended)
adduser arden
usermod -aG sudo arden
su - arden
```

### 2. Install Node.js 18+

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should be 18.x or higher
```

### 3. Install Python 3.11+

```bash
sudo apt install -y python3 python3-pip python3-venv
python3 --version  # Should be 3.11 or higher
```

### 4. Install Ollama (Local AI)

```bash
curl -fsSL https://ollama.com/install.sh | sh

# Pull your preferred model
ollama pull llama3.2

# Verify installation
ollama list
```

### 5. Clone and Setup ARDEN

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/ARDEN.git
cd ARDEN

# Run automated deployment script
chmod +x scripts/deploy-vps.sh
./scripts/deploy-vps.sh
```

The deployment script will:
- Set up Python virtual environment
- Install all dependencies
- Configure PM2 for process management
- Set up automatic startup
- Guide you through .env configuration

### 6. Configure Environment Variables

```bash
cd ~/ARDEN
cp .env.example .env
nano .env
```

**Minimum required configuration:**

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE

# AI Provider (choose one)
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
OLLAMA_URL=http://localhost:11434

# Optional: OpenAI for faster/better responses
# AI_PROVIDER=openai
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini

# Security (generate random token)
ARDEN_API_TOKEN=$(openssl rand -hex 32)
```

### 7. Start the Bot

```bash
cd ~/ARDEN/api
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 8. Verify Deployment

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs arden-bot

# Test bot in Telegram
# Send a message to your bot
```

## GPU Acceleration (Optional but Recommended)

If your Hetzner server has an NVIDIA GPU:

### Install NVIDIA Drivers

```bash
# Check if GPU is detected
lspci | grep -i nvidia

# Install drivers
sudo apt install -y nvidia-driver-535
sudo reboot

# Verify after reboot
nvidia-smi
```

### Install CUDA Toolkit

```bash
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all.deb
sudo apt update
sudo apt install -y cuda-toolkit-12-3

# Add to PATH
echo 'export PATH=/usr/local/cuda/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc

# Verify
nvcc --version
```

### Install GPU-Accelerated PyTorch

```bash
cd ~/ARDEN
source venv/bin/activate
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Configure Ollama for GPU

Ollama automatically detects and uses GPU. Verify with:

```bash
# This should show GPU memory usage when running
nvidia-smi

# Run a test inference
ollama run llama3.2 "Hello, test GPU"
```

## Security Configuration

### Restrict Telegram Access

Edit `config/arden.json`:

```bash
nano ~/ARDEN/config/arden.json
```

Add your Telegram user ID:

```json
{
  "telegram": {
    "enabled": true,
    "allowed_users": [YOUR_TELEGRAM_USER_ID]
  }
}
```

### Firewall Configuration

```bash
# Only allow SSH (Telegram bot doesn't need open ports)
sudo ufw status
sudo ufw allow OpenSSH
sudo ufw enable
```

### Install Fail2Ban (Prevent SSH Brute Force)

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Monitoring and Maintenance

### View Logs

```bash
# Real-time logs
pm2 logs arden-bot

# Last 100 lines
pm2 logs arden-bot --lines 100

# Error logs only
pm2 logs arden-bot --err
```

### Restart Bot

```bash
pm2 restart arden-bot
```

### Update ARDEN

```bash
cd ~/ARDEN
git pull origin main
source venv/bin/activate
pip install -r requirements.txt --upgrade
cd api
npm install
pm2 restart arden-bot
```

### Monitor System Resources

```bash
# CPU, RAM usage
htop

# Disk usage
df -h

# GPU usage (if available)
nvidia-smi
watch -n 1 nvidia-smi  # Real-time monitoring
```

### Backup Important Files

```bash
# Run backup script
cd ~/ARDEN
./scripts/backup.sh

# Manual backup
tar -czf arden-backup-$(date +%Y%m%d).tar.gz .env config/ history/ skills/

# Download to local machine
scp arden@YOUR_SERVER_IP:~/ARDEN/arden-backup-*.tar.gz ./
```

## Performance Optimization

### With GPU (RTX 5070 or similar)
- Whisper STT: 0.5-1 second
- Ollama inference: 1-3 seconds
- Total response time: 1.5-4 seconds

### CPU-Only
- Whisper STT: 5-10 seconds
- Ollama inference: 10-30 seconds
- Total response time: 15-40 seconds

### Tips for CPU-Only Servers

1. **Use smaller Whisper model:**
   ```python
   # Edit voice processing script to use "tiny" or "base" model
   model = whisper.load_model("tiny")  # Instead of "base" or "small"
   ```

2. **Use smaller Ollama model:**
   ```bash
   ollama pull llama3.2:1b  # 1 billion parameter model (faster)
   ```

3. **Use OpenAI API for faster responses:**
   ```bash
   # In .env
   AI_PROVIDER=openai
   OPENAI_MODEL=gpt-4o-mini  # ~$1-2/month
   ```

## Troubleshooting

### Bot Not Responding

```bash
# Check if bot is running
pm2 status

# Check logs for errors
pm2 logs arden-bot --err

# Restart bot
pm2 restart arden-bot
```

### Ollama Not Working

```bash
# Check if Ollama service is running
sudo systemctl status ollama

# Restart Ollama
sudo systemctl restart ollama

# Test Ollama
ollama list
ollama run llama3.2 "test"
```

### Out of Memory

```bash
# Check memory usage
free -h

# Restart bot to free memory
pm2 restart arden-bot

# Consider upgrading to larger server or using OpenAI API
```

### Python Virtual Environment Issues

```bash
# Recreate virtual environment
cd ~/ARDEN
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Cost Estimation

### Hetzner VPS (CPU-only)
- CPX31 (4 vCPU, 8 GB): €15.37/month
- CPX41 (8 vCPU, 16 GB): €28.79/month

### Additional Costs
- Ollama (local): €0
- Edge-TTS: €0
- Whisper (local): €0
- **Total: VPS cost only**

### vs Cloud Alternative
- OpenAI GPT-4o-mini: ~€2/month
- ElevenLabs voice: ~€30/month
- Whisper API: ~€2/month
- **Total: ~€34/month + VPS**

**Self-hosted savings: ~€408/year**

## Next Steps

1. Test voice messages in Telegram
2. Customize skills in `skills/` directory
3. Set up automated backups
4. Monitor performance and adjust models
5. Consider adding monitoring (e.g., Grafana + Prometheus)

## Support

For issues specific to:
- Hetzner VPS: https://docs.hetzner.com/
- ARDEN setup: Check `docs/` directory
- Telegram Bot: https://core.telegram.org/bots

---

**Deployment complete!** Your ARDEN bot should now be running 24/7 on your Hetzner VPS.
