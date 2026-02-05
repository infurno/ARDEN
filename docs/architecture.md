# ARDEN Architecture

Complete technical architecture for the AI Routine Daily Engagement Nexus.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ARDEN ECOSYSTEM                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    DEVICE LAYER                              │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  📱 Phone    💻 Desktop    📱 Tablet    🔊 Smart Speaker    │ │
│  └────────────┬─────────────────────────────────────────────────┘ │
│               │                                                     │
│  ┌────────────▼─────────────────────────────────────────────────┐ │
│  │               INTERFACE LAYER                                │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  Telegram Bot  │  REST API  │  CLI  │  iOS Shortcuts        │ │
│  └────────────┬─────────────────────────────────────────────────┘ │
│               │                                                     │
│  ┌────────────▼─────────────────────────────────────────────────┐ │
│  │               VOICE PROCESSING LAYER                         │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │                                                              │ │
│  │  STT (Speech-to-Text)              TTS (Text-to-Speech)     │ │
│  │  ┌──────────────────┐              ┌──────────────────┐     │ │
│  │  │ OpenAI Whisper   │              │  ElevenLabs      │     │ │
│  │  │ (or Deepgram)    │              │  (or OpenAI)     │     │ │
│  │  └────────┬─────────┘              └────────▲─────────┘     │ │
│  │           │                                  │               │ │
│  └───────────┼──────────────────────────────────┼───────────────┘ │
│              │                                  │                 │
│  ┌───────────▼──────────────────────────────────┴───────────────┐ │
│  │               ORCHESTRATION LAYER                            │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │                   ARDEN Core Engine                          │ │
│  │                   (Claude Code CLI)                          │ │
│  │                                                              │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │ │
│  │  │  Hooks     │  │  Routing   │  │  Context   │            │ │
│  │  │  System    │  │  Logic     │  │  Manager   │            │ │
│  │  └────────────┘  └────────────┘  └────────────┘            │ │
│  └────────────┬─────────────────────────────────────────────────┘ │
│               │                                                   │
│  ┌────────────▼─────────────────────────────────────────────────┐ │
│  │               EXECUTION LAYER                                │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │                                                              │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │ │
│  │  │  Skills  │  │  Agents  │  │Workflows │  │  Tools   │    │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │ │
│  │                                                              │ │
│  └────────────┬─────────────────────────────────────────────────┘ │
│               │                                                   │
│  ┌────────────▼─────────────────────────────────────────────────┐ │
│  │               PERSISTENCE LAYER                              │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │                                                              │ │
│  │  History/   │  Context/   │  Config/   │  Voice/            │ │
│  │  (Sessions, │  (Knowledge │  (Settings,│  (Recordings,      │ │
│  │   Learnings,│   Bases)    │   Hooks)   │   Responses)       │ │
│  │   Decisions)│             │            │                    │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Device Layer

**Purpose:** User interaction points across all platforms

**Components:**
- **Mobile Devices** (iOS/Android)
  - Telegram app for voice/text
  - Native browser for PWA
  - iOS Shortcuts for Siri integration

- **Desktop/Laptop**
  - Telegram web/app
  - Terminal CLI
  - Browser interface

- **Smart Devices**
  - Via Telegram on phone
  - Future: Direct integration

### 2. Interface Layer

**Purpose:** Translate device inputs into ARDEN requests

#### Telegram Bot (`api/telegram-bot.js`)
```javascript
Voice Message → Download → Transcribe → Process → Respond (text + voice)
Text Message → Process → Respond (text + optional voice)
```

**Features:**
- Voice message handling
- Text message processing
- User authentication
- Rate limiting
- Command routing

#### REST API (Future: `api/voice-server.js`)
```
POST /voice
  - Input: Audio file
  - Output: JSON response + audio

POST /chat
  - Input: Text message
  - Output: JSON response

GET /status
  - Output: System status
```

