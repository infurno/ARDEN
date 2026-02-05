# ARDEN - Quick Start Guide

## 🚀 Access ARDEN Web Interface

### URLs
- **Local:** http://localhost:3001
- **LAN:** http://192.168.4.57:3001
- **Tailscale:** http://100.115.162.26:3001

### Login
Get your token:
```bash
grep ARDEN_API_TOKEN /home/hal/ARDEN/.env
```

## 🎤 Voice Features

### Voice Input (Speech-to-Text)
1. **Hold** the microphone button (bottom left)
2. **Speak** your message
3. **Release** to send
4. ARDEN transcribes and responds automatically

**Tips:**
- Hold for at least 1 second before speaking
- Speak clearly and at normal volume
- Works offline (local Whisper)

### Voice Output (Text-to-Speech)
1. Click the **speaker icon** in top right
2. Toggle between "TTS On" (green) / "TTS Off" (gray)
3. When enabled, ARDEN's responses will be spoken aloud
4. Preference is saved automatically

**Features:**
- Auto-plays ARDEN responses
- Uses Microsoft Edge TTS
- Natural-sounding voice
- Can be toggled on/off anytime

## 🔧 Service Management

### Start/Stop Services
```bash
cd /home/hal/ARDEN

# Telegram Bot
./scripts/start.sh        # Start
./scripts/stop.sh         # Stop
./scripts/restart.sh      # Restart
./scripts/status.sh       # Check status

# Web Interface
./scripts/start-web.sh    # Start
./scripts/stop-web.sh     # Stop

# Both
./scripts/start.sh && ./scripts/start-web.sh
```

### View Logs
```bash
# Web interface
tail -f api/logs/web-server.log

# Telegram bot
tail -f api/logs/arden.log
```

### Check Status
```bash
# Services
ps aux | grep -E "node.*web-server|node.*telegram-bot"

# Ports
ss -tlnp | grep -E "3001|3000"

# Firewall
sudo ufw status | grep 3001
```

## 🔥 Firewall Setup (First Time Only)

```bash
cd /home/hal/ARDEN
sudo ./scripts/setup-firewall.sh
```

This allows LAN access to port 3001.

## 📱 Browser Compatibility

| Browser | Voice Input | Voice Output |
|---------|-------------|--------------|
| Chrome  | ✅          | ✅           |
| Brave   | ✅          | ✅           |
| Firefox | ✅          | ✅           |
| Edge    | ✅          | ✅           |
| Safari  | ⚠️ HTTPS    | ✅           |

**Note:** Some browsers require HTTPS for microphone access from non-localhost.

## 🎯 Quick Tests

### Test Voice Input
1. Open http://192.168.4.57:3001
2. Login with token
3. Hold mic button
4. Say: "What are my TODOs?"
5. Release button
6. Should transcribe and respond within 3-5 seconds

### Test Voice Output
1. Click speaker icon to enable TTS
2. Type or voice: "Tell me a joke"
3. ARDEN responds and speaks the response

### Test Chat History
1. Send a few messages
2. Refresh page
3. History should persist

## ⚠️ Troubleshooting

### Cannot Access from Laptop
```bash
# Check web server is running
ps aux | grep web-server

# Check firewall
sudo ufw status | grep 3001

# Restart services
./scripts/stop-web.sh && ./scripts/start-web.sh
```

### Microphone Not Working
- Check browser permissions (click lock icon in address bar)
- Try different browser (Chrome/Brave recommended)
- Check microphone works in OS settings

### Transcription Fails
```bash
# Check Whisper is installed
which whisper

# Check GPU is available
nvidia-smi

# View logs for errors
tail -f api/logs/web-server.log
```

### TTS Not Playing
- Check browser isn't muted
- Check volume settings
- Open browser console (F12) for errors
- TTS toggle must be ON (green)

## 📚 More Documentation

- **Voice Testing Guide:** `/home/hal/ARDEN/docs/VOICE_TESTING.md`
- **Full README:** `/home/hal/ARDEN/README.md`
- **API Docs:** Coming soon

## 🎮 Common Commands

```bash
# Full restart
cd /home/hal/ARDEN
./scripts/stop.sh && ./scripts/stop-web.sh
./scripts/start.sh && ./scripts/start-web.sh

# Update TODOs
./scripts/consolidate-todos.sh
./scripts/todo-summary.sh

# Check everything
./scripts/status.sh
ps aux | grep "node.*web-server"
tail -10 api/logs/web-server.log
tail -10 api/logs/arden.log
```

## 🌟 Tips

1. **Voice conversation:** Enable TTS + use voice input for hands-free chat
2. **Context aware:** ARDEN knows about your Notes and TODOs
3. **Session history:** Each browser tab maintains its own chat session
4. **Clear history:** Use "Clear History" button to start fresh
5. **Mobile:** Works on mobile browsers with touch support

## 🔐 Security Notes

- **Local network only:** Currently accessible on LAN/Tailscale
- **Token auth:** Keep your ARDEN_API_TOKEN private
- **No HTTPS:** Fine for local use, add SSL if exposing externally
- **Firewall:** Only port 3001 needs to be open

---

**Last Updated:** 2026-01-02  
**Version:** 1.0.0  
**Author:** Hal Borland
