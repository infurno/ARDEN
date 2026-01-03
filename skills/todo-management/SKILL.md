# TODO Management Skill

## Purpose
Quickly add TODO items via chat, voice, or web interface. TODOs are saved as markdown checkboxes in your Notes directory and automatically consolidated.

## How to Execute This Skill

When the user wants to add a TODO, use the Bash tool to run:

```bash
~/ARDEN/skills/todo-management/tools/add-todo.sh "TODO_TEXT" [target-file]
```

Where:
- TODO_TEXT = The TODO item text (extract from user's message)
- target-file = Optional filename (default: todo.md)

The script will:
1. Add the TODO to the specified file in ~/Notes/
2. Format it as a markdown checkbox: `- [ ] TODO_TEXT`
3. Run consolidation to update the master todo.md
4. Return confirmation with file location

**Examples:**
```bash
# Add to default todo.md
~/ARDEN/skills/todo-management/tools/add-todo.sh "Review pull request #42"

# Add to specific file
~/ARDEN/skills/todo-management/tools/add-todo.sh "Deploy to production" "deployment-checklist.md"

# Add task with details
~/ARDEN/skills/todo-management/tools/add-todo.sh "Follow up with Sarah about Q1 planning meeting"
```

**Sample Output:**
```
✅ TODO added successfully!

📋 TODO: Review pull request #42
📄 File: todo.md
📍 Location: /home/hal/Notes/todo.md

RESULT: TODO added to todo.md
```

Then confirm to user: "Added to your TODO list: [TODO_TEXT]"

## When to Invoke

This skill should be automatically invoked when the user:
- Asks to add a TODO
- Says "add to my TODO list"
- Says "remind me to..."
- Says "I need to..."
- Says "don't forget to..."
- Says "make a TODO..."
- Says "add a task..."
- Uses action verbs like "remember to", "need to", "have to", "must"

## Capabilities

- **Quick Capture**: Add TODOs in seconds via any interface
- **Flexible Targeting**: Add to default todo.md or any specific file
- **Markdown Format**: Uses standard markdown checkbox syntax
- **Auto-Consolidation**: Automatically runs consolidation script
- **Voice-Friendly**: Works seamlessly with voice input
- **Web Integration**: Integrates with existing web TODO interface
- **File Organization**: Keeps TODOs organized in Notes directory

## Workflows

See `workflows/add-todo.md` for detailed workflow

## Tools

- `add-todo.sh` - Main script to add TODO items

## Context Files

- `todo-location.md` - Where TODOs are saved (~/Notes/)
- `todo-format.md` - Markdown checkbox format specification

## Voice Interaction Design

### Input Patterns

Natural language patterns that should trigger this skill:

- "Add a TODO: [task]"
- "Remind me to [task]"
- "I need to [task]"
- "Don't forget to [task]"
- "Make a TODO to [task]"
- "Add to my TODO list: [task]"
- "Task: [task]"
- "I have to [task]"
- "Remember to [task]"

### Output Format

Voice responses should be:
- **Brief confirmation**: "Added to your TODO list"
- **Repeat task**: Echo back the TODO item
- **Keep it short**: Don't over-explain

### Example Voice Interactions

**Example 1: Simple TODO**
```
User: "Add a TODO to review the deployment logs"
ARDEN: "Added to your TODO list: Review the deployment logs"
```

**Example 2: Natural language**
```
User: "Remind me to call Sarah about the Q1 budget meeting"
ARDEN: "Added: Call Sarah about the Q1 budget meeting"
```

**Example 3: Implied TODO**
```
User: "I need to update the documentation for the API changes"
ARDEN: "Added to your TODO list: Update the documentation for the API changes"
```

**Example 4: Multiple TODOs**
```
User: "Add three TODOs: review pull request, deploy to staging, and send status update"
ARDEN: "Added 3 items to your TODO list"
```

## Web Interface Integration

The skill integrates with the existing web TODO interface at `/todos.html`:

- TODOs added via skill appear in the web UI
- Web UI uses same consolidation system
- Real-time updates via WebSocket
- Can toggle TODO status in web UI
- Full sync between chat, voice, and web

## File Organization

### Default Target
- Primary file: `~/Notes/todo.md`
- All TODOs are consolidated here automatically

### Custom Targets
You can add TODOs to specific files:
- Project TODOs: `project-name.md`
- Meeting TODOs: `meeting-YYYY-MM-DD.md`
- Topic-specific: `deployment-checklist.md`

All files are scanned and consolidated into master `todo.md`

## TODO Format

Standard markdown checkbox format:
```markdown
- [ ] Unchecked TODO item
- [x] Completed TODO item
```

### Best Practices

1. **Be Specific**: "Review PR #42" vs "Review code"
2. **Actionable**: Start with action verbs
3. **One Task**: Each TODO should be a single action
4. **Context**: Include relevant context when needed

## Integration with Other Skills

### Works well with:
- **Note-Taking Skill**: Convert notes to TODOs
- **User Context Skill**: Add context to TODO items
- **Daily Planning Skill**: Review TODOs in morning briefing

### Example Combined Usage:
```bash
# Create note with embedded TODO
create-note.sh "Meeting with Sarah - TODO: Send follow-up email" "meeting"

# Add standalone TODO
add-todo.sh "Send follow-up email to Sarah"
```

## Configuration

### Notes Directory
Default: `~/Notes/`

To change, update the `NOTES_DIR` variable in `add-todo.sh`

### Default TODO File
Default: `todo.md`

To change, update the `DEFAULT_TODO_FILE` variable in `add-todo.sh`

### Consolidation Script
Location: `~/ARDEN/scripts/consolidate-todos.sh`

Automatically runs after each TODO addition to keep master list updated.

## Examples

### Example 1: Development Task
```
User: "Add a TODO to fix the authentication bug in the login flow"
ARDEN: "Added to your TODO list: Fix the authentication bug in the login flow"
```

### Example 2: Meeting Follow-up
```
User: "Remind me to send the Q1 report to the team by Friday"
ARDEN: "Added: Send the Q1 report to the team by Friday"
```

### Example 3: Project Task
```
User: "I need to deploy the new features to the staging environment"
ARDEN: "Added to your TODO list: Deploy the new features to the staging environment"
```

### Example 4: Quick Capture
```
User: "Don't forget to buy milk"
ARDEN: "Added: Buy milk"
```

## Error Handling

The script handles common errors:
- Missing TODO text → Shows usage help
- Notes directory doesn't exist → Error message
- Target file doesn't exist → Creates automatically
- Consolidation fails → Continues anyway (TODO still added)

## Dependencies

- Bash shell
- Write access to Notes directory
- `consolidate-todos.sh` script (optional but recommended)

## Testing

Test the skill:
```bash
# Test basic addition
./skills/todo-management/tools/add-todo.sh "Test TODO item"

# Test custom file
./skills/todo-management/tools/add-todo.sh "Test custom file" "test.md"

# Test missing argument (should show error)
./skills/todo-management/tools/add-todo.sh
```

## Agent Preferences

Best used with:
- **Assistant** agent - General TODO capture
- **Strategist** agent - Planning and task breakdown
- **Engineer** agent - Technical task tracking

## Future Enhancements

Potential improvements:
- [ ] Priority levels (high/medium/low)
- [ ] Due dates
- [ ] Tags/categories
- [ ] Recurring TODOs
- [ ] Sub-tasks
- [ ] Assignees (for team TODOs)
- [ ] Integration with calendar
- [ ] Smart reminders
