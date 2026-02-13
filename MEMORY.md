# MEMORY - Decisions, Lessons & Long-Term Context

> ARDEN's long-term memory. Decisions made, lessons learned, important context.
> This file grows over time as ARDEN learns from interactions.
> Searchable via hybrid search (vector + BM25).

## Decisions

<!-- Format: - [YYYY-MM-DD] Decision: <what was decided> | Context: <why> -->

- [2026-02-13] Decision: Migrate ARDEN to OpenClaw architecture (4 pillars: Memory, Heartbeat, Adapters, Skills) | Context: Upgrade from flat markdown memory to hybrid search, add proactive heartbeat, formalize adapters and skills registry
- [2026-02-13] Decision: Use Python for heartbeat + memory search engine | Context: FastEmbed ONNX for local embeddings, Claude Agent SDK for heartbeat reasoning
- [2026-02-13] Decision: Start with Gmail + Calendar for heartbeat sources | Context: Most impactful data sources; Asana/Slack can be added later
- [2026-02-13] Decision: Save pre-migration state as v1.0-pre-openclaw tag | Context: Preserve working state before architectural changes
- [2026-02-13] Decision: Use BAAI/bge-small-en-v1.5 for FastEmbed model | Context: all-MiniLM-L6-v2 not supported in current fastembed version
- [2026-02-13] Decision: Load dotenv at top of terminal adapter | Context: Environment variables must be loaded before ai-providers.js imports to respect AI_PROVIDER setting
- [2026-02-13] Decision: Create generic IMAP client for email sources | Context: ProtonMail requires Bridge (IMAP), can reuse for other providers
- [2026-02-13] Decision: Add ProtonMail Bridge integration | Context: ProtonMail is E2E encrypted, Bridge provides local IMAP interface
- [2026-02-13] Decision: Build new web UI pages for OpenClaw features | Context: Need search interface, identity file editor, daily log browser
- [2026-02-13] Decision: Use systemd user service for ProtonMail Bridge | Context: Bridge must be running before heartbeat starts, auto-start on boot

## Lessons

<!-- Format: - [YYYY-MM-DD] Lesson: <what was learned> | Source: <where> -->

- [2026-02-13] Lesson: Python virtual environments in PM2 require explicit interpreter path | Source: arden-memory and arden-heartbeat failing until ecosystem.config.js updated to use venv Python
- [2026-02-13] Lesson: FastEmbed model names must be validated against supported list | Source: all-MiniLM-L6-v2 not supported, had to switch to BAAI/bge-small-en-v1.5
- [2026-02-13] Lesson: Module import order matters for environment variables | Source: ai-providers.js loads AI_PROVIDER at import time, must load dotenv before any imports in terminal adapter
- [2026-02-13] Lesson: ProtonMail requires Bridge for programmatic access | Source: Attempted direct API access, learned Bridge is the only supported method for automation
- [2026-02-13] Lesson: PM2 processes need separate virtual environment interpreters | Source: Each Python service (memory, heartbeat) has its own venv with different dependencies
- [2026-02-13] Lesson: Web UI navigation must be updated across all pages | Source: Added new pages (search, identity, logs) but old pages still had old nav links

## Important Context

<!-- Long-lived context that doesn't fit in USER.md or SOUL.md -->

### ARDEN Infrastructure
- **Repository**: github.com/infurno/ARDEN
- **Server**: 192.168.4.57 (LAN) / 100.115.162.26 (Tailscale)
- **Branch**: feature/openclaw-architecture
- **Process Manager**: PM2 (5 processes)
  - arden-bot (Telegram): Port 3000
  - arden-web: Port 3001
  - arden-memory (Python): Port 3002
  - arden-heartbeat (Python): No port
  - arden-discord: Gateway connection
- **Database**: SQLite at data/arden.db (sessions, chat_messages, skill_executions, api_usage)
- **AI Providers**: Claude, OpenAI, Ollama, Gemini, Groq, LM Studio (configurable via AI_PROVIDER env)
- **Memory Search**: Flask server on port 3002 with hybrid vector + BM25 search
- **Heartbeat Sources**: Gmail, Google Calendar, ProtonMail (IMAP via Bridge on 1143)
- **Python Services**: Each has isolated virtual environment (memory/.venv, heartbeat/.venv)

### Architecture History
- v1.0 (pre-openclaw): Node.js monolith with Telegram + Discord + Web adapters, flat markdown memory (tagged: v1.0-pre-openclaw)
- v2.0 (current): OpenClaw 4-pillar architecture - COMPLETE
  - Pillar 1: Hybrid search memory (FastEmbed + BM25) with identity files
  - Pillar 2: Heartbeat daemon (Gmail, Calendar, ProtonMail via IMAP)
  - Pillar 3: 5 unified adapters (Telegram, Discord, Web, Slack, Terminal)
  - Pillar 4: Auto-discoverable skills registry with YAML frontmatter
- Web UI v2: Search, Identity editor, Daily logs browser, OpenClaw dashboard

## Conversation Highlights

<!-- ARDEN adds notable conversation outcomes here -->

- [2026-02-13] Successfully restarted entire system after Memory and Heartbeat were offline
  - Fixed: Python virtual environment interpreters in PM2 config
  - Fixed: FastEmbed model compatibility (switched to BAAI/bge-small-en-v1.5)
  - Fixed: Terminal adapter environment loading order
  - Status: All 5 PM2 processes now online
  
- [2026-02-13] Built ProtonMail Bridge integration for encrypted email monitoring
  - Created IMAP client module (reusable for any IMAP provider)
  - Created automated setup script with systemd service
  - Bridge runs on localhost:1143 (IMAP) and :1025 (SMTP)
  
- [2026-02-13] Completed Web UI v2 with OpenClaw features
  - New pages: search.html (hybrid memory search), identity.html (SOUL/USER/MEMORY editor), daily-logs.html (calendar browser)
  - Updated navigation across all existing pages
  - Added real-time status cards for Memory and Heartbeat

---
*Auto-updated by ARDEN. Indexed by hybrid search engine.*
*Last updated: 2026-02-13 (comprehensive update post-OpenClaw migration completion)*
