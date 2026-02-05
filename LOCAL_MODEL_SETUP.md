# ARDEN Local Model Setup

Replace Claude Code with local AI models - completely free and unlimited!

## Quick Setup Options

### Option 1: Ollama (Recommended - Fastest)

**Install Ollama:**
```bash
brew install ollama
```

**Start Ollama:**
```bash
ollama serve &
```

**Pull a model:**
```bash
# Fast, good quality (4GB)
ollama pull llama3.2

# Or smaller, faster (2GB)
ollama pull phi3

# Or best quality (8GB)
ollama pull llama3.1:8b
```

**Update `.env`:**
```bash
# Add this to ~/ARDEN/.env
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
OLLAMA_URL=http://localhost:11434
```

---

### Option 2: LM Studio (GUI Option)

**Install:**
```bash
brew install --cask lm-studio
```

**Setup:**
1. Open LM Studio
2. Download a model (Llama 3.2 recommended)
3. Start local server (default: http://localhost:1234)

**Update `.env`:**
```bash
AI_PROVIDER=lmstudio
LMSTUDIO_URL=http://localhost:1234
```

---

### Option 3: Use OpenAI with Existing Key

If you already have OpenAI credits:

**Update `.env`:**
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini  # Cheap: $0.15/1M tokens
```

---

## Implementation

I'll create a new version of the bot that supports all these options.

The bot will:
1. Check which AI provider is configured
2. Use that provider instead of Claude Code
3. Work exactly the same way from your perspective

## Cost Comparison

| Provider | Cost | Speed | Quality |
|----------|------|-------|---------|
| **Ollama** | $0 | Fast | Very Good |
| **LM Studio** | $0 | Fast | Very Good |
| **OpenAI GPT-4o-mini** | ~$1-2/mo | Very Fast | Excellent |
| **Claude Code** | $20/mo | Fast | Excellent |

## Recommended Setup

**For unlimited free usage:**
```bash
# Install Ollama
brew install ollama

# Start it
ollama serve &

# Pull Llama 3.2 (great balance)
ollama pull llama3.2

# Add to .env
echo "AI_PROVIDER=ollama" >> ~/ARDEN/.env
echo "OLLAMA_MODEL=llama3.2" >> ~/ARDEN/.env
```

Then restart the bot and you're good to go!

## Model Recommendations

**Best Free Models via Ollama:**
- `llama3.2` (3B) - Fast, great for chat (recommended)
- `phi3` (3.8B) - Microsoft's model, very fast
- `llama3.1:8b` (8B) - Best quality, slower
- `qwen2.5:7b` (7B) - Excellent reasoning

**Command to test:**
```bash
ollama run llama3.2 "Hello, tell me about yourself"
```

---

## Next Step

Would you like me to:
1. **Install Ollama and update the bot** (recommended)
2. **Create the updated bot code** that supports local models
3. **Both** - Full setup for local AI

Let me know and I'll make it happen!
