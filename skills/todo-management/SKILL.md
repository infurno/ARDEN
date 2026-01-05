# TODO Management Skill

## Purpose
Quickly add TODO items to the appropriate category (work, personal, or side-projects) via chat, voice, or web interface. TODOs are saved as markdown checkboxes in categorized files and automatically consolidated.

## How to Execute This Skill

When the user wants to add a TODO, analyze the content to determine the category, then use the Bash tool to run:

```bash
~/ARDEN/skills/todo-management/tools/add-todo.sh "TODO_TEXT" "category"
```

Where:
- TODO_TEXT = The TODO item text (extract from user's message)
- category = work, personal, or side-projects (determine from context)

The script will:
1. Add the TODO to the appropriate category file in ~/Notes/todos/
2. Format it as a markdown checkbox: `- [ ] TODO_TEXT`
3. Run consolidation to update the master todo.md
4. Return confirmation with category and file location

**Examples:**
```bash
# Work TODO
~/ARDEN/skills/todo-management/tools/add-todo.sh "Review pull request #42" "work"

# Personal TODO
~/ARDEN/skills/todo-management/tools/add-todo.sh "Buy groceries" "personal"

# Side project TODO
~/ARDEN/skills/todo-management/tools/add-todo.sh "Add feature to ARDEN" "side-projects"
```

**Sample Output:**
```
✅ TODO added successfully!

📋 TODO: Review pull request #42
🏷️  Category: Work
📄 File: todos/work.md
📍 Location: /home/hal/Notes/todos/work.md

RESULT: TODO added to Work category
```

Then confirm to user: "Added to your work TODOs: [TODO_TEXT]"

## TODO Categories

TODOs are organized into three categories:

### Work
- Professional tasks, meetings, projects
- Code reviews, deployments, documentation
- Client communications, reports, presentations
- **File:** `~/Notes/todos/work.md`

### Personal
- Household tasks, errands, appointments
- Family, friends, health, fitness
- Personal finances, shopping, home maintenance
- **File:** `~/Notes/todos/personal.md`

### Side Projects
- ARDEN improvements and features
- Learning new technologies, tutorials
- Personal coding projects, experiments
- **File:** `~/Notes/todos/side-projects.md`

## Category Detection

Analyze the TODO content to determine the appropriate category:

**Work indicators:** deploy, review PR, meeting, client, presentation, report, team
**Personal indicators:** buy, groceries, family names, doctor, gym, clean, bills
**Side Projects indicators:** ARDEN, learn, experiment, tutorial, side project

**Default:** When unclear, use **personal** category.

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

- **Smart Categorization**: Automatically determines category from TODO content
- **Quick Capture**: Add TODOs in seconds via any interface
- **Three Categories**: Organized into work, personal, and side-projects
- **Markdown Format**: Uses standard markdown checkbox syntax
- **Auto-Consolidation**: Automatically runs consolidation script
- **Voice-Friendly**: Works seamlessly with voice input
- **Web Integration**: Integrates with web TODO interface with category badges
- **Category Filtering**: Filter TODOs by category in web interface

## Workflows

See `workflows/add-todo.md` for detailed workflow including category detection guidelines

## Tools

- `add-todo.sh` - Main script to add TODO items with category support

## Context Files

- `todo-location.md` - Where TODOs are saved (~/Notes/todos/)
- `todo-format.md` - Markdown checkbox format specification

## Voice Interaction Design

### Best Practices for User Input

**Clear, Direct Patterns (Recommended):**
- "Add a TODO to [action]"
- "Remind me to [action]"
- "I need to [action]"
- "Add to my TODO list: [action]"

**For Best Results:**
1. **Be specific and actionable** - Start with a verb
   - ✅ "Review pull request #42"
   - ❌ "The pull request thing"

2. **Include context when needed**
   - ✅ "Send Q1 report to Sarah by Friday"
   - ❌ "Send report"

3. **One TODO at a time** (or clearly separate multiple TODOs)
   - ✅ "Add three TODOs: review code, buy milk, learn Rust"
   - ❌ "I need to do some coding stuff and also personal things"

4. **Use trigger phrases**
   - "Add a TODO..."
   - "Remind me to..."
   - "I need to..."
   - "Don't forget to..."

5. **Trust the AI for category detection**, but be explicit if uncertain
   - It knows: "deploy" = work, "groceries" = personal, "ARDEN" = side-projects
   - If unsure, just say "work TODO" or "personal TODO"

**What to Avoid:**
- ❌ Too vague: "Remember something", "Add that thing"
- ❌ Too conversational/rambling: "So I was thinking maybe I should probably at some point review the code"
- ❌ Multiple TODOs in complex sentences without clear separation

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

### Category-Specific Examples

**For Work TODOs** (use work-related keywords):
```
"Add a TODO to review the deployment logs"
"Remind me to send the quarterly report"
"I need to fix the authentication bug"
"Add to my work TODOs: prepare presentation for client meeting"
```

**For Personal TODOs** (use personal/household keywords):
```
"Remind me to buy groceries"
"I need to call the dentist"
"Add a TODO to pay the electricity bill"
"Don't forget to pick up dry cleaning"
```

**For Side Projects** (mention ARDEN or learning):
```
"I need to improve ARDEN's voice recognition"
"Add a TODO to learn Rust programming"
"Remind me to work on my side project"
"Add a TODO to experiment with the new API"
```

**Explicit Category** (Most Reliable):
```
"Add a work TODO to [action]"
"Add a personal TODO to [action]"
"Add a side project TODO to [action]"
```

### Output Format

Voice responses should be:
- **Brief confirmation**: "Added to your TODO list"
- **Repeat task**: Echo back the TODO item
- **Keep it short**: Don't over-explain

### Example Voice Interactions

**Example 1: Work TODO**
```
User: "Add a TODO to review the deployment logs"
Analysis: "deployment" → work category
ARDEN: "Added to your work TODOs: Review the deployment logs"
```

**Example 2: Personal TODO**
```
User: "Remind me to buy groceries"
Analysis: "buy groceries" → personal category
ARDEN: "Added to personal: Buy groceries"
```

**Example 3: Side Project TODO**
```
User: "I need to add a new feature to ARDEN"
Analysis: "ARDEN" → side-projects category
ARDEN: "Added to side projects: Add a new feature to ARDEN"
```

**Example 4: Multiple TODOs**
```
User: "Add three TODOs: review pull request, buy milk, and learn Rust"
Analysis: work, personal, side-projects
ARDEN: "Added 3 items: 1 to work, 1 to personal, and 1 to side projects"
```

**Example 5: Explicit Category**
```
User: "Add a work TODO to send the quarterly report"
Analysis: User explicitly said "work TODO"
ARDEN: "Added to work: Send the quarterly report"
```

## Web Interface Integration

The skill integrates with the web TODO interface at `/todos.html`:

- TODOs added via skill appear in the web UI with category badges
- Color-coded badges: Work (blue), Personal (green), Side Projects (purple)
- Filter by category using the category dropdown
- Real-time updates via WebSocket
- Can toggle TODO status in web UI
- Full sync between chat, voice, and web

## File Organization

### Category Files
- **Work:** `~/Notes/todos/work.md`
- **Personal:** `~/Notes/todos/personal.md`
- **Side Projects:** `~/Notes/todos/side-projects.md`

### Consolidated File
- **Master:** `~/Notes/todo.md` (auto-generated from all category files)

**Important:** Only files in `~/Notes/todos/` directory are scanned for TODOs. Regular notes in `~/Notes/` are NOT included in TODO consolidation.

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

### TODOs Directory
Default: `~/Notes/todos/`

Category files:
- `work.md`
- `personal.md`
- `side-projects.md`

### Default Category
Default: `personal` (used when category cannot be determined)

To change, update the `DEFAULT_CATEGORY` variable in `add-todo.sh`

### Consolidation Script
Location: `~/ARDEN/scripts/consolidate-todos.sh`

Automatically runs after each TODO addition to keep master list updated.
Only scans `~/Notes/todos/` directory (regular notes are excluded).

## Examples

### Example 1: Work - Development Task
```
User: "Add a TODO to fix the authentication bug in the login flow"
Category: work (technical task)
ARDEN: "Added to work: Fix the authentication bug in the login flow"
```

### Example 2: Work - Meeting Follow-up
```
User: "Remind me to send the Q1 report to the team by Friday"
Category: work (team, report)
ARDEN: "Added to work: Send the Q1 report to the team by Friday"
```

### Example 3: Personal - Errands
```
User: "Don't forget to buy milk and eggs"
Category: personal (groceries)
ARDEN: "Added to personal: Buy milk and eggs"
```

### Example 4: Side Projects - ARDEN Improvement
```
User: "I need to improve ARDEN's voice recognition accuracy"
Category: side-projects (ARDEN mentioned)
ARDEN: "Added to side projects: Improve ARDEN's voice recognition accuracy"
```

### Example 5: Side Projects - Learning
```
User: "Add a TODO to learn Rust programming"
Category: side-projects (learning)
ARDEN: "Added to side projects: Learn Rust programming"
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

Test the skill with different categories:
```bash
# Test work TODO
./skills/todo-management/tools/add-todo.sh "Deploy new feature" "work"

# Test personal TODO
./skills/todo-management/tools/add-todo.sh "Buy groceries" "personal"

# Test side project TODO
./skills/todo-management/tools/add-todo.sh "Add ARDEN feature" "side-projects"

# Test default (personal)
./skills/todo-management/tools/add-todo.sh "Call dentist"

# Test invalid category (falls back to personal)
./skills/todo-management/tools/add-todo.sh "Test task" "invalid"
```

## Agent Preferences

Best used with:
- **Assistant** agent - General TODO capture
- **Strategist** agent - Planning and task breakdown
- **Engineer** agent - Technical task tracking

## Future Enhancements

Potential improvements:
- [ ] Priority levels (high/medium/low) within categories
- [ ] Due dates for TODOs
- [ ] Recurring TODOs
- [ ] Sub-tasks
- [ ] Smart category suggestions based on user patterns
- [ ] Integration with calendar
- [ ] Smart reminders
- [ ] Category customization (add new categories)
