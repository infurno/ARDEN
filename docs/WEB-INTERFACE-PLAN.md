# ARDEN Web Interface - Technical Plan

**Version:** 1.0  
**Date:** 2026-01-02  
**Author:** Hal Borland  
**Project:** ARDEN Web UI

---

## 1. Overview

Self-hosted web interface for ARDEN (AI Routine Daily Engagement Nexus) running on localhost, integrating with existing ARDEN APIs.

### Goals
- Provide visual dashboard for ARDEN interactions
- Enable chat interface (similar to ChatGPT/Claude web UI)
- Manage notes, TODOs, and routines
- View conversation history and analytics
- Configure ARDEN settings
- Real-time status monitoring

---

## 2. Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                       │
│                   (localhost:3000)                      │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTP/WebSocket
                           ▼
┌─────────────────────────────────────────────────────────┐
│              ARDEN Web Server (Express)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   API Routes │  │  WebSocket   │  │ Static Files │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
┌───────────────────────┐  ┌────────────────────────┐
│  ARDEN Core Services  │  │  File System Access    │
│  - AI Providers       │  │  - ~/Notes             │
│  - Context Loader     │  │  - Session Logs        │
│  - Skills/Tools       │  │  - Config Files        │
└───────────────────────┘  └────────────────────────┘
```

---

## 3. Technology Stack

### Frontend
**Recommendation: Vanilla JavaScript + Tailwind CSS**

**Why:**
- No build step required - simple deployment
- Fast, lightweight, no npm dependencies on frontend
- Tailwind via CDN for modern UI
- Easy to maintain and modify
- Works perfectly for self-hosted single-user app

**Alternative (if complexity grows):** Vue.js or React

### Backend (API)
**Current:** Node.js + Express (already configured)
- Port: 3000 (configurable)
- Already has API structure in place
- Add Express routes for web endpoints

### Real-time Communication
**WebSockets** via `socket.io` or `ws`
- Live chat updates
- Status monitoring
- Real-time notifications

### Database
**Not needed initially** - use file system
- Session history: JSON files
- Settings: existing `arden.json`
- Notes: existing `~/Notes`

**Future:** SQLite if needed for analytics

### Authentication
**Simple token-based auth**
- Use existing `ARDEN_API_TOKEN` from env
- Session cookies for web UI
- Local-only (no external access initially)

---

## 4. Feature Breakdown

### Phase 1: Core Interface (MVP)
**Priority: High**

#### 4.1 Chat Interface
- Clean chat UI (ChatGPT-style)
- Send text messages to ARDEN
- Display AI responses with markdown support
- Message history (session-based)
- Typing indicators
- Copy message functionality

**Pages:**
- `/` - Main chat interface

**API Endpoints:**
```
POST   /api/chat              - Send message to ARDEN
GET    /api/chat/history      - Get conversation history
DELETE /api/chat/clear        - Clear current session
```

#### 4.2 Dashboard
- System status (running/stopped)
- Active AI provider (Ollama, OpenAI, etc.)
- Quick stats:
  - Messages today
  - Active TODOs count
  - Recent notes count
- Service health indicators

**Pages:**
- `/dashboard` - System overview

**API Endpoints:**
```
GET    /api/status            - System status
GET    /api/stats             - Usage statistics
```

#### 4.3 Authentication
- Login page with token
- Session management
- Logout functionality

**Pages:**
- `/login` - Login page

**API Endpoints:**
```
POST   /api/auth/login        - Authenticate with token
POST   /api/auth/logout       - End session
GET    /api/auth/verify       - Check auth status
```

### Phase 2: Enhanced Features
**Priority: Medium**

#### 4.4 Notes Management
- Browse ~/Notes directory
- View note contents
- Create new notes
- Edit existing notes
- Search notes
- Filter by date/tags

**Pages:**
- `/notes` - Notes browser
- `/notes/:id` - View/edit specific note

**API Endpoints:**
```
GET    /api/notes             - List all notes
GET    /api/notes/:id         - Get specific note
POST   /api/notes             - Create new note
PUT    /api/notes/:id         - Update note
DELETE /api/notes/:id         - Delete note
GET    /api/notes/search      - Search notes
```

#### 4.5 TODO Management
- View consolidated TODO list
- Check/uncheck items
- Add new TODOs
- Filter by status (done/pending)
- Refresh/regenerate TODO list

**Pages:**
- `/todos` - TODO manager

**API Endpoints:**
```
GET    /api/todos             - Get consolidated TODOs
POST   /api/todos/consolidate - Trigger consolidation
PUT    /api/todos/:id         - Update TODO status
POST   /api/todos             - Create new TODO
```

#### 4.6 Skills & Tools
- View available skills
- Trigger manual skill execution
- View skill documentation
- Configure skill settings

**Pages:**
- `/skills` - Skills manager

**API Endpoints:**
```
GET    /api/skills            - List all skills
GET    /api/skills/:id        - Get skill details
POST   /api/skills/:id/run    - Execute skill
```

### Phase 3: Advanced Features
**Priority: Low**

#### 4.7 Configuration
- Edit arden.json via UI
- Toggle features on/off
- Configure AI providers
- Set routines and schedules
- Manage context directories

**Pages:**
- `/settings` - Configuration UI

**API Endpoints:**
```
GET    /api/config            - Get current config
PUT    /api/config            - Update config
POST   /api/config/validate   - Validate config changes
```

#### 4.8 Analytics & Insights
- Message volume over time
- Most used skills
- AI provider usage stats
- Response time metrics
- Token usage (if applicable)

**Pages:**
- `/analytics` - Analytics dashboard

**API Endpoints:**
```
GET    /api/analytics/messages    - Message stats
GET    /api/analytics/skills      - Skill usage
GET    /api/analytics/performance - Performance metrics
```

#### 4.9 Voice Interface (Web)
- Record voice messages via browser
- Send to ARDEN for STT
- Play TTS responses
- Voice settings

**Pages:**
- `/voice` - Voice interface

**API Endpoints:**
```
POST   /api/voice/stt         - Speech-to-text
POST   /api/voice/tts         - Text-to-speech
```

---

## 5. UI/UX Design

### Color Scheme
**Dark mode by default** (your preference as Arch user)
- Primary: Blue (#3b82f6)
- Background: Dark gray (#1e1e1e)
- Surface: Lighter gray (#2d2d2d)
- Text: Light gray (#e5e5e5)
- Accent: Green (#10b981) for success
- Error: Red (#ef4444)

### Layout
```
┌──────────────────────────────────────────────────────────┐
│  ARDEN         Dashboard  Chat  Notes  TODOs  Settings  │
├────────┬─────────────────────────────────────────────────┤
│        │                                                  │
│  Nav   │              Main Content Area                   │
│  Bar   │                                                  │
│        │                                                  │
│        │                                                  │
└────────┴─────────────────────────────────────────────────┘
```

### Key Pages Wireframes

#### Chat Interface
```
┌────────────────────────────────────────┐
│  ARDEN Chat                    [Clear] │
├────────────────────────────────────────┤
│                                        │
│  You: What are my TODOs?               │
│  [12:30 PM]                            │
│                                        │
│  ARDEN: You have 530 unchecked...     │
│  [12:30 PM]                   [Copy]   │
│                                        │
├────────────────────────────────────────┤
│  [Type a message...]           [Send]  │
└────────────────────────────────────────┘
```

#### Dashboard
```
┌────────────────────────────────────────┐
│  System Status                         │
│  ● Running    Ollama (llama3.2)       │
├──────────────┬─────────────────────────┤
│  Messages    │  TODOs                  │
│  47 today    │  530 active             │
├──────────────┼─────────────────────────┤
│  Notes       │  Last Activity          │
│  574 files   │  2 mins ago             │
└──────────────┴─────────────────────────┘
```

---

## 6. API Specification

### Base Configuration
- **Base URL:** `http://localhost:3000/api`
- **Auth:** Bearer token via `ARDEN_API_TOKEN`
- **Content-Type:** `application/json`