#### CLI (`bin/arden`)
```bash
arden "query" → Claude Code → Response
```

**Features:**
- Environment loading
- Context management
- Voice mode (planned)

### 3. Voice Processing Layer

#### Speech-to-Text Pipeline

```
Audio Input
  ↓
Format Detection (OGG, MP3, WAV, M4A)
  ↓
API Selection (Whisper, Deepgram, etc.)
  ↓
Transcription
  ↓
Text Output
```

**Providers:**
- **OpenAI Whisper** (default)
  - Accuracy: High
  - Speed: ~2-5 seconds
  - Cost: $0.006/minute
  - Languages: 99+

- **Deepgram** (alternative)
  - Accuracy: High
  - Speed: ~1-2 seconds (faster)
  - Cost: Similar
  - Languages: 30+

#### Text-to-Speech Pipeline

```
Text Input
  ↓
Length Optimization (for voice)
  ↓
Voice Selection (based on agent/context)
  ↓
API Call (ElevenLabs, OpenAI TTS, etc.)
  ↓
Audio Output
```

**Providers:**
- **ElevenLabs** (default)
  - Quality: Excellent
  - Voices: 1000+
  - Custom: Voice cloning available
  - Cost: ~$10-15/month

- **OpenAI TTS** (alternative)
  - Quality: Good
  - Voices: 6 built-in
  - Cost: $15/1M characters

### 4. Orchestration Layer

#### ARDEN Core Engine

Built on Claude Code CLI with custom extensions:

```
Request
  ↓
Hook: Session Start
  ↓
Context Loading (Skills, History, Config)
  ↓
Intent Recognition & Routing
  ↓
Skill/Agent Selection
  ↓
Execution
  ↓
Response Formatting (voice vs text)
  ↓
Hook: Post Tool Use
  ↓
Response
  ↓
Hook: Stop (session end)
```

#### Hooks System

**Session Lifecycle:**
```
session-start.sh
  → Load skills
  → Initialize tracking
  → Check routines
  → Set context

[User interaction happens]

post-tool-use.sh (after each action)
  → Log tool usage
  → Security validation
  → Audit trail

stop.sh
  → Save session
  → Extract learnings
  → Cleanup temp files
```

#### Routing Logic

```python
# Pseudo-code for routing
if user_query matches skill_pattern:
    load_skill()
    execute_workflow()
elif user_query matches agent_expertise:
    delegate_to_agent()
else:
    use_general_assistant()
```

### 5. Execution Layer

#### Skills System

```
skills/
├── skill-name/
    ├── SKILL.md              # Routing & definition
    ├── workflows/
    │   ├── workflow-1.md     # Procedure steps
    │   └── workflow-2.md
    ├── tools/
    │   ├── script-1.sh       # Executable tools
    │   └── script-2.py
    └── context/
        └── knowledge.md      # Domain knowledge
```

**Skill Loading:**
1. Session start hook scans `skills/`
2. Loads all `SKILL.md` files
3. Injects into Claude Code system prompt
4. Routes matching queries automatically

#### Agent System

**Agent Structure:**
```json
{
  "name": "strategist",
  "personality": ["analytical", "big-picture", "decisive"],
  "expertise": ["planning", "prioritization", "decision-making"],
  "voice_id": "VR6AewLTigWG4xSOukaG",
  "skills_loaded": ["daily-planning", "research"],
  "approach": "systematic"
}
```

**Agent Selection Flow:**
```
Query Analysis
  ↓
Match to Agent Expertise
  ↓
Load Agent Context + Skills
  ↓
Apply Agent Personality
  ↓
Execute with Agent Voice
```

#### Workflows

**Workflow Execution:**
```markdown
## Workflow: Morning Briefing

1. Gather Context
   - [ ] Check calendar
   - [ ] Load tasks
   - [ ] Review history

2. Analyze
   - [ ] Prioritize tasks
   - [ ] Identify conflicts
   - [ ] Calculate time blocks

3. Generate Output
   - [ ] Format for voice
   - [ ] Create recommendations
   - [ ] Return response
```

