# ARDEN TTS Options Guide

## Current Setup ✅

**You're currently using:** `edge-tts` (Microsoft TTS)
- **Works with any browser:** Chrome, Firefox, Brave, Safari, Edge
- **Server-side:** TTS happens on your server, not in the browser
- **Free:** No API costs
- **Quality:** Good, natural-sounding voices

---

## Available TTS Providers

ARDEN supports 4 different TTS providers. Here's a comparison:

### 1. Edge-TTS (Current - FREE) ✅

**Provider:** Microsoft Azure TTS (via edge-tts library)
**Cost:** FREE
**Quality:** Good (7/10)
**Latency:** ~1-2 seconds
**Installation:** Already installed ✅

**Pros:**
- No API key required
- No usage limits
- Natural-sounding voices
- Multiple languages
- Multiple voice options

**Cons:**
- Requires internet connection
- Slightly robotic compared to premium options

**Available Voices:**
```
Male:
- en-US-BrianNeural (current default)
- en-US-GuyNeural
- en-US-JasonNeural
- en-GB-RyanNeural

Female:
- en-US-AriaNeural
- en-US-JennyNeural
- en-US-SaraNeural
- en-GB-SoniaNeural
- en-AU-NatashaNeural
```

**To change voice:**
```bash
nano /home/hal/ARDEN/config/arden.json

# Change line 15:
"voice": "en-US-AriaNeural"  # Female
# or
"voice": "en-GB-RyanNeural"  # British male
```

---

### 2. OpenAI TTS (AFFORDABLE)

**Cost:** ~$0.015 per 1,000 characters (~$1-2/month for normal use)
**Quality:** Excellent (9/10)
**Latency:** ~1-2 seconds
**Installation:** Requires OpenAI API key

**Pros:**
- Very natural-sounding
- Low latency
- Multiple voices (Alloy, Echo, Fable, Onyx, Nova, Shimmer)
- Good pronunciation

**Cons:**
- Requires API key
- Small cost per usage
- Requires internet

**Setup:**
```bash
# 1. Get API key from https://platform.openai.com/api-keys

# 2. Add to .env
echo "OPENAI_API_KEY=sk-your-key-here" >> /home/hal/ARDEN/.env

# 3. Update config
nano /home/hal/ARDEN/config/arden.json

# Change:
"tts_provider": "openai-tts",
"tts_config": {
  "voice": "nova",        # Options: alloy, echo, fable, onyx, nova, shimmer
  "model": "tts-1"        # Or "tts-1-hd" for higher quality
}
```

**Available Voices:**
- `alloy` - Neutral
- `echo` - Male
- `fable` - British male
- `onyx` - Deep male
- `nova` - Female (warm)
- `shimmer` - Female (bright)

---

### 3. Piper (SELF-HOSTED - FREE)

**Cost:** FREE (fully offline)
**Quality:** Good (6/10)
**Latency:** ~0.5-1 second (fastest)
**Installation:** Requires setup

**Pros:**
- 100% offline (no internet needed)
- No API keys
- Fast (runs on your GPU)
- Privacy-focused
- No usage limits

**Cons:**
- More robotic than cloud options
- Requires model downloads
- Setup required

**Setup:**
```bash
# 1. Install Piper
yay -S piper-tts

# Or build from source
git clone https://github.com/rhasspy/piper
cd piper
# Follow build instructions

# 2. Download voice model
mkdir -p ~/.local/share/piper/models
cd ~/.local/share/piper/models

# Download model (example: US English - Amy)
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json

# 3. Update config
nano /home/hal/ARDEN/config/arden.json

# Change:
"tts_provider": "piper",
"tts_config": {
  "model": "en_US-amy-medium"
}
```

**Available Models:**
- `en_US-amy-medium` - Female
- `en_US-lessac-medium` - Male
- `en_GB-alan-medium` - British male
- `en_GB-alba-medium` - British female

Full list: https://github.com/rhasspy/piper/blob/master/VOICES.md

---

### 4. ElevenLabs (PREMIUM)

**Cost:** $5-$22/month (subscription)
**Quality:** Excellent (10/10)
**Latency:** ~2-3 seconds
**Installation:** Requires API key

**Pros:**
- Best quality available
- Ultra-realistic voices
- Voice cloning available
- Emotion and style control
- Professional-grade

**Cons:**
- Monthly subscription
- More expensive
- Higher latency
- Requires internet

**Setup:**
```bash
# 1. Sign up at https://elevenlabs.io
# 2. Get API key from settings

# 3. Add to .env
echo "ELEVENLABS_API_KEY=your-key-here" >> /home/hal/ARDEN/.env

# 4. Update config
nano /home/hal/ARDEN/config/arden.json

# Change:
"tts_provider": "elevenlabs",
"tts_config": {
  "voice_id": "21m00Tcm4TlvDq8ikWAM",  # Rachel (default)
  "model": "eleven_monolingual_v1",
  "stability": 0.5,
  "similarity_boost": 0.75
}
```

