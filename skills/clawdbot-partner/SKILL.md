---
name: clawdbot-partner
version: 1.0.0
enabled: true
triggers:
  - "clawdbot"
  - "send message"
  - "delegate to clawdbot"
patterns:
  - "(?:send|message|whatsapp|telegram|discord|slack)\\s+(.+?)(?:\\s+via\\s+clawdbot)?$"
  - "(?:clawdbot)\\s+(?:send|message)\\s+(.+)$"
  - "(?:ask|tell)\\s+clawdbot\\s+to\\s+(.+)$"
  - "(?:delegate|forward)\\s+(.+?)\\s+to\\s+clawdbot$"
entry: tools/execute-clawdbot.sh
timeout: 30000
agents: [assistant, strategist]
---

# Clawdbot Partnership Skill

## Overview
Enables bidirectional partnership between ARDEN and Clawdbot for collaborative AI assistance across multiple platforms and capabilities.

## Partnership Model
ARDEN and Clawdbot work as AI collaborators:
- **ARDEN**: Voice interface, daily routines, note-taking, scheduling
- **Clawdbot**: Messaging platforms, automation, smart home, email/calendar
- **Bidirectional**: Both assistants can delegate tasks and share context

## Trigger Patterns
- **Messaging**: "Send message to John via Clawdbot"
- **Automation**: "Ask Clawdbot to schedule meeting with team"
- **Delegation**: "Delegate email replies to Clawdbot"
- **Collaboration**: "Work with Clawdbot on project research"
- **Platform-specific**: "WhatsApp mom about dinner plans"

## Supported Platforms
- **WhatsApp** - Personal messaging
- **Telegram** - Group communications
- **Discord** - Community and gaming
- **Slack** - Work team collaboration
- **Email** - Professional communication
- **Calendar** - Scheduling and reminders
- **Smart Home** - IoT device control

## Auto-Detection Features
- **Platform Detection**: Automatically identifies target platform
- **Priority Detection**: Urgent vs normal requests
- **Message Type**: Scheduling, reminders, communication, monitoring
- **Target Recognition**: Contact names, group names, channels
- **Context Sharing**: Maintains conversation context across assistants

## Configuration
Add to `~/ARDEN/config/arden.json`:
```json
{
  "clawdbot_partnership": {
    "enabled": true,
    "api_url": "http://localhost:3002/api",
    "api_key": "your-clawdbot-api-key",
    "supported_platforms": ["whatsapp", "telegram", "discord", "slack"],
    "automation_enabled": true,
    "collaboration_mode": "bidirectional"
  }
}
```

## Communication Patterns

### 1. ARDEN → Clawdbot
- Voice requests for messaging
- Delegation of automation tasks
- Context sharing for better assistance
- Cross-platform communication

### 2. Clawdbot → ARDEN
- Voice generation for messages
- Daily routine integration
- Note-taking from conversations
- Scheduling coordination

### 3. Collaboration Mode
- Joint problem-solving
- Shared context and memory
- Coordinated task execution
- Unified user experience

## Tools
- `execute-clawdbot.sh` - Send requests to Clawdbot
- `clawdbot-client.js` - Node.js API client
- `status-check.sh` - Check partnership status

## Workflows
- `send-message.md` - Cross-platform messaging
- `delegate-task.md` - Task delegation
- `collaborate.md` - Joint work sessions
- `sync-context.md` - Context synchronization

## Security & Privacy
- Encrypted communication channels
- User consent for data sharing
- Granular permission controls
- Audit logging for all interactions
- Local-only sensitive data storage