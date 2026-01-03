# ARDEN Docker Deployment Guide

Production deployment guide for ARDEN with NVIDIA GPU support.

## Prerequisites

### 1. Install Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. Install NVIDIA Container Toolkit

**For Ubuntu/Debian:**
```bash
# Add NVIDIA package repository
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

# Install NVIDIA Container Toolkit
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit

# Configure Docker to use NVIDIA runtime
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

**Verify GPU access:**
```bash
docker run --rm --gpus all nvidia/cuda:12.2.0-base-ubuntu22.04 nvidia-smi
```

You should see your GPU(s) listed.

### 3. Install Docker Compose
```bash
# Install Docker Compose v2 (plugin)
sudo apt-get install docker-compose-plugin

# Verify
docker compose version
```

## Quick Start

### 1. Clone and Configure

```bash
# Clone repository
git clone https://github.com/infurno/ARDEN.git
cd ARDEN

# Copy and edit environment file
cp .env.production .env
nano .env  # Edit with your API keys
```

**Minimum required in `.env`:**
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
AI_PROVIDER=claude  # or ollama, openai, lmstudio
```

### 2. Build and Run

**Option A: ARDEN only (using Claude CLI or external AI)**
```bash
# Build the image
docker compose build

# Start the bot
docker compose up -d

# View logs
docker compose logs -f arden-bot
```

**Option B: ARDEN + Ollama (local LLM with GPU acceleration)**
```bash
# Build and start with Ollama
docker compose --profile ollama up -d

# Pull a model in Ollama
docker exec -it arden-ollama ollama pull llama3.2

# View logs
docker compose logs -f arden-bot
docker compose logs -f ollama
```

### 3. Verify Deployment

```bash
# Check container status
docker compose ps

# Check GPU is accessible
docker exec -it arden-bot nvidia-smi

# Check logs
docker compose logs -f arden-bot

# Check health
docker inspect arden-bot | grep -A 10 Health
```

## Configuration Options

### AI Provider Selection

Edit `.env` file:

**Claude (default - requires Claude CLI on host):**
```bash
AI_PROVIDER=claude
```

**Ollama (local LLM with GPU):**
```bash
AI_PROVIDER=ollama
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2
```

**OpenAI:**
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

**LM Studio (running on host):**
```bash
AI_PROVIDER=lmstudio
LMSTUDIO_URL=http://host.docker.internal:1234
```

### Voice Configuration

Edit `config/arden.json`:

**STT (Speech-to-Text):**
- `local-whisper` - Uses GPU-accelerated Whisper (recommended)
- `openai-whisper` - Uses OpenAI API (requires OPENAI_API_KEY)

**TTS (Text-to-Speech):**
- `elevenlabs` - High quality (requires ELEVENLABS_API_KEY)
- `edge-tts` - Free Microsoft voices
- `openai-tts` - OpenAI voices (requires OPENAI_API_KEY)
- `piper` - Local, self-hosted

## Managing the Deployment

### Start/Stop Services

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart specific service
docker compose restart arden-bot

# Stop and remove volumes (careful - deletes data!)
docker compose down -v
```

### View Logs

```bash
# Follow all logs
docker compose logs -f

# Follow specific service
docker compose logs -f arden-bot
docker compose logs -f ollama

# Last 100 lines
docker compose logs --tail=100 arden-bot
```

### Accessing Persistent Data

```bash
# List volumes
docker volume ls | grep arden

# Inspect volume location
docker volume inspect arden_arden-logs

# Backup history
docker run --rm -v arden_arden-history:/data -v $(pwd):/backup \
    alpine tar czf /backup/arden-history-backup.tar.gz -C /data .

# Restore history
docker run --rm -v arden_arden-history:/data -v $(pwd):/backup \
    alpine tar xzf /backup/arden-history-backup.tar.gz -C /data
```

### Update and Rebuild

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose build
docker compose up -d

# Or rebuild specific service
docker compose build arden-bot
docker compose up -d arden-bot
```

## Monitoring

### GPU Usage

```bash
# Monitor GPU in real-time
watch -n 1 docker exec arden-bot nvidia-smi

# Check GPU memory usage
docker exec arden-bot nvidia-smi --query-gpu=memory.used,memory.total --format=csv
```

### Container Stats

```bash
# Real-time stats
docker stats arden-bot

# Resource usage
docker compose top
```

### Health Checks

```bash
# Check health status
docker inspect arden-bot | grep -A 10 Health

# Manual health check
docker exec arden-bot node -e "console.log('healthy')"
```

## Troubleshooting

### GPU Not Detected

```bash
# Check NVIDIA runtime is configured
docker info | grep -i nvidia

# Test GPU access
docker run --rm --gpus all nvidia/cuda:12.2.0-base-ubuntu22.04 nvidia-smi

# Check container GPU access
docker exec arden-bot nvidia-smi
```

### Bot Not Starting

```bash
# Check logs
docker compose logs arden-bot

# Check environment variables
docker exec arden-bot env | grep -E "TELEGRAM|OPENAI|AI_PROVIDER"

# Verify configuration
docker exec arden-bot cat config/arden.json

# Test bot connectivity manually
docker exec -it arden-bot node api/telegram-bot.js
```

### Whisper Model Download Issues

```bash
# Check Whisper cache
docker exec arden-bot ls -la /root/.cache/whisper

# Download model manually
docker exec arden-bot venv/bin/whisper --model base --language en /tmp/test.ogg
```

### Permission Issues

```bash
# Fix volume permissions (if needed)
docker compose down
docker volume rm arden_arden-logs arden_arden-history
docker compose up -d
```

## Production Best Practices

### 1. Use Secrets for API Keys

Instead of `.env` file, use Docker secrets:

```bash
# Create secrets
echo "your_telegram_token" | docker secret create telegram_bot_token -
echo "your_openai_key" | docker secret create openai_api_key -

# Update docker-compose.yml to use secrets
```

### 2. Set Up Log Rotation

Already configured in `docker-compose.yml`:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 3. Enable Auto-Restart

Already configured: `restart: unless-stopped`

### 4. Regular Backups

```bash
# Add to crontab for daily backups
0 2 * * * cd /path/to/ARDEN && docker run --rm -v arden_arden-history:/data -v /backup:/backup alpine tar czf /backup/arden-$(date +\%Y\%m\%d).tar.gz -C /data .
```

### 5. Monitor Resource Usage

```bash
# Set up monitoring with Prometheus/Grafana or similar
# Or use simple cron alerts
docker stats --no-stream arden-bot | mail -s "ARDEN Stats" admin@example.com
```

## Advanced: Multi-GPU Setup

If you have multiple GPUs:

```yaml
# In docker-compose.yml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          device_ids: ['0', '1']  # Specify GPU IDs
          capabilities: [gpu]
```

## Support

For issues:
1. Check logs: `docker compose logs -f`
2. Verify GPU: `docker exec arden-bot nvidia-smi`
3. Test configuration: `docker exec arden-bot node api/telegram-bot.js`
4. Report issues: https://github.com/infurno/ARDEN/issues
