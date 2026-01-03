# ARDEN Web Interface

Modern web interface for ARDEN AI assistant.

## Quick Start

### Start the Web Interface

```bash
cd /home/hal/ARDEN
./scripts/start-web.sh
```

### Access

Open your browser and go to:
- http://localhost:3001
- http://127.0.0.1:3001

### Login

Use your `ARDEN_API_TOKEN` from `.env` file to login.

### Stop the Server

```bash
./scripts/stop-web.sh
```

## Features

### Phase 1 MVP (Completed)

✅ **Authentication**
- Secure token-based login
- Session management
- Auto-redirect on unauthorized access

✅ **Chat Interface**
- ChatGPT-style conversation UI
- Real-time messaging with ARDEN
- Chat history (per session)
- Clear chat functionality
- Voice input (hold-to-record)
- Text-to-speech output (optional)

✅ **Dashboard**
- System status monitoring
- AI provider info (Ollama, OpenAI, etc.)
- Notes count
- Active TODOs count
- Voice configuration status
- Auto-refresh every 30 seconds

✅ **Notes Interface** (Full Featured)
- Create, edit, rename, and delete notes
- Markdown editor with live preview
- YAML front matter support
- Tag display and filtering
- Live search with debouncing
- Card grid layout (responsive)
- Wiki-style links `[[Page Name]]`
- Image uploads to `~/Notes/attachments/`
- Export to multiple formats (Markdown, Hugo, Jekyll, HTML)
- Navigation history (Back/Forward buttons + Alt+Arrow shortcuts)
- Auto-save with 2-second debounce
- Dark mode toggle (ultra-dark variant)

✅ **Design**
- Tokyo Night color scheme across all pages
- Unified navigation with logo
- Cyberpunk neon aesthetic
- Consistent button and card styling
- Responsive design

## Architecture

### Backend (Express.js)
- Port: 3001 (configurable via `WEB_PORT`)
- Host: 127.0.0.1 (localhost only)
- Session management with cookies
- RESTful API

### Frontend (Vanilla JS + Tailwind CSS)
- No build step required
- Tokyo Night color scheme (dark mode)
- Responsive design
- Real-time updates
- Neon cyberpunk aesthetic with custom logo

## File Structure

```
/home/hal/ARDEN/
├── api/
│   ├── web-server.js              # Main Express server
│   ├── routes/
│   │   ├── auth.js                # Authentication endpoints
│   │   ├── chat.js                # Chat endpoints
│   │   ├── status.js              # Status endpoints
│   │   ├── notes.js               # Notes CRUD endpoints
│   │   └── voice.js               # Voice/STT endpoints
│   ├── services/
│   │   ├── database.js            # Notes database
│   │   ├── session-store.js       # Session management
│   │   └── skill-executor.js      # Skill execution
│   ├── middleware/
│   │   └── auth.js                # Auth middleware
│   └── logs/
│       └── web-server.log         # Web server logs
│
├── web/
│   ├── login.html                 # Login page
│   ├── chat.html                  # Chat interface
│   ├── dashboard.html             # Dashboard
│   ├── notes.html                 # Notes manager
│   └── assets/
│       ├── images/
│       │   └── arden-logo.png     # Neon logo
│       └── js/
│           ├── api.js             # API client
│           ├── auth.js            # Auth handler
│           ├── chat.js            # Chat handler
│           ├── dashboard.js       # Dashboard handler
│           ├── notes.js           # Notes handler
│           └── voice.js           # Voice recorder
│
└── scripts/
    ├── start-web.sh               # Start web server
    └── stop-web.sh                # Stop web server
```

## API Endpoints

### Authentication
```
POST   /api/auth/login       # Login with token
POST   /api/auth/logout      # Logout
GET    /api/auth/verify      # Check auth status
```

### Chat
```
POST   /api/chat             # Send message to ARDEN
GET    /api/chat/history     # Get chat history
DELETE /api/chat/clear       # Clear chat history
```

