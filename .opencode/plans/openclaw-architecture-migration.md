# ARDEN OpenClaw Architecture Migration Plan

## Status
- Phase 0 (Git checkpoint): PARTIALLY COMPLETE
  - [x] Committed untracked daily-planning files
  - [x] Tagged HEAD as `v1.0-pre-openclaw`
  - [x] Created `feature/openclaw-architecture` branch (currently checked out)

## What This Plan Implements

Based on the OpenClaw 4-pillar architecture model:

1. **Memory System** - SOUL.md, USER.md, MEMORY.md, AGENTS.md, HEARTBEAT.md identity files + hybrid search (0.7 vector + 0.3 BM25) via SQLite + FastEmbed (384-dim ONNX)
2. **Heartbeat** - Python daemon every 30 min, pulls Gmail + Calendar, Claude reasons over data, sends proactive notifications
3. **Adapters** - Add Slack (Socket Mode) + Terminal CLI adapter, refactor existing Telegram/Discord/Web into common interface
4. **Skills Registry** - Formalize drop-in SKILL.md discovery, scaffold new skill types

## Phase 1a: Identity Files

Create 5 markdown files at project root:

### SOUL.md
- Core identity: name, role, architecture description
- Core values: privacy-first, proactive, honest/direct, always-learning, autonomous when appropriate
- Personality traits: concise, competent, anticipatory, reliable, adaptive
- Communication style rules
- Boundaries and hierarchy: SOUL.md > USER.md > AGENTS.md > conversation context

### USER.md
- Migrate content from existing `~/Notes/profile.md`
- Personal info: Hal Borland, Strategic Engineer of Infrastructure, FedEx Freight, NW Arkansas
- Technologies: K3S, VMware, Azure, Docker, Arch Linux, Python, Node.js
- Preferences: concise technical responses, local-first, Obsidian vault, voice via Telegram
- Interests: Linux, homelab, 3D printing, gaming, infra automation, AI/ML

### MEMORY.md
- Decisions log (dated entries with context)
- Lessons learned log
- Important long-lived context (ARDEN infrastructure details, architecture history)
- Conversation highlights section
- Seed with migration decisions made today

### AGENTS.md
- 5 agent personas: Strategist, Researcher, Engineer, Analyst, Assistant (default)
- Routing rules: explicit selection > skill detection > context inference > default
- Memory access permissions (all agents share memory, can read all files, write to MEMORY.md/USER.md)
- Adapter-specific behavior (Telegram=brief voice, Discord=threaded, Web=rich markdown, Slack=threaded, Terminal=pipe-friendly)

### HEARTBEAT.md
- Schedule: every 30 min, 06:00-22:00 CT
- Gmail: unread inbox, notify on urgent/key contacts/action-required >2hr
- Calendar: upcoming 2hr window, notify on prep gaps/double-books/cancellations
- Notification preferences: primary Telegram, fallback web push, quiet during meetings
- Reasoning instructions for Claude: summarize > identify urgent > decide notify/silent > log

### Integration Changes
- Update `api/services/context-loader.js`:
  - Load SOUL.md, USER.md, MEMORY.md, AGENTS.md from project root (not ~/Notes)
  - Keep backward compatibility with `~/Notes/openai-context.md` as fallback
  - Priority order: SOUL.md first (identity), then USER.md (personalization), then MEMORY.md context
- Update `api/services/memory-manager.js`:
  - Add functions to write to MEMORY.md (addDecision, addLesson)
  - Keep existing openai-context.md functions for backward compatibility
  - Add function to update USER.md fields

## Phase 1b: Hybrid Search Engine (Python)

### New Directory: `memory/`

```
memory/
  __init__.py
  embedder.py        # FastEmbed wrapper (all-MiniLM-L6-v2, 384-dim, ONNX)
  search.py          # Hybrid search: 0.7 * cosine_sim + 0.3 * bm25_score
  ingest.py          # Ingest markdown files + daily logs into search index
  server.py          # Lightweight HTTP API (Flask/FastAPI) for Node.js to call
  requirements.txt   # fastembed, sqlite-vec, flask
  setup.sh           # Create venv, install deps
```

