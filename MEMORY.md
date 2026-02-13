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

## Lessons

<!-- Format: - [YYYY-MM-DD] Lesson: <what was learned> | Source: <where> -->

## Important Context

<!-- Long-lived context that doesn't fit in USER.md or SOUL.md -->

### ARDEN Infrastructure
- **Repository**: github.com/infurno/ARDEN
- **Server**: 192.168.4.57 (LAN) / 100.115.162.26 (Tailscale)
- **Web Interface**: Port 3001
- **Telegram Bot**: Port 3000
- **Process Manager**: PM2 (3 processes: arden-bot, arden-discord, arden-web)
- **Database**: SQLite at data/arden.db (sessions, chat_messages, skill_executions, api_usage)
- **AI Providers**: Claude, OpenAI, Ollama, Gemini, Groq, LM Studio (configurable)

### Architecture History
- v1.0: Node.js monolith with Telegram + Discord + Web adapters, flat markdown memory
- v2.0 (in progress): OpenClaw 4-pillar architecture with hybrid search, heartbeat, formalized adapters and skills

## Conversation Highlights

<!-- ARDEN adds notable conversation outcomes here -->

---
*Auto-updated by ARDEN. Indexed by hybrid search engine.*
*Last updated: 2026-02-13*
