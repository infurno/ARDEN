# 🐧 ARDEN Linux Deployment Guide

Guide to deploying ARDEN on a Linux server with NVIDIA GPU acceleration.

## Prerequisites

- **Linux**: Ubuntu 20.04+ or similar
- **GPU**: NVIDIA GPU (RTX 5070 in your case - excellent!)
- **RAM**: 16GB+ recommended
- **Storage**: 50GB+ free space
- **Network**: Internet connection

## Part 1: System Setup

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install NVIDIA Drivers & CUDA

```bash
# Install NVIDIA drivers
sudo apt install nvidia-driver-535 -y

# Reboot
sudo reboot

# Verify installation
nvidia-smi  # Should show your RTX 5070
```

### Install CUDA Toolkit
```bash
# Add NVIDIA package repositories
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all.deb
sudo apt update

# Install CUDA
sudo apt install cuda-toolkit-12-3 -y

# Add to PATH
echo 'export PATH=/usr/local/cuda/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc

# Verify
nvcc --version
```

## Part 2: Install Dependencies

### Install Node.js 20+
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v20.x
```

### Install Python 3.11+
```bash
sudo apt install -y python3 python3-pip python3-venv
python3 --version
```

### Install Git
```bash
sudo apt install -y git
```

### Install Build Tools
```bash
sudo apt install -y build-essential
```

## Part 3: Install Ollama with GPU Support

```bash
# Install Ollama (automatically detects NVIDIA GPU)
curl -fsSL https://ollama.com/install.sh | sh

# Verify it's using GPU
systemctl status ollama

# Pull your preferred model
ollama pull llama3.2      # Fast, 2GB
# or
ollama pull llama3.1:8b   # Better quality, 4.7GB
# or
ollama pull qwen2.5:14b   # Best quality, 8.5GB

# Test it
ollama run llama3.2 "Hello, test GPU"

# Check GPU usage while running
nvidia-smi  # Should show ollama using GPU
```

**Expected GPU Performance:**
- RTX 5070: 50-100+ tokens/second
- Response time: 0.5-2 seconds (vs 5-10 on CPU)

## Part 4: Clone and Setup ARDEN

```bash
# Clone repository
cd ~
git clone https://github.com/YOUR_USERNAME/ARDEN.git
cd ARDEN

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install openai-whisper edge-tts

# For GPU-accelerated Whisper (optional but recommended)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Install Node dependencies
cd api
npm install
cd ..
```

## Part 5: Configuration

### Create .env file
```bash
cp .env.example .env
nano .env
```

**Minimal configuration:**
```bash
# Required
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather

# AI Provider
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
OLLAMA_URL=http://localhost:11434
```

### Configure for GPU Whisper (Optional)
Edit `config/arden.json`:
```json
{
  "voice": {
    "enabled": true,
    "stt_provider": "local-whisper",
    "stt_config": {
      "model": "base",
      "language": "en",
      "device": "cuda"  // Add this for GPU acceleration
    }
  }
}
```

## Part 6: Test Setup

### Test Ollama
```bash
# Should respond quickly with GPU
ollama run llama3.2 "Tell me a joke"

# Monitor GPU
watch -n 1 nvidia-smi
```

### Test Whisper GPU
```bash
source venv/bin/activate
python3 << 'PYEOF'
import whisper
import torch

print(f"CUDA available: {torch.cuda.is_available()}")
print(f"GPU: {torch.cuda.get_device_name(0)}")

model = whisper.load_model("base").to("cuda")
print("Whisper loaded on GPU successfully!")
PYEOF
```

### Test Bot
```bash
cd ~/ARDEN/api
npm start
```

Send a test message to your Telegram bot!

## Part 7: Run as Service (24/7)

### Install PM2
```bash
sudo npm install -g pm2
```

### Start ARDEN Bot
```bash
cd ~/ARDEN/api
pm2 start telegram-bot.js --name arden-bot

# View logs
pm2 logs arden-bot

# Monitor
pm2 monit
```

### Auto-start on Boot
```bash
# Generate startup script
pm2 startup

# Copy and run the command it outputs (starts with sudo)

# Save current PM2 process list
pm2 save
```

### PM2 Commands
```bash
pm2 status              # Check status
pm2 logs arden-bot      # View logs
pm2 restart arden-bot   # Restart bot
pm2 stop arden-bot      # Stop bot
pm2 delete arden-bot    # Remove from PM2
```

## Part 8: GPU Monitoring

### Install nvtop (GPU monitor)
```bash
sudo apt install nvtop -y
nvtop  # Beautiful GPU monitoring
```

### Monitor Performance
```bash
# GPU usage
watch -n 1 nvidia-smi