### Core Endpoints (Phase 1)

#### Chat
```javascript
POST /api/chat
Request:
{
  "message": "What are my TODOs?",
  "sessionId": "optional-session-id"
}
Response:
{
  "response": "You have 530 unchecked tasks...",
  "sessionId": "abc123",
  "timestamp": "2026-01-02T20:30:00Z"
}
```

#### Status
```javascript
GET /api/status
Response:
{
  "status": "running",
  "aiProvider": "ollama",
  "model": "llama3.2",
  "voice": {
    "enabled": true,
    "stt": "local-whisper",
    "tts": "edge-tts"
  },
  "uptime": 3600
}
```

#### Authentication
```javascript
POST /api/auth/login
Request:
{
  "token": "your-arden-token"
}
Response:
{
  "success": true,
  "sessionToken": "jwt-or-session-id"
}
```

---

## 7. File Structure

```
/home/hal/ARDEN/
├── api/
│   ├── telegram-bot.js          (existing)
│   ├── web-server.js            (NEW - main web server)
│   ├── routes/
│   │   ├── auth.js              (NEW)
│   │   ├── chat.js              (NEW)
│   │   ├── notes.js             (NEW)
│   │   ├── todos.js             (NEW)
│   │   ├── status.js            (NEW)
│   │   └── skills.js            (NEW)
│   ├── middleware/
│   │   ├── auth.js              (NEW)
│   │   └── cors.js              (NEW)
│   └── services/                (existing)
│
├── web/                         (NEW - frontend)
│   ├── index.html               (login page)
│   ├── dashboard.html           (main dashboard)
│   ├── chat.html                (chat interface)
│   ├── notes.html               (notes manager)
│   ├── todos.html               (TODO manager)
│   ├── assets/
│   │   ├── css/
│   │   │   └── styles.css       (custom styles)
│   │   └── js/
│   │       ├── app.js           (main app logic)
│   │       ├── chat.js          (chat functionality)
│   │       ├── api.js           (API client)
│   │       └── auth.js          (auth handler)
│   └── components/              (reusable HTML snippets)
│
└── scripts/
    └── start-web.sh             (NEW - start web server)
```

