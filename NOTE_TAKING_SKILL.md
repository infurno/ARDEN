# 📝 Note-Taking Skill - Ready!

Your ARDEN can now create notes in your second brain via voice!

## Location

**All notes save to:** `~/Notes/`

This is your existing second brain with all your markdown notes.

## How to Use

### Voice Commands (Telegram)

Just say any of these:
- "Take a note: [your content]"
- "Create a note about [topic]: [content]"
- "Save this: [content]"
- "Make a note: [content]"
- "Remember this: [content]"

### What ARDEN Does

1. Listens to your voice message
2. Transcribes it with local Whisper
3. Creates a markdown file with:
   - Date-prefixed filename (e.g., `2026-01-02-your-topic.md`)
   - Formatted headers
   - Timestamp
   - Your content
4. Saves to `~/Notes/`
5. Confirms with the filename

## Example

**You (voice):** "Take a note: Review ARDEN documentation and create custom skills for project management"

**ARDEN:** "Note saved as 2026-01-02-review-arden-documentation.md in your Notes folder. I captured: Review ARDEN documentation and create custom skills for project management."

**File created:** `~/Notes/2026-01-02-review-arden-documentation.md`

```markdown
# Note

**Date:** 2026-01-02
**Time:** 15:30

## Content

Review ARDEN documentation and create custom skills for project management

---
*Created via ARDEN voice assistant*
```

## Note Types

ARDEN can create different types of notes:

- **Quick Note** - Fast capture, minimal formatting
- **Meeting Note** - Structured with attendees, agenda, action items
- **Idea Note** - For capturing ideas with context
- **Todo Note** - Checklist format with priorities

Just mention the type in your message!

## Integration

Works perfectly with:
- ✅ Obsidian (you're using this!)
- ✅ Any markdown editor
- ✅ Git version control
- ✅ Sync services (already syncing!)

## Test It Now

1. Restart your bot (to load the new skill)
2. Send a voice message: "Take a note: This is my first ARDEN note"
3. Check `~/Notes/` for the new file!

## Your Setup

**Second Brain:** `~/Notes/` ✅
**Skills Loaded:** daily-planning, note-taking ✅
**Voice:** Local Whisper + Edge TTS ✅
**Cost:** $0/month ✅

---

*Your notes go straight to your second brain via voice!* 🎤📝
