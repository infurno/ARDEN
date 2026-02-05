# ARDEN Voice Configuration Guide

Complete guide to voice interaction with ARDEN across all devices.

## Voice Architecture

```
┌─────────────────────────────────────────────────┐
│  INPUT: Your Voice                              │
│    ↓                                            │
│  Device (Phone/iPad/Smart Speaker)              │
│    ↓                                            │
│  Telegram/API/PWA                               │
│    ↓                                            │
│  Speech-to-Text (Whisper)                       │
│    ↓                                            │
│  ARDEN Processing (Claude Code)                 │
│    ↓                                            │
│  Text-to-Speech (ElevenLabs)                    │
│    ↓                                            │
│  OUTPUT: ARDEN's Voice Response                 │
└─────────────────────────────────────────────────┘
```

## Speech-to-Text Providers

### OpenAI Whisper (Recommended)

**Pros:**
- Excellent accuracy
- Supports 99+ languages
- Handles accents well
- Fast API response

**Setup:**
```json
{
  "voice": {
    "stt_provider": "openai-whisper",
    "stt_config": {
      "api_key_env": "OPENAI_API_KEY",
      "model": "whisper-1",
      "language": "en"
    }
  }
}
```

**Cost:** $0.006 per minute of audio

**Get API Key:** https://platform.openai.com/api-keys

### Alternative: Deepgram

Fast and accurate alternative:
```json
{
  "voice": {
    "stt_provider": "deepgram",
    "stt_config": {
      "api_key_env": "DEEPGRAM_API_KEY",
      "model": "nova-2",
      "language": "en"
    }
  }
}
```

## Text-to-Speech Providers

### ElevenLabs (Recommended)

**Pros:**
- Most natural-sounding voices
- Emotion and tone control
- Voice cloning available
- Multiple languages

**Setup:**
```json
{
  "voice": {
    "tts_provider": "elevenlabs",
    "tts_config": {
      "api_key_env": "ELEVENLABS_API_KEY",
      "voice_id": "21m00Tcm4TlvDq8ikWAM",
      "model": "eleven_multilingual_v2",
      "stability": 0.5,
      "similarity_boost": 0.75
    }
  }
}
```

**Popular Voice IDs:**
- `21m00Tcm4TlvDq8ikWAM` - Rachel (female, calm)
- `EXAVITQu4vr4xnSDxMaL` - Bella (female, friendly)
- `VR6AewLTigWG4xSOukaG` - Arnold (male, strong)
- `pNInz6obpgDQGcFmaJgB` - Adam (male, deep)

**Get API Key:** https://elevenlabs.io/

**Find Your Voice:**
1. Go to https://elevenlabs.io/voice-library
2. Preview voices
3. Copy voice ID from URL or settings

### Alternative: OpenAI TTS

More affordable option:
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

**Voices:** alloy, echo, fable, onyx, nova, shimmer

**Cost:** $15 per million characters

## Voice Configuration Parameters

### Stability (ElevenLabs)
Controls voice consistency:
- `0.0-0.3`: More expressive, variable
- `0.4-0.6`: Balanced (recommended)
- `0.7-1.0`: Very stable, monotone

```json
"stability": 0.5
```

### Similarity Boost (ElevenLabs)
Controls how closely voice matches the original:
- `0.0-0.5`: More creative interpretation
- `0.6-0.8`: Balanced (recommended)
- `0.9-1.0`: Very close to original

```json
"similarity_boost": 0.75
```

### Language Settings

For non-English:
```json
{
  "voice": {
    "stt_config": {
      "language": "es"  // Spanish
    },
    "tts_config": {
      "model": "eleven_multilingual_v2"
    }
  }
}
```

**Supported Languages:**
- English (en), Spanish (es), French (fr)
- German (de), Italian (it), Portuguese (pt)
- Polish (pl), Dutch (nl), and 90+ more

## Device-Specific Setup

### iPhone/iPad

**Method 1: Telegram (Easiest)**
1. Install Telegram app
2. Find your ARDEN bot
3. Use voice message button
4. Done!

**Method 2: iOS Shortcuts + Siri**
1. Create Shortcut (see setup.md)
2. Say "Hey Siri, ask ARDEN about my schedule"
3. Siri dictates → ARDEN responds → Siri speaks

### Android

**Method 1: Telegram (Easiest)**
Same as iPhone.

**Method 2: Tasker**
1. Install Tasker
2. Create task with:
   - Voice Recognition
   - HTTP POST to ARDEN API
   - Say response
3. Trigger with widget or voice command

### Smart Speakers

**Amazon Alexa:**
- Not directly supported yet
- Workaround: Use Telegram via phone

**Google Home:**
- Not directly supported yet
- Workaround: Use Telegram via phone

