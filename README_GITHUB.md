# 🤖 ARDEN - AI Routine Daily Engagement Nexus

**Your personal AI assistant, accessible everywhere via voice.**

Voice-enabled AI infrastructure built with local models, Telegram integration, and zero-cost operation.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Features

- 🎤 **Voice Interface** - Talk to your AI via Telegram from any device
- 🆓 **100% Free** - Run entirely on local models (Ollama + Whisper + Edge TTS)
- 🔒 **Privacy-First** - Your data stays on your hardware
- 🚀 **Fast** - Optimized for NVIDIA GPU acceleration
- 🛠️ **Extensible** - Easy-to-create skill system
- 🌍 **Multi-Platform** - Works on Mac, Linux, or server

---

## 🎯 What Can It Do?

### Current Skills

1. **📝 Note-Taking**
   - "Take a note: Remember to call John"
   - Auto-saves to markdown in your notes directory
   - Voice-optimized capture

2. **☁️ Weather**
   - "What's the weather?"
   - Real-time conditions and forecasts
   - Smart recommendations (jacket, umbrella, etc.)

3. **📅 Daily Planning** (Coming Soon)
   - Morning briefings
   - Task management
   - Schedule optimization

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│           Your Device (Phone/Tablet/PC)              │
│                  Telegram App                        │
└────────────────────┬────────────────────────────────┘
                     │ Voice/Text
                     ↓
┌─────────────────────────────────────────────────────┐
│              ARDEN Server (Your Hardware)            │
├─────────────────────────────────────────────────────┤
│  Telegram Bot  →  Whisper STT  →  AI (Ollama)       │
│       ↓              ↓               ↓               │
│  Edge TTS  ←  Response Format  ←  Skills System     │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Operating System**: macOS or Linux (tested on both)
- **Hardware**: 
  - Mac: M1/M2 or Intel with 8GB+ RAM
  - Linux: CPU or NVIDIA GPU (recommended)
- **Software**:
  - Node.js 18+
  - Python 3.8+
  - Homebrew (Mac) or apt/yum (Linux)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ARDEN.git
cd ARDEN

# Run the installation script
./scripts/install.sh

# Set up local AI
./scripts/setup-local-ai.sh
```

### Configuration

1. **Create `.env` file:**
```bash
cp .env.example .env
```

2. **Add your Telegram bot token:**
```bash
# Get token from @BotFather on Telegram
echo "TELEGRAM_BOT_TOKEN=your-token-here" >> .env
```

3. **Configure AI provider** (`.env`):
```bash
# For local (free, unlimited)
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2

# Or for cloud (fast, cheap)
AI_PROVIDER=openai
OPENAI_API_KEY=your-key-here
```

### Start the Bot

```bash
cd api
npm install
npm start
```

That's it! Send a message to your Telegram bot.

---

## 💰 Cost Comparison

| Setup | Cost/Month | Speed | Quality |
|-------|------------|-------|---------|
| **Local (Ollama + Whisper + Edge TTS)** | $0 | Fast | Very Good |
| **OpenAI + Whisper** | ~$1-2 | Very Fast | Excellent |
| **Claude + ElevenLabs** | ~$20-25 | Fast | Best |

**Recommended**: Start with local (free), upgrade if needed.

---

## 🖥️ GPU Acceleration (Linux + NVIDIA)

For maximum performance on Linux with NVIDIA GPU:

### Install CUDA Toolkit
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nvidia-cuda-toolkit

# Verify
nvidia-smi
```

### Install Ollama with GPU Support
```bash
curl -fsSL https://ollama.com/install.sh | sh

# Ollama automatically detects NVIDIA GPU
ollama pull llama3.2
```

### GPU-Accelerated Whisper
```bash
# Install CUDA-enabled Whisper
pip install openai-whisper[cuda]

# Or use faster-whisper
pip install faster-whisper
```

**Performance Boost**:
- CPU: 5-10 seconds per voice message
- GPU (RTX 5070): 0.5-2 seconds per voice message ⚡

---

## 📂 Project Structure

```
~/ARDEN/
├── api/                    # Telegram bot server
│   ├── telegram-bot.js    # Main bot logic
│   └── package.json       # Node dependencies
├── skills/                # Extensible skill system
│   ├── note-taking/       # Voice note capture
│   ├── weather/           # Weather information
│   └── daily-planning/    # Task management
├── config/                # Configuration files
│   ├── arden.json        # Main config
│   └── hooks/            # Session hooks
├── history/              # Session logs & learning
├── voice/                # Voice file storage
├── scripts/              # Installation & setup
└── .env                  # Your secrets (not in git)
```