# Or use nvtop
nvtop

# PM2 monitoring
pm2 monit
```

## Part 9: Firewall & Security

### Configure UFW Firewall
```bash
# Enable firewall
sudo ufw enable

# Allow SSH (important!)
sudo ufw allow ssh

# If you want external API access (optional)
# sudo ufw allow 3000/tcp

# Check status
sudo ufw status
```

### Secure Telegram Bot
Edit `.env`:
```bash
# Add your Telegram user ID to restrict access
```

Edit `config/arden.json`:
```json
{
  "telegram": {
    "enabled": true,
    "allowed_users": [257580124]  // Your Telegram user ID
  }
}
```

## Part 10: Performance Optimization

### Optimize Ollama
```bash
# Edit Ollama service to use more GPU memory
sudo systemctl edit ollama

# Add:
[Service]
Environment="OLLAMA_NUM_GPU=1"
Environment="OLLAMA_GPU_LAYERS=999"

# Restart
sudo systemctl restart ollama
```

### Use Faster Models
```bash
# For maximum speed on RTX 5070
ollama pull llama3.2      # Fastest, great quality
ollama pull phi3          # Also very fast
```

### GPU-Optimized Whisper
```bash
# Install faster-whisper (optimized for GPU)
pip install faster-whisper

# Update bot to use faster-whisper
# (requires code modification)
```

## Performance Expectations

With RTX 5070:

| Component | CPU Time | GPU Time | Speedup |
|-----------|----------|----------|---------|
| Whisper STT | 5-10s | 0.5-1s | 10x |
| Ollama LLM | 10-30s | 1-3s | 10x |
| **Total** | 15-40s | 1.5-4s | **10x** |

Expected response time: **1-4 seconds** end-to-end!

## Troubleshooting

### GPU Not Detected
```bash
# Check driver
nvidia-smi

# Reinstall CUDA
sudo apt install --reinstall cuda-toolkit-12-3

# Restart Ollama
sudo systemctl restart ollama
```

### Ollama Using CPU Instead of GPU
```bash
# Check Ollama logs
journalctl -u ollama -f

# Should see: "GPU detected"
# If not, reinstall Ollama
```

### Whisper Not Using GPU
```bash
# Verify PyTorch CUDA
python3 -c "import torch; print(torch.cuda.is_available())"

# Reinstall PyTorch with CUDA
pip uninstall torch
pip install torch --index-url https://download.pytorch.org/whl/cu118
```

### Out of Memory Errors
```bash
# Use smaller model
ollama pull llama3.2  # instead of larger models

# Or reduce concurrent requests
# Edit bot to process one at a time
```

## Monitoring & Logs

### Check Bot Logs
```bash
pm2 logs arden-bot --lines 100
```

### Check System Resources
```bash
htop           # CPU/RAM
nvtop          # GPU
df -h          # Disk space
```

### Check Ollama Status
```bash
systemctl status ollama
journalctl -u ollama -f
```

## Backup & Updates

### Backup Configuration
```bash
# Backup .env and custom configs
tar -czf arden-backup-$(date +%Y%m%d).tar.gz .env config/ skills/
```

### Update ARDEN
```bash
cd ~/ARDEN
git pull
cd api
npm install
pm2 restart arden-bot
```

### Update Models
```bash
ollama pull llama3.2  # Re-download to get latest version
```

## Cost Savings

Running on your own Linux server:

**Before (Cloud)**:
- Claude API: $20/month
- OpenAI Whisper: $1/month
- ElevenLabs: $15/month
- **Total: $36/month**

**After (Self-hosted)**:
- Electricity (RTX 5070 ~200W): ~$5/month
- **Total: $5/month**

**Savings: $31/month = $372/year!**

Plus: Unlimited usage, no rate limits, full privacy!

## Next Steps

1. ✅ Set up monitoring dashboard
2. ✅ Configure automated backups
3. ✅ Set up SSL/TLS if exposing API
4. ✅ Create custom skills for your workflows
5. ✅ Optimize performance based on usage

Your ARDEN is now running on a beast of a GPU! 🚀

---

**Questions?** Check logs with `pm2 logs arden-bot` or `nvidia-smi` for GPU status.