### Notes
```
GET    /api/notes            # List all notes
GET    /api/notes/:name      # Get note content
POST   /api/notes            # Create new note
PUT    /api/notes/:name      # Update note content
PATCH  /api/notes/:name      # Rename note
DELETE /api/notes/:name      # Delete note
POST   /api/notes/upload     # Upload image attachment
```

### Voice
```
POST   /api/voice/transcribe # Transcribe audio to text
POST   /api/voice/synthesize # Text to speech
```

### Status
```
GET    /api/status           # Get system status
GET    /api/status/health    # Health check
```

## Configuration

### Environment Variables

Create or edit `/home/hal/ARDEN/api/.env`:

```bash
# API Token (required)
ARDEN_API_TOKEN=your-secure-token-here

# Web Server (optional)
WEB_PORT=3001
WEB_HOST=127.0.0.1
SESSION_SECRET=your-session-secret

# AI Provider (already configured)
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
```

## Usage

### Starting Services

```bash
# Start Telegram bot (if using)
./scripts/start.sh

# Start web interface
./scripts/start-web.sh
```

### Stopping Services

```bash
# Stop web interface
./scripts/stop-web.sh

# Stop Telegram bot
./scripts/stop.sh
```

### Viewing Logs

```bash
# Web server logs
tail -f api/logs/web-server.log

# ARDEN bot logs
tail -f api/logs/arden.log
```

## Security

### Current Security Features
- ✅ Token-based authentication
- ✅ Session cookies (HTTP-only)
- ✅ CORS restricted to localhost
- ✅ Rate limiting (inherited from ARDEN)
- ✅ Localhost-only binding (127.0.0.1)

### For LAN Access (Optional)

If you want to access from other devices on your network:

1. Update `WEB_HOST` in `.env`:
   ```bash
   WEB_HOST=0.0.0.0
   ```

2. Configure firewall:
   ```bash
   sudo ufw allow 3001/tcp
   ```

3. Consider adding HTTPS via reverse proxy (nginx/caddy)

## Troubleshooting

### Web interface won't start
```bash
# Check if port is in use
sudo lsof -i :3001

# Check logs
tail -50 api/logs/web-server.log

# Verify dependencies
cd api && npm install
```

### Can't login
- Verify `ARDEN_API_TOKEN` is set in `/home/hal/ARDEN/.env`
- Check browser console for errors
- Ensure cookies are enabled

### Chat not working
- Verify ARDEN Telegram bot is running or AI provider is configured
- Check `api/logs/web-server.log` for errors
- Test with: `curl http://localhost:3001/api/status/health`

## Future Enhancements (Phase 2+)

Planned features:
- [ ] TODO management interface
- [ ] Skills configuration UI
- [ ] Real-time WebSocket updates
- [ ] Analytics dashboard
- [ ] Settings configuration UI
- [ ] Mobile responsive improvements
- [ ] PWA support
- [ ] Theme customization (light mode, custom colors)
- [ ] Collaborative note editing
- [ ] Note templates

## Design System

ARDEN uses the **Tokyo Night** color scheme for a cohesive cyberpunk aesthetic.

See [TOKYO_NIGHT_THEME.md](../TOKYO_NIGHT_THEME.md) for complete design documentation including:
- Color palette reference
- Component styling guidelines
- Navigation structure
- Button variants
- Form styling

## Development

### Making Changes

HTML/CSS/JS changes are immediate - just refresh browser.

For backend changes:
```bash
./scripts/stop-web.sh
./scripts/start-web.sh
```

### Testing

```bash
# Health check
curl http://localhost:3001/api/status/health

# Test auth (replace with your token)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"token":"your-token-here"}'
```

## Support

For issues or questions:
- Check logs: `api/logs/web-server.log`
- Review configuration: `config/arden.json`
- Verify environment: `api/.env`

---

**ARDEN Web Interface v1.0** - Built for self-hosting on Arch Linux