**HomePod:**
- Use iOS Shortcuts method
- "Hey Siri, run my ARDEN shortcut"

### Desktop/Laptop

**Web Browser (Chrome/Safari/Firefox):**
```bash
# Start voice server
cd ~/ARDEN/api
node voice-server.js

# Open browser
open http://localhost:3000
```

Click microphone → speak → receive response

**Terminal:**
```bash
# Coming soon: Direct CLI voice mode
arden --voice "What's my schedule?"
```

## Optimizing for Voice

### Designing Voice-First Responses

ARDEN automatically formats responses for voice. Follow these guidelines when creating skills:

**DO:**
- Keep responses under 60 seconds of speech
- Use clear sections with pauses
- Provide specific, actionable items
- Use time estimates
- Summarize when listing more than 3 items

**DON'T:**
- Return long lists
- Use complex formatting (tables, code blocks)
- Include URLs (say "I'll send you the link")
- Use visual-only information

### Example Voice Response

**Bad (too long):**
```
You have meetings at 9:00 AM with John about the Q1 report,
then at 9:30 AM with Sarah about the design review, then at
10:00 AM with the entire team for standup... [continues]
```

**Good (scannable):**
```
You have 5 meetings today. The key ones are:
Team standup at 9, client review at 2, and project planning at 4.

Your top priority: Finish the Q1 report, it's due today.

I recommend blocking 10 to 12 for focused work.
```

### Voice Workflow Templates

Located in `skills/*/workflows/*.md`, each should include:

```markdown
## Voice Script Template

Good [morning/afternoon]!

[BRIEF OVERVIEW]
[2-3 sentences max]

[KEY INFORMATION]
[Top 3-5 items with time/priority]

[RECOMMENDATION]
[Single, clear next action]

Ready to proceed?
```

## Advanced Voice Features

### Wake Word Detection

Coming soon:
```json
{
  "voice": {
    "wake_word": "Hey ARDEN",
    "wake_word_enabled": true
  }
}
```

### Voice Notifications

Push voice updates to your device:
```json
{
  "voice": {
    "notifications": true,
    "notification_times": ["08:00", "18:00"]
  }
}
```

### Multi-Voice Agents

Different voices for different agents:
```json
{
  "agents": {
    "assistant": {
      "voice_id": "21m00Tcm4TlvDq8ikWAM"
    },
    "strategist": {
      "voice_id": "VR6AewLTigWG4xSOukaG"
    }
  }
}
```

## Cost Estimation

### Typical Daily Usage

**10 voice interactions per day:**
- 5 minutes total input audio
- 5 minutes total output audio

**Monthly Cost:**
- STT (Whisper): ~$0.90
- TTS (ElevenLabs): ~$10-15
- **Total: ~$11-16/month**

### Cost Optimization

1. **Use text when possible** - No API costs
2. **Shorter responses** - Less TTS usage
3. **OpenAI TTS** - More affordable alternative
4. **Batch requests** - Combine multiple queries

## Privacy & Security

### Data Handling

- Voice recordings stored temporarily in `voice/recordings/`
- Auto-deleted after 7 days (configurable)
- Transcripts logged to `history/sessions/`
- No voice data sent to third parties except STT/TTS APIs

### Best Practices

1. **Use environment variables** for API keys
2. **Restrict Telegram bot** to your user ID only
3. **Review transcripts** regularly for accuracy
4. **Rotate API keys** periodically
5. **Enable audit logging** in config

### Telegram Security

```json
{
  "telegram": {
    "allowed_users": [123456789],  // Only your user ID
    "rate_limit": {
      "max_requests": 100,
      "window_ms": 900000  // 15 minutes
    }
  }
}
```

## Troubleshooting Voice Issues

### "Voice transcription failed"

1. Check API key:
   ```bash
   echo $OPENAI_API_KEY
   ```

2. Test API directly:
   ```bash
   curl https://api.openai.com/v1/audio/transcriptions \
     -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "Content-Type: multipart/form-data" \
     -F file="@test.ogg" \
     -F model="whisper-1"
   ```

3. Check audio format (should be OGG, MP3, WAV, or M4A)

### "Text-to-speech not working"

1. Check if ElevenLabs key is set
2. Verify voice ID is valid
3. Bot will work without TTS (text-only responses)

### "Voice response sounds robotic"

Adjust stability and similarity:
```json
{
  "stability": 0.4,        // More expressive
  "similarity_boost": 0.8  // Closer to original
}
```

### "Slow response time"

1. Use faster STT model (Deepgram)
2. Reduce response length
3. Consider local Whisper instance

## Next Steps

- [Create voice-optimized skills](skills.md)
- [Configure automated voice briefings](routines.md)
- [Set up voice agents](agents.md)
