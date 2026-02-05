# ARDEN Memory Feature

**Status:** ✅ Deployed and Tested  
**Deployed:** January 8, 2026  
**Location:** `~/Notes/openai-context.md`

## Overview

ARDEN now has persistent memory through the `openai-context.md` file in your Notes directory. This file is automatically loaded into every conversation, allowing ARDEN to remember important information about you, your projects, and your preferences across all sessions.

## How It Works

### 1. Automatic Context Loading

Every time ARDEN starts a conversation (Discord, Telegram, or Web), it:
1. Reads `~/Notes/openai-context.md`
2. Includes the entire content in the system prompt
3. Uses this information to personalize responses

The memory has **PRIORITY 1** in the context hierarchy:
- Priority 1: `openai-context.md` (persistent memory)
- Priority 2: Skills context
- Priority 3: Profile notes
- Priority 4: Recent activity

### 2. Memory Structure

The memory file follows a structured format:

```markdown
# ARDEN Memory Context

## User Profile
- Name, role, location, preferences

## Projects & Work
- Current projects
- Technologies & tools
- Goals

## Conversations & Learnings
- Date-stamped learnings from conversations

## Important Facts
- Key facts to remember

## Communication Preferences
- Style, detail level, format preferences

## Technical Preferences
- Programming languages, tools, AI provider
```

### 3. Automatic Memory Updates

ARDEN can update its own memory using special REMEMBER commands:

**Format:**
```
REMEMBER[Section|Field]: Content
REMEMBER[Section]: Content
```

**Examples:**
```
REMEMBER[User Profile|Name]: Hal
REMEMBER[Learning|ARDEN Setup]: Deployed Discord bot successfully
REMEMBER[Fact]: Prefers OpenAI gpt-4o-mini
```

When ARDEN outputs a REMEMBER command in a response, the system:
1. Parses the command
2. Updates the memory file automatically
3. Removes the command from the user-facing response
4. Logs the memory update

## API Endpoints

### `GET /api/memory`
Get current memory content

**Response:**
```json
{
  "success": true,
  "content": "# ARDEN Memory Context\n...",
  "filename": "openai-context.md",
  "path": "/home/arden/Notes/openai-context.md"
}
```

### `GET /api/memory/summary`
Get memory statistics

**Response:**
```json
{
  "success": true,
  "summary": {
    "exists": true,
    "path": "/home/arden/Notes/openai-context.md",
    "size": 966,
    "modified": "2026-01-08T00:40:01.727Z",
    "wordCount": 149,
    "lineCount": 46,
    "learningsCount": 1,
    "factsCount": 2
  }
}
```

### `POST /api/memory/learning`
Add a new learning

**Request:**
```json
{
  "topic": "ARDEN Setup",
  "information": "Successfully deployed Discord bot on VPS"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Learning added successfully"
}
```

### `POST /api/memory/fact`
Add an important fact

**Request:**
```json
{
  "fact": "Prefers OpenAI gpt-4o-mini for AI responses"
}
```

### `PUT /api/memory/profile`
Update user profile field

**Request:**
```json
{
  "field": "Name",
  "value": "Hal"
}
```

### `PUT /api/memory/section`
Update a specific section

**Request:**
```json
{
  "section": "Projects & Work",
  "content": "- Working on ARDEN AI assistant",
  "append": true
}
```

