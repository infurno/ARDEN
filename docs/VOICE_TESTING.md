# ARDEN Voice Recording - Testing Guide

## Prerequisites

1. **Services Running**
   ```bash
   cd /home/hal/ARDEN
   ./scripts/status.sh        # Check Telegram bot
   ps aux | grep web-server   # Check web server
   ```

2. **Firewall Configured**
   ```bash
   sudo ./scripts/setup-firewall.sh
   ```

3. **Access Token Ready**
   - Get your token from `.env` file:
   ```bash
   grep ARDEN_API_TOKEN /home/hal/ARDEN/.env
   ```

## Testing from Laptop (Same LAN)

### Step 1: Access Web Interface

Open browser and navigate to:
- **LAN:** http://192.168.4.57:3001
- **Tailscale:** http://100.115.162.26:3001

### Step 2: Login

1. Enter your `ARDEN_API_TOKEN` from `.env`
2. Click "Login"
3. You should be redirected to the chat page

### Step 3: Test Voice Recording

#### Basic Test
1. Click and hold the microphone button (bottom right)
2. Button should turn RED with a recording icon
3. Speak clearly: "Hello ARDEN, this is a test message"
4. Release the button
5. Watch for:
   - Button returns to gray
   - Status changes to "Transcribing..."
   - Your message appears in chat
   - ARDEN responds

#### Expected Flow
```
[User holds mic button]
  → Button turns RED
  → Recording icon shows
  → Input placeholder: "Recording... Release to send"

[User speaks]
  → Audio captured via Web Audio API

[User releases button]
  → Button returns to gray
  → Status: "Transcribing..."
  → Audio sent to /api/voice/stt
  → Whisper processes locally
  → Transcription appears in input field
  → Message sent to ARDEN automatically
  → ARDEN responds

Total time: ~2-5 seconds
```

### Step 4: Check for Errors

#### Browser Console (F12)
- Look for red errors
- Check network tab for failed requests
- Verify audio blob size > 0

#### Server Logs
```bash
# On server
tail -f /home/hal/ARDEN/api/logs/web-server.log

# Look for:
# - POST /api/voice/stt
# - Whisper transcription output
# - Any error messages
```

## Common Issues & Solutions

### 1. Microphone Permission Denied

**Symptom:** Error message "Please allow microphone access in your browser settings"

**Solution:**
- Click the camera/microphone icon in browser address bar
- Allow microphone access
- Refresh page and try again

**Chrome/Brave:**
- Settings → Privacy and security → Site Settings → Microphone
- Add http://192.168.4.57:3001 to "Allowed to use your microphone"

**Firefox:**
- Click lock icon in address bar
- Permissions → Microphone → Allow

### 2. No Audio Captured

**Symptom:** Transcription is empty or says "No speech detected"

**Solution:**
- Check microphone is working (test in OS settings)
- Speak louder and closer to microphone
- Hold button for at least 1-2 seconds before speaking
- Ensure you're on a quiet environment

### 3. Connection Refused

**Symptom:** Cannot access http://192.168.4.57:3001

**Solution:**
```bash
# Check if web server is running
ps aux | grep web-server

# If not running, start it
./scripts/start-web.sh

# Check firewall
sudo ufw status | grep 3001

# If port not open
sudo ./scripts/setup-firewall.sh

# Check if server is listening
ss -tlnp | grep 3001
```

### 4. Transcription Taking Too Long

**Symptom:** "Transcribing..." status for more than 10 seconds

**Solution:**
- Check Whisper service is running
- Check GPU utilization: `nvidia-smi`
- Check server logs for Whisper errors
- Whisper model might be downloading (first run only)

### 5. Unsupported Browser

**Symptom:** Microphone button is grayed out

**Solution:**
- Use Chrome, Brave, Firefox, or Edge (modern versions)
- Safari has limited support
- Check `navigator.mediaDevices.getUserMedia` is available
- Try HTTPS instead of HTTP (required on some browsers)

## Advanced Testing

### Test Different Audio Lengths

1. **Short (< 1 second):**
   - "Hello"
   - Should work but might miss first syllable

2. **Medium (3-5 seconds):**
   - "What are my TODOs for today?"
   - Optimal length

3. **Long (10-15 seconds):**
   - Long question or statement
   - Should work but takes longer to transcribe

### Test Background Noise

1. Play music in background
2. Test with keyboard typing sounds
3. Test with fan or AC running

Expected: Whisper should filter most background noise

### Test Multiple Languages

Whisper supports 99 languages:
- "Bonjour ARDEN" (French)
- "Hola ARDEN" (Spanish)
- "こんにちは ARDEN" (Japanese)

### Test Technical Terms

- "Show me Kubernetes configurations"
- "What's my IPv6 address?"
- "ARDEN, list my Docker containers"

Whisper should handle technical vocabulary well.

## Performance Benchmarks

Expected times on RTX 5070 GPU:

| Audio Length | Transcription Time | Total Response Time |
|--------------|-------------------|---------------------|
| 1 second     | ~0.5s             | ~1-2s               |
| 3 seconds    | ~1s               | ~2-3s               |
| 5 seconds    | ~1.5s             | ~3-4s               |
| 10 seconds   | ~2.5s             | ~4-6s               |

*Total response time includes transcription + ARDEN AI processing*

## Browser Compatibility

| Browser          | Status | Notes                          |
|------------------|--------|--------------------------------|
| Chrome 60+       | ✅     | Full support                   |
| Brave 1.0+       | ✅     | Full support                   |
| Firefox 55+      | ✅     | Full support                   |
| Edge 79+         | ✅     | Full support (Chromium)        |
| Safari 14+       | ⚠️     | Limited, may need HTTPS        |
| Mobile Chrome    | ✅     | Touch support included         |
| Mobile Safari    | ⚠️     | May need HTTPS                 |

## Security Considerations

### HTTP vs HTTPS

Currently using HTTP (no SSL certificate).

**Implications:**
- Works fine on localhost and LAN
- Some browsers require HTTPS for microphone access from non-localhost
- Consider adding Let's Encrypt if exposing to internet

**To add HTTPS:**
```bash
# Install certbot
sudo pacman -S certbot

# Get certificate (if you have a domain)
sudo certbot certonly --standalone -d yourdomain.com

# Update web-server.js to use HTTPS
```

### Firewall Rules

Current setup allows LAN access only:
- `0.0.0.0:3001` binding allows any interface
- UFW rule allows TCP/3001 from any IP
- Consider restricting to LAN subnet if needed

**To restrict to LAN only:**
```bash
sudo ufw delete allow 3001/tcp
sudo ufw allow from 192.168.4.0/24 to any port 3001 proto tcp
```

## Monitoring & Debugging

### Real-time Monitoring

Terminal 1 - Web Server Logs:
```bash
tail -f /home/hal/ARDEN/api/logs/web-server.log
```

Terminal 2 - System Resources:
```bash
watch -n 1 nvidia-smi  # GPU usage during transcription
```

Terminal 3 - Network Connections:
```bash
watch -n 1 'ss -tn | grep :3001'
```

### Debug Mode

Enable verbose logging in `api/services/stt.js`:
```javascript
// Add to Whisper spawn arguments
const whisper = spawn('whisper', [
    audioPath,
    '--model', 'base',
    '--output_format', 'txt',
    '--verbose', 'True'  // Add this
]);
```

### Browser Developer Tools

**Console Tab:**
- Check for JavaScript errors
- View console.log output from voice.js

**Network Tab:**
- Monitor `/api/voice/stt` request
- Check request payload size
- View response time
- Inspect response body

**Application Tab:**
- Check cookies (auth token)
- View localStorage/sessionStorage

## Success Criteria

Voice recording is working correctly if:

✅ Microphone button responds to click and hold
✅ Button turns red while recording
✅ Audio is captured (blob size > 0)
✅ Transcription completes within 5 seconds
✅ Transcription is accurate (>90% for clear speech)
✅ Message is sent to ARDEN automatically
✅ ARDEN responds normally
✅ No errors in browser console
✅ No errors in server logs

## Next Steps After Testing

Once basic voice recording works:

1. **Add TTS Auto-playback**
   - ARDEN responses automatically speak
   - Toggle button to enable/disable
   - Volume control

2. **Add Conversation Mode**
   - Continuous conversation without typing
   - Voice Activity Detection (VAD)
   - Auto-send after silence

3. **Add Voice Settings**
   - Choose TTS voice
   - Adjust speech rate
   - Change Whisper model (tiny/base/small/medium)

4. **Add Mobile Optimization**
   - Better touch support
   - Responsive design
   - Mobile-specific UI

## Troubleshooting Commands

```bash
# Restart everything
./scripts/stop.sh && ./scripts/stop-web.sh
./scripts/start.sh && ./scripts/start-web.sh

# Check if Whisper is installed
which whisper

# Test Whisper manually
whisper /path/to/audio.wav --model base

# Check GPU is accessible
nvidia-smi

# Check CUDA is working
python3 -c "import torch; print(torch.cuda.is_available())"

# View environment variables
grep -E 'WEB_|ARDEN_' /home/hal/ARDEN/.env

# Check disk space (voice recordings)
du -sh /home/hal/ARDEN/voice/recordings/

# Clear old recordings
find /home/hal/ARDEN/voice/recordings/ -type f -mtime +1 -delete
```

## Contact & Support

If you encounter issues:

1. Check server logs first
2. Check browser console
3. Try different browser
4. Restart services
5. Check GitHub issues: https://github.com/infurno/ARDEN/issues

---

**Last Updated:** 2026-01-02
**ARDEN Version:** 1.0.0
**Author:** Hal Borland