### SQLite Schema (extends existing data/arden.db or new data/memory.db)
```sql
-- Document chunks
CREATE TABLE documents (
    id INTEGER PRIMARY KEY,
    source_file TEXT NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vector embeddings (sqlite-vec)
CREATE VIRTUAL TABLE embeddings USING vec0(
    document_id INTEGER PRIMARY KEY,
    embedding float[384]
);

-- BM25 full-text search (FTS5)
CREATE VIRTUAL TABLE documents_fts USING fts5(
    chunk_text,
    source_file,
    content=documents,
    content_rowid=id
);
```

### Search Flow
1. Query comes in from Node.js (via HTTP to Python server or subprocess)
2. Embed query with FastEmbed (local, zero API calls)
3. Vector search: top-20 by cosine similarity
4. BM25 search: top-20 by keyword relevance
5. Combine: 0.7 * vector_score + 0.3 * bm25_score
6. Return top-K results with source file, chunk text, score

### What Gets Indexed
- SOUL.md, USER.md, MEMORY.md, AGENTS.md, HEARTBEAT.md
- All files in `daily/` session logs
- All skill SKILL.md files
- Optionally: recent notes from ~/Notes (configurable)

## Phase 1c: Daily Session Logs

### New Directory: `daily/`
- One file per day: `daily/2026-02-13.md`
- Auto-created at start of first conversation each day
- Sections: Conversations, Decisions Made, Learnings, TODOs Created, Skills Used
- Ingested into hybrid search index nightly (or on-demand)

### Integration
- Update `api/handlers/messages.js` to log conversation summaries to daily file
- Update memory-manager to write decisions/learnings to both MEMORY.md and daily log
- Add ingest trigger to re-index when daily log is updated

## Phase 2: Heartbeat System (Python)

### New Directory: `heartbeat/`

```
heartbeat/
  main.py             # Entry point + scheduler (APScheduler)
  config.py           # Reads HEARTBEAT.md, parses schedule/source config
  sources/
    __init__.py
    gmail.py           # Gmail API (OAuth2 read-only)
    calendar.py        # Google Calendar API
  reasoner.py          # Anthropic API call: summarize data, decide notifications
  notifier.py          # Route notifications to adapters (HTTP calls to ARDEN API)
  requirements.txt     # anthropic, google-api-python-client, google-auth-oauthlib, apscheduler
  setup.sh             # Create venv, install deps, guide OAuth setup
  credentials/         # .gitignored - OAuth tokens stored here
```

### Heartbeat Loop (every 30 min, 06:00-22:00 CT)
1. Read HEARTBEAT.md for current config
2. For each enabled source: gather data
   - Gmail: fetch unread messages (subject, sender, date, snippet)
   - Calendar: fetch events in next 2 hours
3. Build context prompt with gathered data
4. Call Claude (Anthropic API) to reason:
   - "Given this data and the user's preferences in HEARTBEAT.md, what needs attention?"
5. If notification needed: POST to ARDEN's existing `/api/chat` or adapter-specific endpoint
6. Log result to `daily/YYYY-MM-DD.md` under Heartbeat section
7. If nothing to report: log `HEARTBEAT_OK` silently

### PM2 Integration
- Add `arden-heartbeat` to `ecosystem.config.js`
- Runs as Python process: `python heartbeat/main.py`
- Restart on failure, log to `logs/heartbeat.log`

## Phase 3a: Adapter Interface

### Refactor into `api/adapters/`

```
api/adapters/
  base.js              # Abstract adapter: receiveMessage(), sendResponse(), getThreadContext()
  telegram.js          # Extract from api/telegram-bot.js
  discord.js           # Extract from api/discord-bot.js
  web.js               # Extract from api/web-server.js (WebSocket + REST)
  slack.js             # NEW: Slack Socket Mode
  terminal.js          # NEW: CLI direct interaction
  index.js             # Adapter registry: load, initialize, route
```

### Base Adapter Interface
```javascript
class BaseAdapter {
  constructor(name, config) { ... }
  async initialize() { ... }           // Connect to platform
  async receiveMessage(msg) { ... }    // Normalize incoming message
  async sendResponse(msg, response) { ... }  // Send to platform
  async getThreadContext(threadId) { ... }    // Get conversation history
  async shutdown() { ... }             // Graceful disconnect
}
```

