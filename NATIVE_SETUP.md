# ARDEN Native Setup Guide

This guide covers running ARDEN natively on your system without Docker.

## Prerequisites

### System Requirements
- **OS**: Linux (tested on Arch Linux), macOS, or WSL2
- **Node.js**: v18.0.0 or higher (tested with v25.2.1)
- **Python**: 3.10 or higher (tested with 3.13.11)
- **FFmpeg**: For audio processing
- **GPU** (optional): NVIDIA GPU with CUDA for GPU-accelerated Whisper STT

### Check Your Setup

```bash
# Check Node.js version
node --version  # Should be v18.0.0+

# Check Python version
python3 --version  # Should be 3.10+

# Check FFmpeg
ffmpeg -version

# Check NVIDIA GPU (optional)
nvidia-smi
```

## Installation

### 1. Clone the Repository

```bash
cd ~
git clone <your-repo-url> ARDEN
cd ARDEN
```

### 2. Install Node.js Dependencies

```bash
cd ~/ARDEN/api
npm install
```

### 3. Set Up Python Virtual Environment

```bash
cd ~/ARDEN

# Create virtual environment (if not exists)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install openai-whisper torch torchaudio edge-tts

# For GPU support (NVIDIA CUDA)
pip install --upgrade torch torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### 4. Configure Environment

```bash
cd ~/ARDEN

# Copy example environment file
cp .env.production .env

# Edit configuration
nano .env
```

**Required environment variables:**

```bash
# Telegram Bot Token (required)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# AI Provider (choose one)
AI_PROVIDER=ollama  # or 'openai' or 'claude'

# For OpenAI (if using openai provider or openai-whisper STT)
OPENAI_API_KEY=your_openai_key_here

# For Claude (if using claude provider)
ANTHROPIC_API_KEY=your_anthropic_key_here

# For Ollama (if using ollama provider)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Optional: ElevenLabs for TTS
ELEVENLABS_API_KEY=your_elevenlabs_key_here
```

### 5. Configure ARDEN

Edit `config/arden.json` to customize voice and API settings:

```json
{
  "voice": {
    "enabled": true,
    "stt_provider": "local-whisper",
    "tts_provider": "edge-tts",
    "language": "en"
  },
  "telegram": {
    "enabled": true,
    "allowed_users": []
  },
  "api": {
    "port": 3000
  }
}
```

**STT Providers:**
- `local-whisper`: GPU-accelerated Whisper (requires GPU, fastest)
- `openai-whisper`: OpenAI API (requires OPENAI_API_KEY)

**TTS Providers:**
- `edge-tts`: Microsoft Edge TTS (free, good quality)
- `elevenlabs`: ElevenLabs (requires API key, best quality)
- `openai-tts`: OpenAI TTS (requires API key)
- `none`: No TTS

## Running ARDEN

### Using Management Scripts (Recommended)

```bash
# Start ARDEN in background
./scripts/start.sh

# Check status
./scripts/status.sh

# View logs
tail -f api/logs/arden.log

# Restart ARDEN
./scripts/restart.sh

# Stop ARDEN
./scripts/stop.sh
```

### Manual Start (Development)

```bash
# Activate Python virtual environment
source venv/bin/activate

# Run bot directly
cd api
node telegram-bot.js
```

## Telegram Bot Setup

### 1. Create Your Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the prompts
3. Copy your bot token
4. Add the token to your `.env` file as `TELEGRAM_BOT_TOKEN`

### 2. Find Your User ID (Optional - for access control)

1. Search for [@userinfobot](https://t.me/userinfobot) on Telegram
2. Send any message to get your user ID
3. Add your user ID to `config/arden.json` under `telegram.allowed_users`:

```json
{
  "telegram": {
    "enabled": true,
    "allowed_users": [123456789]
  }
}
```

If `allowed_users` is empty, all users can access the bot.

### 3. Start Chatting

1. Search for your bot on Telegram (use the username you created)
2. Send `/start`
3. Send a voice message or text message
4. ARDEN will respond!

## Setting Up Ollama (Optional)

For local LLM without API costs:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.2

# Start Ollama (it runs as a service by default)
systemctl status ollama

# Configure ARDEN to use Ollama
# In .env:
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

## Troubleshooting

### Bot Won't Start

```bash
# Check logs
tail -50 api/logs/arden.log
tail -50 api/logs/exceptions.log

# Check if port is already in use
lsof -i :3000

# Verify environment variables
source venv/bin/activate
cd api
node -e "require('dotenv').config({path:'../.env'}); console.log(process.env.TELEGRAM_BOT_TOKEN ? 'Token set' : 'Token missing')"
```

### Voice Messages Not Working

```bash
# Check Python dependencies
source venv/bin/activate
python3 -c "import whisper; print('Whisper OK')"
python3 -c "import torch; print('PyTorch OK')"

# Check GPU (if using local-whisper)
nvidia-smi

# Test STT manually
cd ~/ARDEN
source venv/bin/activate
python3 -c "
import whisper
model = whisper.load_model('base')
print('Whisper model loaded successfully')
"
```

### Ollama Connection Issues

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama
systemctl restart ollama

# Check logs
journalctl -u ollama -f
```

### Permission Issues

```bash
# Fix script permissions
chmod +x scripts/*.sh

# Fix log directory permissions
chmod 755 api/logs
```

## Logs

ARDEN creates several log files in `api/logs/`:

- `arden.log`: Main application log (stdout/stderr)
- `combined.log`: All log levels
- `error.log`: Errors only
- `exceptions.log`: Uncaught exceptions
- `rejections.log`: Unhandled promise rejections

## Performance Tips

### GPU Acceleration

For faster Whisper transcription:

1. Install NVIDIA drivers and CUDA toolkit
2. Install PyTorch with CUDA support:
   ```bash
   pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121
   ```
3. Set `stt_provider` to `local-whisper` in config
4. Test GPU:
   ```bash
   python3 -c "import torch; print(torch.cuda.is_available())"
   ```

### Memory Usage

- Base Whisper model: ~1GB RAM
- Small Whisper model: ~2GB RAM
- Medium Whisper model: ~5GB RAM
- Large Whisper model: ~10GB RAM

Edit the model size in `api/services/whisper-local.js` if needed.

## Systemd Service (Optional)

To run ARDEN as a system service:

```bash
# Create service file
sudo nano /etc/systemd/system/arden.service
```

```ini
[Unit]
Description=ARDEN Telegram Bot
After=network.target

[Service]
Type=simple
User=hal
WorkingDirectory=/home/hal/ARDEN
ExecStart=/home/hal/ARDEN/scripts/start.sh
ExecStop=/home/hal/ARDEN/scripts/stop.sh
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable arden
sudo systemctl start arden

# Check status
sudo systemctl status arden

# View logs
journalctl -u arden -f
```

## Next Steps

- Read [GET_STARTED.md](GET_STARTED.md) for ARDEN features
- Explore the [skills/](skills/) directory for domain expertise modules
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for Docker deployment options
- See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for architecture overview