---

## Recommendation

**For your use case (self-hosted, privacy-focused):**

### Best Option: Edge-TTS (current) ✅
- Free
- Good quality
- No setup needed
- Works with any browser

### Alternative: Piper (for offline)
- If you want 100% offline
- Faster response times
- More privacy
- Requires initial setup

### Premium Option: OpenAI TTS
- If you want best quality at low cost
- Already have OpenAI API key
- ~$1-2/month usage

---

## Changing TTS Provider

### Method 1: Edit Config File

```bash
nano /home/hal/ARDEN/config/arden.json

# Find the "voice" section (around line 6):
"voice": {
  "enabled": true,
  "stt_provider": "local-whisper",
  "stt_config": {
    "model": "base",
    "language": "en"
  },
  "tts_provider": "edge-tts",    # ← Change this
  "tts_config": {
    "voice": "en-US-BrianNeural"  # ← And this
  },
  ...
}

# Save and restart web server
./scripts/stop-web.sh && ./scripts/start-web.sh
```

### Method 2: Quick Test Different Providers

```bash
cd /home/hal/ARDEN

# Test Edge-TTS (current)
edge-tts --voice "en-US-AriaNeural" --text "Hello, this is ARDEN speaking" --write-media test-edge.mp3
mpv test-edge.mp3

# Test OpenAI TTS (requires API key)
curl https://api.openai.com/v1/audio/speech \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "Hello, this is ARDEN speaking",
    "voice": "nova"
  }' \
  --output test-openai.mp3
mpv test-openai.mp3
```

---

## Browser Requirements

**All TTS options work with:**
- ✅ Chrome
- ✅ Firefox
- ✅ Brave
- ✅ Edge
- ✅ Safari
- ✅ Any modern browser that supports HTML5 audio

**Why?** Because TTS happens on the **server**, not in the browser. The browser just plays the audio file.

---

## Voice Comparison

Listen to samples and decide which you prefer:

### Edge-TTS Voices

```bash
# Male voices
edge-tts --voice "en-US-BrianNeural" --text "Hello, I'm Brian" --write-media brian.mp3
edge-tts --voice "en-US-GuyNeural" --text "Hello, I'm Guy" --write-media guy.mp3

# Female voices
edge-tts --voice "en-US-AriaNeural" --text "Hello, I'm Aria" --write-media aria.mp3
edge-tts --voice "en-US-JennyNeural" --text "Hello, I'm Jenny" --write-media jenny.mp3

# British
edge-tts --voice "en-GB-RyanNeural" --text "Hello, I'm Ryan from the UK" --write-media ryan.mp3

# Play them
mpv brian.mp3
mpv aria.mp3
mpv ryan.mp3
```

---

## My Recommendation

**Stick with Edge-TTS** for now because:

1. ✅ Already working
2. ✅ Free forever
3. ✅ Good quality
4. ✅ Works with any browser
5. ✅ No API keys needed
6. ✅ Multiple voice options

**Only switch if:**
- You need **offline**: Use Piper
- You want **best quality**: Use OpenAI TTS ($1-2/month)
- You're a professional: Use ElevenLabs ($5+/month)

---

## FAQ

**Q: Does Edge-TTS require Microsoft Edge browser?**
A: No! It works with any browser. The name is confusing - it's a Python library that uses Microsoft's TTS API.

**Q: Can I use multiple TTS providers?**
A: You can only use one at a time, but you can switch easily by editing the config.

**Q: Which is fastest?**
A: Piper (offline) > Edge-TTS ≈ OpenAI > ElevenLabs

**Q: Which sounds best?**
A: ElevenLabs > OpenAI > Edge-TTS > Piper

**Q: Which is most private?**
A: Piper (offline) > Edge-TTS ≈ OpenAI ≈ ElevenLabs (all cloud)

**Q: Can I clone my own voice?**
A: Only with ElevenLabs (premium plan)

**Q: Do I need internet for TTS?**
A: Edge-TTS, OpenAI, ElevenLabs: Yes. Piper: No (fully offline)

---

## Next Steps

1. **Try different Edge-TTS voices** (free, easy)
2. **Install Piper** if you want offline TTS
3. **Try OpenAI TTS** if you already have an API key
4. **Keep current setup** if you're happy with it

---

**Current Status:** ✅ Using Edge-TTS with en-US-BrianNeural voice
**Browser:** Works with Chrome, Firefox, Brave, Safari, Edge (any modern browser)
**Cost:** $0

To change voice or provider, edit `/home/hal/ARDEN/config/arden.json` and restart web server.
