# 🚀 ARDEN - Now with Local AI!

Your ARDEN bot has been updated to support **unlimited, free AI** using local models!

## What Changed

The Telegram bot now supports multiple AI providers:
- ✅ **Ollama** (Local, Free, Unlimited)
- ✅ **LM Studio** (Local, Free, GUI)
- ✅ **OpenAI** (Cloud, Paid, Fast)
- ✅ **Claude Code** (Cloud, Paid, Best)

## Quick Start - Ollama (Recommended)

### 1. Run the Setup Script

```bash
cd ~/ARDEN
./scripts/setup-local-ai.sh
```

This will:
- Install Ollama via Homebrew
- Download a recommended AI model (llama3.2)
- Update your `.env` configuration
- Test everything

### 2. Start Your Bot

```bash
cd ~/ARDEN/api
npm start
```

### 3. Test It!

Send a message to your Telegram bot. It now uses Ollama instead of Claude!

---

## Manual Setup (If You Prefer)

### Option 1: Ollama

```bash
# Install
brew install ollama

# Start service
brew services start ollama

# Download a model
ollama pull llama3.2

# Add to .env
echo "AI_PROVIDER=ollama" >> ~/.env
echo "OLLAMA_MODEL=llama3.2" >> ~/.env
```

### Option 2: LM Studio

```bash
# Install
brew install --cask lm-studio

# Then:
# 1. Open LM Studio
# 2. Download a model (Llama 3.2 recommended)
# 3. Click "Start Server" (default port 1234)

# Add to .env
echo "AI_PROVIDER=lmstudio" >> ~/.env
echo "LMSTUDIO_URL=http://localhost:1234" >> ~/.env
```

### Option 3: OpenAI (Cheap, Fast)

```bash
# Add to .env
echo "AI_PROVIDER=openai" >> ~/.env
echo "OPENAI_MODEL=gpt-4o-mini" >> ~/.env
# OPENAI_API_KEY should already be set
```

---

## Model Recommendations

### For Speed (2-4 seconds response)
- `llama3.2` (2GB) - Best balance ⭐
- `phi3` (2.3GB) - Very fast

### For Quality (4-8 seconds response)
- `llama3.1:8b` (4.7GB) - Excellent reasoning
- `qwen2.5:7b` (4.4GB) - Great for technical tasks

### For Low Memory
- `gemma2:2b` (1.6GB) - Minimal resources
- `tinyllama` (600MB) - Very fast, basic

To change models:
```bash
# Download new model
ollama pull llama3.1:8b

# Update .env
# Change OLLAMA_MODEL=llama3.1:8b

# Restart bot
```

---

## Testing Ollama Directly

```bash
# Interactive chat
ollama run llama3.2

# Single question
ollama run llama3.2 "What is ARDEN?"

# List downloaded models
ollama list

# Remove a model
ollama rm phi3
```

---

## Your Complete Setup

After running the setup, you'll have:

**Voice Processing:**
- 🎤 Speech-to-Text: Local Whisper (Free)
- 🔊 Text-to-Speech: Edge TTS (Free)

**AI Brain:**
- 🤖 AI: Ollama with Llama 3.2 (Free, Unlimited!)

**Interface:**
- 📱 Telegram Bot (Free)

**Total Cost: $0/month** 💰

---

## Performance Comparison

| Provider | Response Time | Quality | Cost/Month |
|----------|---------------|---------|------------|
| Ollama (llama3.2) | 3-5 sec | Very Good | $0 |
| Ollama (llama3.1:8b) | 6-10 sec | Excellent | $0 |
| OpenAI (gpt-4o-mini) | 1-2 sec | Excellent | ~$1-2 |
| Claude Code | 2-4 sec | Best | $20 |

---

## Troubleshooting

### "Ollama error: connect ECONNREFUSED"

Ollama isn't running:
```bash
brew services start ollama
# Wait 5 seconds
curl http://localhost:11434
```

### "Model not found"

Download the model:
```bash
ollama pull llama3.2
```

### Response too slow

Try a smaller/faster model:
```bash
ollama pull phi3
# Update OLLAMA_MODEL=phi3 in .env
```

### Want better quality

Try a larger model:
```bash
ollama pull llama3.1:8b
# Update OLLAMA_MODEL=llama3.1:8b in .env
```

---

## Switching Between Providers

Just change `AI_PROVIDER` in `.env`:

```bash
# Use Ollama (local, free)
AI_PROVIDER=ollama

# Use OpenAI (cloud, cheap)
AI_PROVIDER=openai

# Use Claude Code (when limit resets)
AI_PROVIDER=claude

# Use LM Studio (local, GUI)
AI_PROVIDER=lmstudio
```

Then restart the bot:
```bash
cd ~/ARDEN/api
npm start
```

---

## Next Steps

1. **Run the setup:**
   ```bash
   ~/ARDEN/scripts/setup-local-ai.sh
   ```

2. **Start the bot:**
   ```bash
   cd ~/ARDEN/api
   npm start
   ```

3. **Test with voice:**
   - Send voice message to your Telegram bot
   - "Hey, what can you help me with?"

4. **Test note-taking:**
   - "Take a note: Test ARDEN with local AI"
   - Check `~/Notes/` for the file!

---

## Resources

- **Ollama Models:** https://ollama.com/library
- **LM Studio:** https://lmstudio.ai
- **Model Comparison:** https://ollama.com/library?sort=popular

---

**You now have unlimited AI for ARDEN! 🎉**

No more rate limits. No more waiting until 5pm. Just pure, local AI power!
