# 🆓 Free TTS Options for ARDEN

**Replace ElevenLabs ($11-15/month) with FREE alternatives!**

---

## Quick Comparison

| Option | Cost | Quality | Setup | Best For |
|--------|------|---------|-------|----------|
| **Edge TTS** ⭐ | $0 | 8/10 | 1 min | Easiest, cloud-based |
| **Piper** | $0 | 7/10 | 5 min | Offline, privacy |
| **OpenAI TTS** | ~$1/mo | 8/10 | 1 min | Best cheap option |

---

## 🏆 Recommended: Edge TTS (Microsoft)

### Why It's Great
- ✅ **100% FREE** - No API key, no limits
- ✅ **Good Quality** - Microsoft's Azure Neural voices  
- ✅ **Easy Setup** - One command
- ✅ **400+ Voices** - Many languages

### Quick Setup (1 minute)

```bash
# Install
pip install edge-tts

# Run setup script
cd ~/ARDEN
./scripts/setup-free-tts.sh
# Choose option 1 (Edge TTS)

# Restart your bot:
pm2 restart arden-bot
```

### Popular Voices

- `en-US-AriaNeural` - Female, professional (recommended)
- `en-US-GuyNeural` - Male, friendly
- `en-US-JennyNeural` - Female, assistant-like
- `en-GB-SoniaNeural` - Female, British

**Cost: $0/month forever** 🎉

---

## Option 2: Piper TTS (Self-Hosted)

### Why Choose Piper
- ✅ **100% FREE**
- ✅ **Works Offline** - No internet needed
- ✅ **Privacy** - All local processing
- ✅ **Fast** - Real-time or faster

### Quick Setup (5 minutes)

```bash
# Run setup script
cd ~/ARDEN
./scripts/setup-free-tts.sh
# Choose option 2 (Piper)
```

**Cost: $0/month + works offline** 🎉

---

## Option 3: OpenAI TTS

- ✅ **Very Cheap** - ~$1/month for typical use
- ✅ **Good Quality** - Better than free options
- ✅ **Same API Key** - Uses your OpenAI key

**Real cost: ~$0.50-1.50/month** 💰

---

## Easy Setup

```bash
cd ~/ARDEN
./scripts/setup-free-tts.sh
```

Choose your option (1, 2, or 3) and follow the prompts!

---

## Cost Savings

**Before:** $12-16/month (Whisper + ElevenLabs)  
**After:** $0.90/month (Whisper + Edge TTS)

**Savings: ~$132-180/year!** ✅

---

For detailed guide, see: `docs/voice-alternatives.md`