### Refactoring Approach
- Extract platform-specific code from telegram-bot.js, discord-bot.js, web-server.js into adapter classes
- Keep the existing entry points (telegram-bot.js, etc.) as thin wrappers that instantiate adapters
- Shared message handling stays in api/handlers/messages.js
- All adapters share the same AI provider, memory, and skill systems

## Phase 3b: Slack Adapter

- Use `@slack/bolt` package (Socket Mode)
- No public URL needed -- connects via WebSocket to Slack
- Each Slack thread = persistent conversation in ARDEN
- Message format: plain text + optional blocks for structured data
- Config in `config/arden.json` under `slack` section
- Env vars: `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, `SLACK_SIGNING_SECRET`

## Phase 3c: Terminal Adapter

- Direct stdin/stdout interaction
- Launch: `./bin/arden chat` or `./bin/arden --one-shot "what's my next meeting?"`
- Full skill + hook access
- Pipe-friendly output (no ANSI colors in pipe mode)
- Useful for cron jobs, scripts, and direct Claude Code-style interaction

## Phase 4: Skills Registry

### Formalize Skill Discovery
Update `api/services/skill-executor.js`:
1. At boot: scan `skills/*/SKILL.md` for all skills
2. Parse SKILL.md for: name, triggers, tools, dependencies, agent preferences
3. Build skill registry in memory
4. Match incoming messages against skill triggers
5. Execute matched skill's tools

### SKILL.md Standard Format
```markdown
# Skill Name

## Purpose
One-line description

## Triggers
- keyword patterns that activate this skill

## Tools
- tool-name.sh: description

## Dependencies
- what this skill needs (curl, python, API keys, etc.)

## Agent Preferences
- Which agents work best with this skill
```

### Formalize Existing 6 Skills
- Update each SKILL.md to follow the standard format
- Ensure each has: SKILL.md + tools/ + workflows/ + context/ directories

### Scaffold New Skills (empty structure)
- `skills/content-engine/SKILL.md`
- `skills/direct-integrations/SKILL.md`
- `skills/yt-script/SKILL.md`
- `skills/pptx-generator/SKILL.md`
- `skills/excalidraw-diagram/SKILL.md`

## Phase 5: Integration & Wiring

1. Update `config/arden.json`:
   - Add `slack` section (enabled, tokens, etc.)
   - Add `heartbeat` section (enabled, interval, sources)
   - Add `memory` section (search_enabled, index_dirs, etc.)
   - Update `context.directories` to include project root for identity files

2. Update `ecosystem.config.js`:
   - Add `arden-heartbeat` process (Python)
   - Optionally add `arden-slack` process (or run within web server)

3. Update system prompt in `api/services/ai-providers.js`:
   - Include SOUL.md content as primary identity
   - Include USER.md for personalization
   - Include relevant MEMORY.md context (via hybrid search)
   - Reference AGENTS.md for behavioral guidance

4. Update deployment:
   - `ansible/` roles for Python dependencies
   - `scripts/setup.sh` for memory and heartbeat venv setup
   - Update `README.md` with new architecture overview

5. Add to `.gitignore`:
   - `heartbeat/credentials/`
   - `memory/__pycache__/`
   - `data/memory.db` (or keep it tracked -- TBD)
   - `daily/` (or track it -- these are valuable logs)

## Execution Order

| Phase | What | Effort | Dependencies |
|-------|------|--------|-------------|
| 1a | Identity files (5 .md files) | 30 min | None |
| 1a+ | Update context-loader.js + memory-manager.js | 1 hr | 1a |
| 1b | Hybrid search engine (Python) | 2-3 hrs | Python env |
| 1c | Daily session logs + ingest | 1 hr | 1a, 1b |
| 2 | Heartbeat system (Python) | 2-3 hrs | 1a (HEARTBEAT.md) |
| 3a | Adapter interface refactor | 2 hrs | None |
| 3b | Slack adapter | 1 hr | 3a |
| 3c | Terminal adapter | 1 hr | 3a |
| 4 | Skills registry formalization | 1-2 hrs | None |
| 5 | Integration + config + PM2 | 1 hr | All above |

## Notes

- Current branch: `feature/openclaw-architecture`
- Pre-migration tag: `v1.0-pre-openclaw`
- All new Python code in separate directories with own venvs
- Existing Node.js code refactored in-place (no rewrite)
- Backward compatibility maintained throughout