### `POST /api/memory/initialize`
Initialize memory file (creates if doesn't exist)

### `DELETE /api/memory`
Clear memory (creates backup)

**Request:**
```json
{
  "confirm": "DELETE_MY_MEMORY"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Memory cleared successfully",
  "backupPath": "/home/arden/Notes/openai-context.backup.1736297601727.md"
}
```

### `POST /api/memory/analyze`
Analyze conversation for learnings

**Request:**
```json
{
  "messages": [
    { "role": "user", "message": "I'm working on ARDEN" },
    { "role": "assistant", "message": "..." }
  ]
}
```

## Usage Examples

### Via API (cURL)

```bash
# Get memory
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/memory

# Add learning
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topic":"New Feature","information":"Added memory management"}' \
  http://localhost:3001/api/memory/learning

# Update profile
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field":"Name","value":"Hal"}' \
  http://localhost:3001/api/memory/profile
```

### Via JavaScript (Web Dashboard)

```javascript
// Get memory
const response = await fetch('/api/memory', {
  headers: { 'Authorization': 'Bearer ' + token }
});
const data = await response.json();

// Add learning
await fetch('/api/memory/learning', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    topic: 'New Feature',
    information: 'Added memory management'
  })
});
```

### Via Conversation (Automatic)

Just talk to ARDEN naturally. When you share important information, ARDEN can choose to remember it:

**Example:**
```
You: My name is Hal and I work on AI projects
ARDEN: Nice to meet you, Hal! I'll remember that.
      REMEMBER[User Profile|Name]: Hal
      REMEMBER[User Profile|Role]: AI project developer
```

The REMEMBER commands are processed automatically and won't appear in the response you see.

## File Management

### Initialization

The memory file is automatically created on first use with a structured template. You can also manually initialize it:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/memory/initialize
```

### Backup & Restore

When you delete memory, a timestamped backup is created:
- Location: `~/Notes/openai-context.backup.TIMESTAMP.md`
- Format: Same as original
- Restore: Rename backup to `openai-context.md`

### Manual Editing

You can manually edit the memory file:

```bash
# Via command line
nano ~/Notes/openai-context.md

# Via web dashboard
# Go to Notes → openai-context.md
```

Changes take effect on the next conversation (context cache refreshes every 5 minutes).

## Integration Points

### 1. Context Loader (`api/services/context-loader.js`)

```javascript
// Loads memory as PRIORITY 1 context
const memory = await memoryManager.loadMemory();
context.memoryContext = memory;
```

### 2. AI Providers (`api/services/ai-providers.js`)

```javascript
// Includes memory in system prompt
const systemPrompt = await buildSystemPrompt();

// Processes REMEMBER commands in responses
response = await processMemoryUpdates(response);
```

### 3. Memory Manager (`api/services/memory-manager.js`)

All memory operations:
- `loadMemory()` - Read file
- `updateMemory(section, content, append)` - Update section
- `addLearning(topic, information)` - Add learning entry
- `addFact(fact)` - Add fact
- `updateUserProfile(field, value)` - Update profile
- `getMemorySummary()` - Get stats
- `clearMemory()` - Clear with backup

## Best Practices

### What to Remember

✅ **DO remember:**
- User's name, role, location
- Current projects and goals
- Technology preferences
- Communication style preferences
- Important decisions or patterns
- Recurring topics
- Project-specific context

❌ **DON'T remember:**
- Temporary information (file paths, error messages)
- Conversation filler ("thanks", "ok", etc.)
- Information that changes frequently
- Sensitive data (passwords, API keys)

### When to Update Memory

ARDEN should update memory when:
1. User explicitly shares personal/project information
2. User corrects previous information
3. User expresses strong preferences
4. Important project milestones are reached
5. New context emerges that affects future conversations

### Memory Hygiene

1. **Review periodically:** Check `~/Notes/openai-context.md` monthly
2. **Remove outdated info:** Delete completed projects, old preferences
3. **Keep it concise:** Aim for 500-1000 words max
4. **Use clear sections:** Follow the template structure
5. **Date learnings:** All learning entries are auto-dated

## Testing

### Test Memory Loading

```bash
# Check if memory is loaded in context
ssh arden@rocket.id10t.social "source ~/.nvm/nvm.sh && pm2 logs arden-web --lines 100" | grep "Memory loaded"
```

### Test Memory Updates

```bash
# Add test learning
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topic":"Test","information":"This is a test"}' \
  http://localhost:3001/api/memory/learning

# Verify in file
cat ~/Notes/openai-context.md | grep "Test"
```

### Test Automatic Updates

Have a conversation where you share information and check if ARDEN uses REMEMBER commands in its internal processing.

## Troubleshooting

### Memory Not Loading

**Check:**
```bash
# Verify file exists
ls -la ~/Notes/openai-context.md

# Check file permissions
chmod 644 ~/Notes/openai-context.md

# Check logs
pm2 logs arden-web | grep "memory"
```

### Updates Not Persisting

**Check:**
```bash
# Verify write permissions
ls -la ~/Notes/

# Check disk space
df -h

# Verify API response
curl -X POST ... -v
```

### Context Not Refreshing

The context cache refreshes every 5 minutes. To force refresh:
```bash
pm2 restart arden-web arden-discord arden-bot
```

## Architecture

```
┌─────────────────────────────────────────┐
│         User Conversation               │
│    (Discord/Telegram/Web)               │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│      AI Provider (OpenAI/etc)           │
│   + buildSystemPrompt()                 │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│      Context Loader                     │
│   1. Load openai-context.md ←────────┐  │
│   2. Load skills context             │  │
│   3. Load profile notes              │  │
└────────────┬─────────────────────┬────┘  │
             │                     │       │
             ▼                     ▼       │
┌─────────────────────┐  ┌──────────────┐ │
│   AI Response       │  │   REMEMBER   │ │
│                     │  │   Commands   │ │
└─────────────────────┘  └──────┬───────┘ │
                                │         │
                                ▼         │
                    ┌────────────────────┐│
                    │  Memory Manager    ││
                    │  - updateMemory()  ││
                    │  - addLearning()   ││
                    │  - addFact()       ││
                    └────────────────────┘│
                                │         │
                                ▼         │
                    ┌────────────────────┐│
                    │ openai-context.md  │┘
                    │  (Persistent File) │
                    └────────────────────┘
```

## Future Enhancements

### Planned Features

1. **Web UI for Memory Management**
   - Visual editor for openai-context.md
   - Section-by-section editing
   - Learning browser with search
   - Memory timeline view

2. **Smart Learning Detection**
   - AI-powered analysis of conversations
   - Automatic suggestion of what to remember
   - User confirmation before adding

3. **Memory Categories**
   - Tag-based organization
   - Context switching (work vs. personal)
   - Project-specific memory files

4. **Memory Analytics**
   - Growth over time
   - Most referenced sections
   - Unused sections cleanup suggestions

5. **Memory Sharing**
   - Export/import memory profiles
   - Share project context with team
   - Merge memory files

6. **Version Control**
   - Git integration for memory file
   - Diff view for changes
   - Rollback to previous versions

## Files Created/Modified

### New Files
- `api/services/memory-manager.js` - Core memory management service
- `api/routes/memory.js` - REST API endpoints
- `docs/MEMORY_FEATURE.md` - This documentation
- `~/Notes/openai-context.md` - The actual memory file (auto-created)

### Modified Files
- `api/services/context-loader.js` - Added memory loading
- `api/services/ai-providers.js` - Added REMEMBER command processing
- `api/web-server.js` - Added memory routes

## Deployment

**Repository:** https://github.com/infurno/ARDEN  
**Branch:** arden-prod  
**Commit:** ca4b6e4

**Deployed to:**
- VPS: rocket.id10t.social
- Services: arden-web, arden-discord, arden-bot
- All services restarted with new code

**Verified:**
- ✅ Memory file creation
- ✅ API endpoints working
- ✅ Memory loading in context
- ✅ Profile updates
- ✅ Learning additions
- ✅ Fact additions

---

**Created:** January 8, 2026  
**Author:** OpenCode AI  
**Status:** Production Ready
