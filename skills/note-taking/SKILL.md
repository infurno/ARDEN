# Note-Taking Skill

## Purpose
Capture notes via voice or text and save them as markdown files in your notes directory.

## How to Execute This Skill

When the user wants to create a note, use the Bash tool to run:

```bash
~/ARDEN/skills/note-taking/tools/create-note.sh "CONTENT" "TYPE"
```

Where:
- CONTENT = The user's note content (extract from their message)
- TYPE = quick|meeting|idea|todo (default: quick)

The script will:
1. Create a markdown file in ~/Notes/
2. Auto-generate filename with date prefix
3. Return the filename for confirmation

**Example:**
```bash
~/ARDEN/skills/note-taking/tools/create-note.sh "Remember to follow up on IIT Pod deployment" "quick"
```

Returns: `2026-01-02-remember-to-follow-up-on-iit-pod.md`

Then confirm to user: "Note saved as [filename] in your Notes folder."

## When to Invoke
This skill should be automatically invoked when the user:
- Asks to create a note
- Says "take a note"
- Says "save this as a note"
- Says "create a note about..."
- Asks to "write down..."
- Says "make a note of..."
- Says "remember this..."

## Capabilities
- Create new markdown notes with auto-generated filenames
- Organize notes by date and topic
- Support for different note types (quick note, meeting note, idea, todo)
- Add timestamps and metadata automatically
- Format notes with proper markdown headers
- Save to configurable notes directory

## Workflows
- `create-note.md` - Create a new note from user input
- `quick-note.md` - Fast note capture (minimal formatting)
- `meeting-note.md` - Structured meeting notes
- `idea-note.md` - Capture ideas with context

## Tools
- `save-note.sh` - Save note to file system
- `format-note.py` - Format and structure note content

## Context Files
- `notes-location.md` - Where to save notes
- `note-templates.md` - Templates for different note types

## Voice Interaction Design

### Input Patterns
- "Take a note: [content]"
- "Create a note about [topic]: [content]"
- "Save this: [content]"
- "Meeting note: [content]"
- "Quick idea: [content]"

### Output Format
Voice responses should be:
- **Confirm note saved**: "Note saved as [filename]"
- **Brief summary**: Repeat key points back
- **Location**: Mention where it was saved

### Example Voice Interaction
**User**: "Take a note: Remember to review ARDEN documentation and add custom skills for project management"

**ARDEN**: 
> Note saved as "2026-01-02-arden-documentation.md" in your notes folder.
> 
> I captured: Review ARDEN documentation and add custom skills for project management.

## Configuration

Default notes directory: `~/Notes/`

To change, edit: `skills/note-taking/context/notes-location.md`

## Note Types

### Quick Note
- Minimal metadata
- Just content and timestamp
- Fast capture

### Meeting Note
- Date, time, attendees
- Agenda items
- Action items
- Decisions

### Idea Note
- Context and background
- Related topics
- Next steps

### Todo Note
- Checklist format
- Due dates
- Priority

## Examples

### Example 1: Quick Note
**User**: "Take a note: Buy milk on the way home"
**ARDEN**: *Creates quick-note-2026-01-02.md with the content*

### Example 2: Meeting Note
**User**: "Meeting note with Sarah about Q1 planning. Discussed budget allocation and timeline. Action: Send proposal by Friday."
**ARDEN**: *Creates structured meeting note with sections*

### Example 3: Idea Note
**User**: "I have an idea: Create a voice-first task management system integrated with ARDEN"
**ARDEN**: *Creates idea note with context and timestamp*

## Dependencies
- Write access to notes directory
- Markdown formatting capabilities

## Agent Preferences
Best used with:
- **Assistant** agent - General note-taking
- **Analyst** agent - Structured notes with insights