---

## 🎓 Creating Custom Skills

Skills are easy to create! Each skill is a directory with:

```
skills/my-skill/
├── SKILL.md              # When/how to invoke
├── tools/                # Executable scripts
│   └── do-something.sh
├── workflows/            # Step-by-step procedures
└── context/             # Knowledge & preferences
```

**Example: Email Skill**

```bash
mkdir -p skills/email/tools
cat > skills/email/tools/send-email.sh << 'EOF'
#!/bin/bash
# Send email via CLI
echo "Email sent to $1"
EOF
chmod +x skills/email/tools/send-email.sh
```

See `skills/weather/` for a complete example.

---

## 🔧 Configuration Options

### AI Providers

**Ollama (Local)**
```bash
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2  # or phi3, llama3.1:8b
OLLAMA_URL=http://localhost:11434
```

**OpenAI**
```bash
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-...
```

**LM Studio (Local GUI)**
```bash
AI_PROVIDER=lmstudio
LMSTUDIO_URL=http://localhost:1234
```

### Voice Providers

**Speech-to-Text**
- `local-whisper` - Free, runs locally
- `openai-whisper` - Fast, $0.006/min

**Text-to-Speech**
- `edge-tts` - Free (Microsoft)
- `openai-tts` - $15/1M chars
- `elevenlabs` - Premium quality

---

## 📱 Usage Examples

### Via Telegram

**Note-Taking:**
> 🎤 "Take a note: Follow up with Sarah about the project proposal"
> 
> ✅ "Note saved as 2026-01-03-follow-up-with-sarah.md"

**Weather:**
> 🎤 "What's the weather in Miami?"
> 
> 🌤️ "In Miami, it's 78 degrees and sunny. Beautiful beach weather!"

**General Questions:**
> 🎤 "What's the capital of France?"
> 
> 💬 "The capital of France is Paris."

---

## 🐧 Deploying to Linux Server

### Transfer Repository
```bash
# On your Mac
git push origin main

# On your Linux server
git clone https://github.com/YOUR_USERNAME/ARDEN.git
cd ARDEN
```

### Install Dependencies
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python & dependencies
sudo apt install python3 python3-pip python3-venv
python3 -m venv venv
source venv/bin/activate
pip install openai-whisper edge-tts
```

### Configure for GPU
```bash
# Pull model (automatically uses GPU if available)
ollama pull llama3.2

# Verify GPU usage
nvidia-smi  # Should show ollama using GPU
```

### Run as Service (24/7)
```bash
# Install PM2
npm install -g pm2

# Start bot
cd ~/ARDEN/api
pm2 start telegram-bot.js --name arden

# Auto-start on boot
pm2 startup
pm2 save
```

---

## 🔒 Security

**Built-in Security:**
- ✅ API keys in environment variables (never in git)
- ✅ Telegram user ID restrictions
- ✅ Rate limiting
- ✅ Command validation
- ✅ Audit logging

**Best Practices:**
1. Never commit `.env` file
2. Restrict Telegram bot to authorized users
3. Run on private network or VPN
4. Keep dependencies updated

---

## 🤝 Contributing

Contributions welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-skill`)
3. Commit your changes (`git commit -m 'Add amazing skill'`)
4. Push to branch (`git push origin feature/amazing-skill`)
5. Open a Pull Request

**Ideas for Contributions:**
- New skills (email, calendar, smart home, etc.)
- Better error handling
- Voice optimization
- Multi-language support
- Documentation improvements

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Ollama** - Local LLM runtime
- **OpenAI Whisper** - Speech recognition
- **Edge TTS** - Text-to-speech
- **Telegram** - Bot platform
- **wttr.in** - Weather API

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/ARDEN/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/ARDEN/discussions)

---

## 🗺️ Roadmap

- [ ] Calendar integration
- [ ] Email management
- [ ] Smart home control
- [ ] Multi-user support
- [ ] Web dashboard
- [ ] Mobile app
- [ ] Voice wake word detection
- [ ] Context-aware proactive notifications

---

**Built with ❤️ for personal AI infrastructure**

**Star ⭐ this repo if you find it useful!**
