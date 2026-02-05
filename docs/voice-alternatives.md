# Free & Self-Hosted Voice Alternatives

Complete guide to free and self-hosted TTS alternatives to ElevenLabs.

## Quick Comparison

| Provider | Cost | Quality | Speed | Setup | Best For |
|----------|------|---------|-------|-------|----------|
| **Piper** | Free | Good | Fast | Easy | Self-hosted, offline |
| **Coqui TTS** | Free | Excellent | Medium | Medium | Self-hosted, customizable |
| **OpenAI TTS** | $15/1M chars | Very Good | Fast | Easy | API, affordable |
| **Edge TTS** | Free | Good | Fast | Easy | Microsoft's free API |
| **Festival** | Free | Basic | Fast | Easy | Simple self-hosted |
| **eSpeak** | Free | Robotic | Very Fast | Very Easy | Lightweight |
| **Bark** | Free | Excellent | Slow | Hard | Most natural, self-hosted |

---

## 🏆 Recommended: Piper TTS (Self-Hosted)

**Best balance of quality, speed, and ease of use**

### Why Piper?
- ✅ **FREE** - No API costs, runs locally
- ✅ **High Quality** - Near ElevenLabs quality
- ✅ **Fast** - Real-time or faster
- ✅ **Easy Setup** - Simple installation
- ✅ **Privacy** - All local, no cloud
- ✅ **50+ Voices** - Multiple languages
- ✅ **Low Resources** - Runs on Mac, Linux, Windows

### Installation

#### Option 1: Homebrew (Mac)
```bash
brew install piper-tts
```

#### Option 2: Python
```bash
pip install piper-tts
```

#### Option 3: Docker
```bash
docker pull rhasspy/piper
```

### Download a Voice Model

```bash
# Create models directory
mkdir -p ~/.local/share/piper/models

# Download a high-quality English voice
cd ~/.local/share/piper/models

# Amy (US English, female, medium quality)
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json

# Or Ryan (US English, male)
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/high/en_US-ryan-high.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/high/en_US-ryan-high.onnx.json
```

### Test It

```bash
echo "Hello from Piper TTS" | piper \
  --model ~/.local/share/piper/models/en_US-amy-medium.onnx \
  --output_file output.wav

# Play it
afplay output.wav  # Mac
# aplay output.wav  # Linux
```

### ARDEN Integration

I'll create a Piper adapter for ARDEN:

```javascript
// api/tts-piper.js
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

async function piperTTS(text, outputPath) {
  const modelPath = path.join(
    process.env.HOME,
    '.local/share/piper/models/en_US-amy-medium.onnx'
  );

  return new Promise((resolve, reject) => {
    const command = `echo "${text.replace(/"/g, '\\"')}" | piper --model "${modelPath}" --output_file "${outputPath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(outputPath);
    });
  });
}

module.exports = { piperTTS };
```

### Available Voices

Browse all voices: https://rhasspy.github.io/piper-samples/

**Popular English Voices:**
- `en_US-amy-medium` - Female, clear
- `en_US-ryan-high` - Male, natural
- `en_US-lessac-high` - Female, professional
- `en_GB-alan-medium` - Male, British
- `en_GB-alba-medium` - Female, British

**Other Languages:**
- Spanish: `es_ES-mls_10246-low`
- French: `fr_FR-mls_1840-low`
- German: `de_DE-thorsten-high`
- Italian: `it_IT-riccardo-x_low`
- And 20+ more languages!

### Performance

- **Speed:** ~3-5x faster than real-time
- **Memory:** ~100-200MB per voice model
- **CPU:** Low (works on Raspberry Pi)
- **Quality:** 7-8/10 (vs ElevenLabs 9/10)

---

## Alternative 1: Coqui TTS (Advanced Self-Hosted)

**Best for highest quality self-hosted TTS**

### Why Coqui?
- ✅ **FREE & Open Source**
- ✅ **Excellent Quality** - Closest to ElevenLabs
- ✅ **Voice Cloning** - Clone any voice
- ✅ **Many Models** - VITS, Tacotron, etc.
- ❌ **Slower** - 1-2x real-time
- ❌ **More Complex** - Requires GPU for best results

### Installation

```bash
# Install Coqui TTS
pip install TTS

# List available models
tts --list_models

# Use a model
tts --model_name tts_models/en/ljspeech/tacotron2-DDC \
    --text "Hello from Coqui TTS" \
    --out_path output.wav
```

### Best Models

```bash
# VITS (fastest, good quality)
tts_models/en/ljspeech/vits

# Tacotron2 (slower, better quality)
tts_models/en/ljspeech/tacotron2-DDC

# Multi-speaker (choose voice)
tts_models/en/vctk/vits
```

### Voice Cloning

```bash
# Clone a voice from a 5-second sample
tts --model_name tts_models/multilingual/multi-dataset/your_tts \
    --speaker_wav /path/to/voice_sample.wav \
    --text "This is voice cloning" \
    --out_path output.wav
```

---

## Alternative 2: Edge TTS (Free Cloud API)

**Microsoft's free TTS - no API key required!**

### Why Edge TTS?
- ✅ **100% FREE** - No API key, no limits
- ✅ **High Quality** - Microsoft's Azure voices
- ✅ **Fast** - Cloud-based
- ✅ **Simple** - One command
- ✅ **Many Voices** - 400+ voices, 100+ languages
- ⚠️ **Cloud-based** - Requires internet

### Installation

```bash
pip install edge-tts
```

### Usage

```bash
# List available voices
edge-tts --list-voices

# Generate speech
edge-tts --voice "en-US-JennyNeural" \
         --text "Hello from Edge TTS" \
         --write-media output.mp3