### 6. Persistence Layer

#### Directory Structure

```
~/ARDEN/
├── history/
│   ├── sessions/YYYY-MM-DD/
│   │   ├── session_HH-MM-SS.md
│   │   └── telegram_USER_ID.jsonl
│   ├── learnings/
│   │   └── YYYY-MM-DD_topic.md
│   ├── decisions/
│   │   └── YYYY-MM-DD_decision.md
│   ├── research/
│   │   └── topic/YYYY-MM-DD.md
│   └── security/
│       └── YYYY-MM-DD_audit.log
├── context/
│   ├── preferences.md
│   ├── goals.md
│   └── knowledge/
├── config/
│   ├── arden.json
│   └── hooks/
└── voice/
    ├── recordings/
    │   └── voice_TIMESTAMP.ogg (auto-delete after 7 days)
    └── responses/
        └── response_TIMESTAMP.mp3 (auto-delete after 7 days)
```

#### Data Flows

**Session Logging:**
```
Interaction
  ↓
Log to sessions/DATE/session_TIME.md
  ↓
Extract learnings (manual/automated)
  ↓
Store in learnings/DATE_topic.md
```

**Voice Processing:**
```
Voice Input
  ↓
Save to voice/recordings/
  ↓
Transcribe
  ↓
Process
  ↓
Generate TTS
  ↓
Save to voice/responses/
  ↓
Send to user
  ↓
Auto-delete after 7 days
```

## Data Flow Examples

### Example 1: Voice Message via Telegram

```
1. User sends voice message to Telegram bot
2. Bot receives voice file (OGG format)
3. Bot downloads to voice/recordings/
4. Bot calls OpenAI Whisper API
5. Whisper returns transcription
6. Bot logs interaction to history/
7. Bot executes Claude Code with transcribed text
8. Claude Code:
   - Loads skills from skills/
   - Matches to daily-planning skill
   - Executes morning-briefing workflow
   - Returns formatted response
9. Bot receives text response
10. Bot calls ElevenLabs TTS API
11. ElevenLabs returns audio (MP3)
12. Bot saves to voice/responses/
13. Bot sends both text and voice to user
14. Hook logs session to history/
15. After 7 days, voice files auto-delete
```

### Example 2: Morning Briefing Routine

```
1. Cron job triggers at 8:00 AM
2. Executes: arden "morning briefing"
3. Session start hook initializes
4. Loads daily-planning skill
5. Executes morning-briefing workflow:
   - Calls tools/parse-calendar.sh
   - Calls tools/analyze-tasks.py
   - Calls tools/generate-briefing.sh
6. Formats response for voice
7. Sends via Telegram notification
8. Logs session to history/
9. Stop hook saves learnings
```

## Security Architecture

### Defense Layers

```
┌─────────────────────────────────────────────┐
│  Layer 1: Configuration Hardening          │
│  - API token validation                    │
│  - User ID restrictions                    │
│  - Rate limiting                           │
└──────────────┬──────────────────────────────┘
               ↓
┌─────────────────────────────────────────────┐
│  Layer 2: Constitutional Defense           │
│  - System prompt restrictions              │
│  - Authorized source validation            │
│  - Instruction injection prevention        │
└──────────────┬──────────────────────────────┘
               ↓
┌─────────────────────────────────────────────┐
│  Layer 3: Pre-Execution Validation         │
│  - Command injection detection             │
│  - Path traversal prevention               │
│  - SSRF attempt blocking                   │
└──────────────┬──────────────────────────────┘
               ↓
┌─────────────────────────────────────────────┐
│  Layer 4: Audit & Logging                  │
│  - All actions logged to history/security/ │
│  - Anomaly detection                       │
│  - Forensic analysis capability            │
└─────────────────────────────────────────────┘
```