---

## 8. Security Considerations

### Authentication
- ✅ Token-based auth using existing `ARDEN_API_TOKEN`
- ✅ HTTP-only session cookies
- ✅ CORS limited to localhost
- ✅ Rate limiting (already implemented)

### Local-Only Access
- Default bind to `127.0.0.1` (localhost only)
- Add firewall rules if opening to LAN
- Consider reverse proxy (nginx) for HTTPS if needed

### API Security
- Validate all inputs
- Sanitize file paths (prevent directory traversal)
- Limit file operations to allowed directories
- Command injection prevention (already in place)

---

## 9. Implementation Plan

### Sprint 1: Foundation (Week 1)
- [ ] Set up Express web server
- [ ] Create basic HTML/CSS structure
- [ ] Implement authentication
- [ ] Build chat interface (frontend)
- [ ] Build chat API endpoint
- [ ] Test chat functionality

### Sprint 2: Core Features (Week 2)
- [ ] Dashboard page
- [ ] Status API endpoints
- [ ] Notes listing API
- [ ] Notes viewer UI
- [ ] Basic navigation

### Sprint 3: TODO Integration (Week 3)
- [ ] TODO list API
- [ ] TODO UI with filtering
- [ ] Integration with consolidation script
- [ ] Update/create TODO functionality

### Sprint 4: Polish & Deploy (Week 4)
- [ ] Settings page
- [ ] Skills management
- [ ] Error handling
- [ ] Loading states
- [ ] Documentation
- [ ] Deployment scripts

---

## 10. Technology Choices - Detailed

### Why Vanilla JS + Tailwind?

**Pros:**
- Zero build step - just edit and refresh
- No Node.js dependencies on frontend
- Fast development for MVP
- Easy to understand and modify
- Tailwind provides professional UI quickly
- Perfect for single-user local deployment

**Cons:**
- More manual DOM manipulation
- No reactive data binding
- Can get messy with complex state

**Alternatives Considered:**
1. **Vue.js** - Good for medium complexity, reactive
2. **React** - Overkill for this, needs build step
3. **Svelte** - Great, but adds complexity
4. **HTMX** - Interesting, server-side focused

**Recommendation:** Start with Vanilla JS, migrate to Vue if complexity grows

### Backend Framework: Express

**Why Express:**
- Already familiar (using node-telegram-bot-api)
- Lightweight and fast
- Huge ecosystem
- Easy to add WebSocket support
- Integrates well with existing ARDEN code

---

## 11. Deployment

### Development
```bash
# Start web server
cd /home/hal/ARDEN
node api/web-server.js

# Or use the script
./scripts/start-web.sh
```

### Production (Systemd Service)
```ini
[Unit]
Description=ARDEN Web Interface
After=network.target

[Service]
Type=simple
User=hal
WorkingDirectory=/home/hal/ARDEN
ExecStart=/usr/bin/node /home/hal/ARDEN/api/web-server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Reverse Proxy (Optional - for HTTPS/LAN access)
```nginx
server {
    listen 80;
    server_name arden.local;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 12. Performance Considerations

### Frontend Optimization
- Lazy load chat history
- Pagination for notes list
- Debounce search inputs
- Cache API responses
- Minimize DOM updates

### Backend Optimization
- Cache context loading (already implemented)
- Stream large file responses
- Compress API responses (gzip)
- Connection pooling for WebSockets

### Monitoring
- Log response times
- Track API endpoint usage
- Monitor memory usage
- Alert on errors

---

## 13. Future Enhancements

### Phase 4 (Future)
- [ ] Mobile-responsive design
- [ ] Progressive Web App (PWA)
- [ ] Offline support
- [ ] Multi-user support
- [ ] Calendar integration for routines
- [ ] Kanban board for TODOs
- [ ] Rich text editor for notes
- [ ] Code syntax highlighting
- [ ] Export/import functionality
- [ ] Plugin system for custom widgets
- [ ] Desktop app (Electron wrapper)

---

## 14. Success Metrics

### MVP Success Criteria
- ✅ Can chat with ARDEN via web interface
- ✅ Can view and manage TODOs
- ✅ Can browse and view notes
- ✅ System status visible
- ✅ Authentication working
- ✅ Responsive on desktop
- ✅ No crashes for 24h continuous operation

### Performance Targets
- Chat response: < 500ms (excluding AI processing)
- Page load: < 1s
- API response: < 100ms (for non-AI endpoints)
- WebSocket latency: < 50ms

---

## 15. Next Steps

**Immediate Actions:**
1. Review and approve this plan
2. Choose exact tech stack (confirm Vanilla JS + Tailwind)
3. Set up basic Express server
4. Create HTML template structure
5. Build authentication flow
6. Implement chat API endpoint

**Questions to Answer:**
- Do you want to start with Phase 1 MVP immediately?
- Any specific features you want prioritized?
- Do you prefer dark mode only, or theme switcher?
- Should we use WebSockets or polling for real-time updates?
- Any existing UI frameworks/libraries you prefer?

---

**Ready to start building?** We can begin with the Express server setup and basic HTML structure.
