# Create Note Workflow

## Objective
Create a well-formatted markdown note from user input and save it to the notes directory.

## Workflow Steps

### 1. Parse User Input
- [ ] Extract note content from user message
- [ ] Identify note type (quick, meeting, idea, todo)
- [ ] Detect any topic or title keywords
- [ ] Note timestamp

### 2. Generate Filename
- [ ] Format: `YYYY-MM-DD-topic-slug.md`
- [ ] Use date prefix for chronological ordering
- [ ] Create readable slug from topic/first few words
- [ ] Ensure no special characters in filename
- [ ] Check if file exists, append number if needed

Examples:
- "Take a note: Meeting with Sarah" → `2026-01-02-meeting-with-sarah.md`
- "Quick idea about AI" → `2026-01-02-ai-idea.md`
- "Remember to buy milk" → `2026-01-02-buy-milk.md`

### 3. Format Note Content

**Standard Note Template:**
```markdown
# [Title]

**Date:** YYYY-MM-DD
**Time:** HH:MM
**Type:** [Quick Note/Meeting/Idea/Todo]

## Content

[User's note content here]

---
*Created via ARDEN voice assistant*
```

**Quick Note Template:**
```markdown
# Quick Note

[User's content]

---
*2026-01-02 14:30 - ARDEN*
```

**Meeting Note Template:**
```markdown
# Meeting: [Topic]

**Date:** YYYY-MM-DD
**Time:** HH:MM
**Attendees:** [if mentioned]

## Agenda

[Main topics discussed]

## Notes

[User's content]

## Action Items

- [ ] [Extracted action items]

## Decisions

[Key decisions made]

---
*Created via ARDEN*
```

### 4. Save Note
- [ ] Ensure notes directory exists (`~/Notes/`)
- [ ] Write formatted content to file
- [ ] Set appropriate permissions
- [ ] Log file path

### 5. Confirm to User
- [ ] State filename
- [ ] Confirm location
- [ ] Repeat key points back
- [ ] Offer to add more details

## Voice Response Template

**Standard confirmation:**
```
Note saved as "[filename]" in your notes folder.

I captured: [brief summary of key points]

Would you like to add anything else?
```

**Quick confirmation (for speed):**
```
Saved as "[filename]". Got it!
```

## Implementation Example

### Input Processing
```python
# Parse user input
user_input = "Take a note: Remember to review ARDEN docs and add project management skills"

# Extract content (remove trigger phrase)
content = user_input.replace("Take a note:", "").strip()

# Generate slug from first few words
words = content.split()[:5]
slug = "-".join(words).lower()
slug = re.sub(r'[^a-z0-9-]', '', slug)

# Create filename
date = datetime.now().strftime("%Y-%m-%d")
filename = f"{date}-{slug}.md"
```

### Note Creation
```python
# Format note
note_content = f"""# Note

**Date:** {datetime.now().strftime("%Y-%m-%d")}
**Time:** {datetime.now().strftime("%H:%M")}

## Content

{content}

---
*Created via ARDEN voice assistant*
"""

# Save to file
notes_dir = os.path.expanduser("~/Notes")
os.makedirs(notes_dir, exist_ok=True)

filepath = os.path.join(notes_dir, filename)
with open(filepath, 'w') as f:
    f.write(note_content)
```

## Error Handling

**Directory doesn't exist:**
- Create it automatically
- Use default location: `~/Notes/`
- Inform user of location

**File already exists:**
- Append timestamp: `filename-HH-MM.md`
- Or append counter: `filename-2.md`

**Permission denied:**
- Try alternative location
- Inform user of issue
- Suggest manual save

## Voice Optimization

Keep confirmations brief:
- ✅ "Saved as meeting-notes.md. Got it!"
- ❌ "I have successfully created and saved your note to the file system at /Users/hal/Documents/Notes/2026-01-02-meeting-notes.md with the following content..."

## Follow-up Actions

After creating note, user might say:
- "Add to that note: [more content]" → Append to existing file
- "Show me that note" → Read back content
- "Create another note" → New note workflow
- "Where is it saved?" → State full path

## Customization

Users can customize:
- Default notes directory (edit `context/notes-location.md`)
- Note templates (edit `context/note-templates.md`)
- Filename format
- Metadata to include