# Or pipe from stdin
echo "Hello world" | edge-tts --voice "en-US-AriaNeural" > output.mp3
```

### Best Voices

**US English:**
- `en-US-AriaNeural` - Female, professional
- `en-US-GuyNeural` - Male, friendly
- `en-US-JennyNeural` - Female, assistant-like
- `en-US-TonyNeural` - Male, news anchor

**British English:**
- `en-GB-SoniaNeural` - Female
- `en-GB-RyanNeural` - Male

**Search voices:**
```bash
edge-tts --list-voices | grep "en-US"
```

### Python API

```python
import edge_tts
import asyncio

async def text_to_speech(text, voice="en-US-AriaNeural"):
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save("output.mp3")

asyncio.run(text_to_speech("Hello from Edge TTS"))
```

### ARDEN Integration

```javascript
// api/tts-edge.js
const { exec } = require('child_process');

async function edgeTTS(text, outputPath, voice = "en-US-AriaNeural") {
  return new Promise((resolve, reject) => {
    const command = `edge-tts --voice "${voice}" --text "${text.replace(/"/g, '\\"')}" --write-media "${outputPath}"`;

    exec(command, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(outputPath);
    });
  });
}

module.exports = { edgeTTS };
```

---

## Alternative 3: OpenAI TTS (Affordable Cloud)

**Best affordable cloud option**

### Why OpenAI TTS?
- ✅ **Affordable** - $15 per 1M characters (~$1/month typical usage)
- ✅ **Good Quality** - Better than free options
- ✅ **Fast** - Cloud API
- ✅ **Simple** - Same API key as Whisper
- ❌ **Not Free** - But very cheap

### Usage

```bash
curl https://api.openai.com/v1/audio/speech \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "Hello from OpenAI TTS",
    "voice": "nova"
  }' \
  --output speech.mp3
```

### Available Voices

- `alloy` - Neutral
- `echo` - Male
- `fable` - Male, British
- `onyx` - Male, deep
- `nova` - Female (most popular)
- `shimmer` - Female, warm

### Speed vs Quality

- `tts-1` - Faster, cheaper
- `tts-1-hd` - Higher quality, slightly slower

---

## Alternative 4: Bark (Best Natural Speech)

**Most natural-sounding, includes emotions**

### Why Bark?
- ✅ **Most Natural** - Includes laughter, pauses, emotions
- ✅ **FREE & Open Source**
- ✅ **Multi-lingual**
- ❌ **VERY SLOW** - 10-30x slower than real-time
- ❌ **Requires GPU** - Or very patient

### Installation

```bash
pip install git+https://github.com/suno-ai/bark.git
```

### Usage

```python
from bark import SAMPLE_RATE, generate_audio, preload_models
from scipy.io.wavfile import write as write_wav

# Download models (first time only)
preload_models()

# Generate audio
text = "Hello, I'm Bark! [laughs] I can express emotions!"
audio_array = generate_audio(text)

# Save
write_wav("output.wav", SAMPLE_RATE, audio_array)
```

### Special Features

```python
# Add emotions
text = "I'm so happy! [laughs]"

# Add pauses
text = "Let me think... [pause] Yes!"

# Music notes
text = "♪ La la la ♪"
```

---

## Comparison for ARDEN

### For Daily Use (Recommended)

**1st Choice: Edge TTS**
```bash
# Install
pip install edge-tts

# Configure ARDEN
# No API key needed!
```
- FREE forever
- Good quality
- Simple setup
- Internet required

**2nd Choice: Piper**
```bash
# Install
brew install piper-tts

# Download voice
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx
```
- FREE forever
- Works offline
- Fast
- Good quality

### For Best Quality

**1st: OpenAI TTS** (~$1/month)
- Almost as good as ElevenLabs
- 20x cheaper than ElevenLabs
- Uses same API key as Whisper

**2nd: Coqui TTS** (Free, self-hosted)
- Excellent quality
- Requires more setup
- GPU recommended

### Cost Comparison (Monthly)

| Provider | 10 mins/day | 30 mins/day | 60 mins/day |
|----------|-------------|-------------|-------------|
| **Edge TTS** | $0 | $0 | $0 |
| **Piper** | $0 | $0 | $0 |
| **OpenAI TTS** | $0.50 | $1.50 | $3.00 |
| **Coqui TTS** | $0 | $0 | $0 |
| **ElevenLabs** | $11 | $22 | $44 |

---

## Setup Guide for ARDEN

### Option 1: Edge TTS (Easiest, Free)

```bash
# Install
pip install edge-tts

# Update ARDEN config
nano ~/ARDEN/config/arden.json
```

Change:
```json
{
  "voice": {
    "tts_provider": "edge-tts",
    "tts_config": {
      "voice": "en-US-AriaNeural"
    }
  }
}
```

### Option 2: Piper (Offline, Free)

```bash
# Install
brew install piper-tts

# Download voice
mkdir -p ~/.local/share/piper/models
cd ~/.local/share/piper/models
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json

# Update ARDEN config
nano ~/ARDEN/config/arden.json
```

Change:
```json
{
  "voice": {
    "tts_provider": "piper",
    "tts_config": {
      "model": "en_US-amy-medium"
    }
  }
}
```

### Option 3: OpenAI TTS (Cheap, Good Quality)

Already using OpenAI for Whisper? Just switch:

```json
{
  "voice": {
    "tts_provider": "openai-tts",
    "tts_config": {
      "api_key_env": "OPENAI_API_KEY",
      "model": "tts-1",
      "voice": "nova"
    }
  }
}
```

Cost: ~$0.50-1.50/month

---

## Implementation

I'll now update the ARDEN Telegram bot to support all these alternatives...
