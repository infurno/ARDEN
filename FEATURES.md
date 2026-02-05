# ARDEN Features Documentation

Complete guide to all ARDEN features and capabilities.

---

## Table of Contents

1. [Web Dashboard](#web-dashboard)
2. [Discord Bot](#discord-bot)
3. [Telegram Bot](#telegram-bot)
4. [Session Management](#session-management)
5. [Notes System](#notes-system)
6. [Task Management](#task-management)
7. [AI Integration](#ai-integration)
8. [Analytics](#analytics)
9. [Voice Features](#voice-features)
10. [Skills System](#skills-system)

---

## Web Dashboard

**URL:** https://rocket.id10t.social  
**Authentication:** Token-based

### Pages

#### 1. Dashboard (`/dashboard.html`)
**Main system overview**

**Features:**
- System status indicator (online/offline)
- AI provider display (OpenAI/Ollama/etc)
- Current model information
- Notes count
- Active TODO count
- CPU usage (real-time)
- Memory usage (real-time)
- Disk usage
- System uptime
- Network stats

**Real-time Updates:**
- Metrics refresh every 5 seconds via WebSocket
- Color-coded status indicators (green/yellow/red)

#### 2. Chat Interface (`/chat.html`)
**Direct AI conversation**

**Features:**
- Full-screen chat interface
- Message history
- Markdown rendering
- Code syntax highlighting
- Copy code blocks
- Clear conversation
- Export chat history
- Typing indicators

**Keyboard Shortcuts:**
- `Enter` - Send message
- `Shift+Enter` - New line
- `Ctrl+L` - Clear chat

**Supported Formats:**
- Plain text
- Markdown
- Code blocks (with language detection)
- Lists and tables
- Links (auto-clickable)

#### 3. Notes Management (`/notes.html`)
**Personal knowledge base**

**Features:**
- Create/edit/delete notes
- Markdown editor with preview
- Live preview toggle
- File attachments (images, PDFs, etc)
- Search functionality
- Category organization
- Tags support
- Note linking (wiki-style)
- Export as Markdown/HTML/PDF

**Editor Features:**
- Syntax highlighting
- Auto-save (every 30 seconds)
- Version history
- Spell check
- Word count
- Character count

**Keyboard Shortcuts:**
- `Ctrl+S` - Save note
- `Ctrl+B` - Bold
- `Ctrl+I` - Italic
- `Ctrl+K` - Insert link
- `Ctrl+F` - Search

#### 4. TODO Management (`/todos.html`)
**Task tracking system**

**Features:**
- Create/edit/delete tasks
- Priority levels (High/Medium/Low)
- Due dates
- Categories/Projects
- Completion tracking
- Progress visualization
- Recurring tasks
- Subtasks
- Task dependencies

**Views:**
- List view
- Kanban board
- Calendar view
- Today's tasks
- Overdue tasks
- Completed tasks

**Filters:**
- By priority
- By category
- By due date
- By status

#### 5. Session Management (`/sessions.html`) ⭐ NEW
**Monitor and manage active sessions**

**Statistics Cards:**
- Total sessions count
- Active sessions (activity within 5 min)
- Idle sessions (no activity >5 min)
- Web sessions count
- Telegram sessions count
- Discord sessions count

**Sessions Table:**
- Session ID (truncated with tooltip)
- User ID
- Source platform (Web/Telegram/Discord)
- Status (Active/Idle badge)
- Created timestamp
- Last activity timestamp
- Duration (in minutes)
- Message count
- Kill button (disabled for current session)

**Actions:**
- 🔄 Refresh - Reload session list
- 🧹 Cleanup Expired - Remove expired sessions
- ⚠️ Kill All Sessions - Terminate all (except current)
- 🗑️ Kill - Terminate individual session

**Features:**
- Auto-refresh every 10 seconds
- Current session highlighted (blue background)
- Confirmation modals for destructive actions
- Relative time display ("5m ago", "2h ago")
- Protection against self-termination

**Use Cases:**
- Free up memory by killing idle sessions
- Monitor platform usage (Web vs Bots)
- Track conversation duration
- Security: See who's accessing ARDEN

#### 6. Skills Management (`/skills.html`)
**Configure AI capabilities**

**Built-in Skills:**
- Weather lookup
- Note taking
- TODO management
- Web search
- Calendar integration
- Code execution
- File operations

**Custom Skills:**
- Create custom skills (JSON format)
- Upload skill definitions
- Enable/disable skills
- Configure skill parameters
- Test skills

#### 7. Analytics (`/analytics.html`)
**Usage statistics and insights**

**Metrics:**
- Total conversations
- Messages per day
- Average response time
- Token usage (by model)
- API costs
- Most used features
- Peak usage times
- Session duration stats

**Visualizations:**
- Line charts (usage over time)
- Bar charts (feature usage)
- Pie charts (platform distribution)
- Heatmaps (activity patterns)

**Export:**
- CSV download
- JSON export
- PDF reports

#### 8. Settings (`/settings.html`)
**System configuration**

**General Settings:**
- Default AI model
- Response length
- Temperature setting
- System prompt customization
- Language preference

**Voice Settings:**
- STT provider (Whisper/Deepgram)
- TTS provider (ElevenLabs/Edge TTS)
- Voice selection
- Audio quality

**Notification Settings:**
- Email notifications
- Desktop notifications
- Sound alerts

**Security Settings:**
- Change API token
- Two-factor authentication
- Session timeout
- IP whitelist

---

## Discord Bot

**Bot Name:** ARDEN BOT#6497  
**Platform:** Discord  
**Documentation:** [Discord Setup Guide](DISCORD_SETUP.md)

### Features

#### Direct Messages (DMs)
Send any message directly to the bot:

```
Hello ARDEN!
What's the weather like?
Help me write a blog post about AI
```

No prefix needed in DMs.

#### Server Channels
Mention the bot to get a response:

```
@ARDEN BOT what's 2+2?
@ARDEN BOT explain quantum computing
```

Bot only responds when mentioned to avoid spam.

#### Commands

**!help** - Display help message
```
!help
```
Shows available commands and usage instructions.

**!status** - Bot status
```
!status
```
Shows:
- Online/offline status
- AI provider and model
- Voice capabilities
- Uptime

**!ping** - Check latency
```
!ping
```
Returns ping time in milliseconds.

**!clear** - Clear conversation history
```
!clear
```
Clears your conversation context.

### Advanced Features

#### Rate Limiting
- 10 messages per minute per user
- Prevents spam and abuse
- Automatic cooldown notification

#### Message Chunking
- Long responses automatically split into multiple messages
- Discord 2000 character limit handled transparently
- Maintains formatting across chunks

#### Typing Indicators
- Shows "ARDEN BOT is typing..." while processing
- Improves user experience

#### Authorization
Configure allowed users in `config/arden.json`:

```json
{
  "discord": {
    "enabled": true,
    "allowed_users": [
      "123456789012345678",
      "987654321098765432"
    ]
  }
}
```

Leave empty array `[]` to allow everyone.

### Bot Status
Custom status message:
```
Watching your messages | !help
```

Activity type can be:
- Playing (type 0)
- Streaming (type 1)
- Listening (type 2)
- Watching (type 3)

---

## Telegram Bot

**Token:** 8539230249:AAEUz83RgvKjIoRduHzbI7zPSbZ_UVxhqyc  
**Platform:** Telegram

### Features

#### Voice Messages
Send voice messages for transcription and AI response:
1. Record voice message in Telegram
2. Send to ARDEN bot
3. Bot transcribes using Whisper
4. AI processes and responds
5. Optional: TTS voice response

#### Text Messages
Regular text conversation:
```
What's on my schedule today?
Summarize this article: [paste URL]
```

#### Commands
- `/start` - Welcome message
- `/help` - Show help
- `/status` - Bot status
- `/clear` - Clear history

#### File Support
- Send documents for analysis
- Image recognition
- PDF text extraction

---

## Session Management

**Location:** Web Dashboard → Sessions  
**API:** `/api/sessions`

### Endpoints

#### GET /api/sessions
List all active sessions:

```json
{
  "success": true,
  "sessions": [
    {
      "sessionId": "discord-123456...",
      "userId": "123456789",
      "source": "discord",
      "authenticated": true,
      "createdAt": 1736294400000,
      "lastActivity": 1736298000000,
      "durationMinutes": 60,
      "idleMinutes": 5,
      "isIdle": true,
      "messageCount": 42,
      "isCurrent": false
    }
  ],
  "stats": {
    "total": 5,
    "active": 2,
    "idle": 3,
    "web": 2,
    "telegram": 1,
    "discord": 2
  }
}
```

#### DELETE /api/sessions/:sessionId
Kill specific session:

```bash
curl -X DELETE https://rocket.id10t.social/api/sessions/abc123
```

Returns:
```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

#### DELETE /api/sessions
Kill all sessions except current:

```bash
curl -X DELETE https://rocket.id10t.social/api/sessions
```

Returns:
```json
{
  "success": true,
  "message": "3 session(s) deleted successfully",
  "deletedCount": 3
}
```

#### POST /api/sessions/cleanup
Clean up expired sessions:

```bash
curl -X POST https://rocket.id10t.social/api/sessions/cleanup
```

### Session States

**Active Session:**
- Last activity within 5 minutes
- Green badge
- Currently processing messages

**Idle Session:**
- No activity for >5 minutes
- Yellow badge
- Maintaining context but inactive
- Can be safely killed

**Expired Session:**
- Expired (>24 hours old)
- Automatically cleaned up
- Not shown in active list

### Memory Management

**Why Kill Sessions?**
- Each session consumes memory
- Idle sessions waste resources
- Kill idle sessions to free memory
- Helps prevent VPS memory exhaustion

**Best Practices:**
- Kill idle sessions daily
- Run cleanup weekly
- Monitor memory usage
- Set session timeout in config

---

## Notes System

**Location:** Web Dashboard → Notes  
**Storage:** SQLite database  
**Format:** Markdown

### Creating Notes

```markdown
# My Note Title

## Section 1

Content here with **bold** and *italic* text.

- List item 1
- List item 2

## Section 2

[Link to another note](note://other-note-id)

![Image](attachment://image.png)
```

### Organization

**Categories:**
- Personal
- Work
- Projects
- Reference
- Archive

**Tags:**
```markdown
tags: #programming #python #tutorial
```

**Links:**
```markdown
See also: [[Related Note Title]]
```

### Attachments

Supported types:
- Images (PNG, JPG, GIF)
- Documents (PDF, DOCX, TXT)
- Code files (JS, PY, etc)
- Audio files (MP3, WAV)

Upload via:
- Drag and drop
- File picker
- Paste from clipboard

Storage: `/home/arden/Notes/attachments/`

### Search

**Full-text search:**
- Search titles
- Search content
- Search tags
- Search attachments

**Filters:**
- By category
- By tag
- By date
- By author

---

## Task Management

**Location:** Web Dashboard → TODOs  
**Storage:** SQLite database

### Task Fields

```json
{
  "id": "uuid",
  "title": "Task description",
  "description": "Detailed notes",
  "priority": "high|medium|low",
  "status": "pending|in_progress|completed|cancelled",
  "dueDate": "2026-01-15",
  "category": "Work",
  "tags": ["urgent", "meeting"],
  "subtasks": [],
  "dependencies": [],
  "createdAt": "2026-01-07",
  "completedAt": null
}
```

### Priority Levels

**High (Red):**
- Urgent and important
- Due soon
- Blocking other tasks

**Medium (Yellow):**
- Important but not urgent
- Scheduled work
- Standard priority

**Low (Green):**
- Nice to have
- Low urgency
- Background tasks

### Recurring Tasks

**Daily:**
```
Daily standup meeting
```

**Weekly:**
```
Weekly report (every Monday)
```

**Monthly:**
```
Monthly review (1st of month)
```

### Task Dependencies

```
Task A → Task B → Task C
```

Task B can't start until Task A is complete.

---

## AI Integration

**Current Provider:** OpenAI  
**Current Model:** gpt-4o-mini  
**Configuration:** `.env` file

### Supported Providers

#### OpenAI
```bash
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-...
```

**Models:**
- gpt-4o-mini (recommended)
- gpt-4o
- gpt-3.5-turbo

#### Ollama (Local)
```bash
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
OLLAMA_URL=http://localhost:11434
```

**Models:**
- llama3.2
- mistral
- codellama
- phi

#### Anthropic Claude
```bash
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
```

**Models:**
- claude-3-opus
- claude-3-sonnet
- claude-3-haiku

### Context Management

**Conversation History:**
- Maintains context across messages
- Stored in SQLite
- 50 messages default
- Configurable limit

**System Prompt:**
Customizable in settings:
```
You are ARDEN, a helpful AI assistant...
```

**Temperature:**
- 0.0 - Deterministic
- 0.7 - Balanced (default)
- 1.0 - Creative

---

## Analytics

**Location:** Web Dashboard → Analytics

### Tracked Metrics

#### Usage Stats
- Total messages
- Messages per day
- Active users
- Sessions per day
- Average session duration

#### AI Performance
- Response time (avg/min/max)
- Token usage
- API costs
- Error rate
- Success rate

#### Platform Distribution
- Web usage %
- Discord usage %
- Telegram usage %
- Peak hours
- Geographic distribution

#### Feature Usage
- Most used skills
- Note creation frequency
- TODO completion rate
- Search queries
- Voice message count

### Reports

**Daily Report:**
- Yesterday's activity
- Top conversations
- System health

**Weekly Report:**
- 7-day trends
- Usage patterns
- Cost analysis

**Monthly Report:**
- Full month summary
- Comparisons
- Recommendations

---

## Voice Features

**Status:** Enabled  
**STT:** local-whisper  
**TTS:** edge-tts

### Speech-to-Text (STT)

#### Local Whisper
- Runs on server
- Free
- Offline capable
- Multiple languages
- Accuracy: Good

#### OpenAI Whisper (Cloud)
```bash
# In .env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

- Fast
- Very accurate
- Cost: $0.006/min
- 100+ languages

#### Deepgram
```bash
DEEPGRAM_API_KEY=...
```

- Real-time
- Very fast
- Cost: $0.0043/min
- Good accuracy

### Text-to-Speech (TTS)

#### Edge TTS (Free)
```json
{
  "tts_provider": "edge-tts",
  "tts_config": {
    "voice": "en-US-AndrewNeural"
  }
}
```

**Voices:**
- en-US-AndrewNeural (male)
- en-US-AriaNeural (female)
- en-GB-RyanNeural (British male)
- Many more languages

#### ElevenLabs (Premium)
```bash
ELEVENLABS_API_KEY=...
```

**Features:**
- Ultra-realistic
- Voice cloning
- Emotion control
- Cost: ~$5-50/month

### Supported Formats
- Audio input: OGG, MP3, WAV, M4A
- Audio output: MP3, OGG
- Max duration: 5 minutes
- Sample rate: 16kHz-48kHz

---

## Skills System

**Location:** Web Dashboard → Skills  
**Storage:** `config/skills/`

### Built-in Skills

#### Weather
Get current weather and forecasts:

```
What's the weather in San Francisco?
```

#### Note Taking
Create/manage notes via conversation:

```
Create a note about Python decorators
Add to my project notes: [content]
```

#### Web Search
Search the web for information:

```
Search for latest news on AI
Find documentation for Express.js
```

#### Calendar
Manage events and reminders:

```
Add meeting tomorrow at 2pm
What's on my schedule?
```

### Custom Skills

Create skills with JSON:

```json
{
  "name": "stock-lookup",
  "description": "Look up stock prices",
  "trigger": "stock price",
  "endpoint": "https://api.stocks.com/quote",
  "parameters": {
    "symbol": "required"
  },
  "response_format": "{symbol}: ${price}"
}
```

Upload via Skills page.

### Skill Execution

**Logs:**
- Execution time
- Success/failure
- Parameters used
- Response received

**Statistics:**
- Most used skills
- Average execution time
- Success rate

---

## API Reference

### Authentication

All API requests require authentication header:

```bash
curl -H "Authorization: Bearer myapp-8kX2mN9pQr4vL7wY3sT6hJ1nB5cF0dG8" \
  https://rocket.id10t.social/api/status
```

### Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Authenticate user |
| `/api/chat` | POST | Send chat message |
| `/api/notes` | GET | List notes |
| `/api/notes` | POST | Create note |
| `/api/notes/:id` | PUT | Update note |
| `/api/notes/:id` | DELETE | Delete note |
| `/api/todos` | GET | List todos |
| `/api/todos` | POST | Create todo |
| `/api/todos/:id` | PUT | Update todo |
| `/api/todos/:id` | DELETE | Delete todo |
| `/api/sessions` | GET | List sessions |
| `/api/sessions/:id` | DELETE | Kill session |
| `/api/sessions` | DELETE | Kill all sessions |
| `/api/analytics` | GET | Get analytics |
| `/api/skills` | GET | List skills |
| `/api/status` | GET | System status |

---

## Keyboard Shortcuts

### Global
- `Ctrl+/` - Show shortcuts help
- `Ctrl+K` - Quick search

### Chat
- `Enter` - Send message
- `Shift+Enter` - New line
- `Ctrl+L` - Clear chat
- `Ctrl+↑` - Previous message
- `Ctrl+↓` - Next message

### Notes
- `Ctrl+S` - Save
- `Ctrl+B` - Bold
- `Ctrl+I` - Italic
- `Ctrl+K` - Link
- `Ctrl+F` - Find

### TODOs
- `Ctrl+N` - New task
- `Ctrl+E` - Edit task
- `Space` - Toggle complete
- `Del` - Delete task

---

**Last Updated:** January 7, 2026