### Telegram Security

```json
{
  "telegram": {
    "allowed_users": [123456789],
    "rate_limit": {
      "window_ms": 900000,
      "max_requests": 100
    }
  }
}
```

**Enforcement:**
1. Bot checks user ID on every message
2. Rejects unauthorized users immediately
3. Tracks request rate per user
4. Logs all security events

## Scalability Considerations

### Current Design
- Single instance
- Single user (or small team)
- ~10-50 interactions/day
- ~$15/month cost

### Scaling Path

**Multi-user (10-100 users):**
- Add authentication system
- Separate history per user
- Per-user skill customization
- Estimated cost: ~$100-500/month

**High-volume (1000+ users):**
- Horizontal scaling of API servers
- Load balancer
- Caching layer (Redis)
- Queue system (RabbitMQ)
- Database instead of file storage
- Estimated cost: ~$1000+/month

## Performance Optimization

### Voice Processing
- Use Deepgram for faster STT (~50% faster)
- Cache common TTS responses
- Compress voice files
- Stream audio instead of batch

### Response Time
- Pre-load skills at session start (done)
- Cache frequently used contexts
- Parallel tool execution
- Asynchronous voice processing

### Cost Optimization
- Batch STT requests when possible
- Use OpenAI TTS instead of ElevenLabs (~50% cheaper)
- Implement local Whisper instance
- Cache TTS for common responses

## Future Architecture

### Planned Enhancements

**Real-time Voice:**
```
WebSocket Connection
  ↓
Stream Audio Chunks
  ↓
Real-time Transcription
  ↓
Streaming Response
  ↓
Real-time TTS
  ↓
Stream Audio Back
```

**MCP Server Integration:**
```
ARDEN
  ↓
MCP Server (Personal Data)
  ├── Calendar API
  ├── Tasks API
  ├── Notes API
  └── Analytics API
```

**Agent Swarms:**
```
Complex Query
  ↓
Spawn Multiple Agents in Parallel
  ├── Researcher (gathers data)
  ├── Analyst (processes data)
  └── Strategist (synthesizes)
  ↓
Consolidate Results
  ↓
Return Unified Response
```

## Deployment Options

### Local Development
```bash
cd ~/ARDEN/api
npm start
```

### Production (PM2)
```bash
pm2 start telegram-bot.js --name arden-bot
pm2 save
pm2 startup
```

### Docker (Future)
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "api/telegram-bot.js"]
```

### Cloud Hosting
- **Heroku:** Simple deployment
- **Railway:** Modern platform
- **DigitalOcean:** VPS control
- **AWS Lambda:** Serverless option

## Monitoring & Observability

### Metrics to Track
- Voice interactions/day
- STT accuracy rate
- Response latency (p50, p95, p99)
- API costs per interaction
- Skill usage frequency
- Error rates

### Logging
```
history/sessions/       - User interactions
history/security/       - Security events
pm2 logs               - Application logs
api/error.log          - Error details
```

### Health Checks
```bash
# Bot status
pm2 list

# API health
curl http://localhost:3000/health

# Voice providers
curl https://api.openai.com/v1/models
```

## Technical Decisions

### Why Telegram?
- ✅ Voice messages built-in
- ✅ Works on all platforms
- ✅ Free infrastructure
- ✅ Easy development
- ✅ Real-time delivery

### Why OpenAI Whisper?
- ✅ Best accuracy
- ✅ 99+ languages
- ✅ Affordable pricing
- ✅ Simple API

### Why ElevenLabs?
- ✅ Most natural voices
- ✅ Voice cloning option
- ✅ Emotion control
- ✅ Developer-friendly

### Why File-based Storage?
- ✅ Simple setup
- ✅ Easy to inspect
- ✅ Git-friendly (for non-sensitive)
- ✅ No database overhead
- ✅ Works for single user

---

**ARDEN Architecture v1.0**
*Built for simplicity, designed for scale*
