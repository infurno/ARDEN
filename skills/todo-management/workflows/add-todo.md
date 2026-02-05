# Add TODO Workflow

## Overview
This workflow describes how to add a TODO item to the appropriate category when requested by the user.

## TODO Categories

TODOs are organized into three categories:
- **work** - Work-related tasks, meetings, projects
- **personal** - Personal tasks, errands, home items
- **side-projects** - Side projects, learning, ARDEN improvements

## Trigger Phrases
User says/types something like:
- "Add a TODO..."
- "Remind me to..."
- "I need to..."
- "Don't forget..."
- "Make a TODO..."
- "Add to my TODO list..."
- "Task: ..."
- "I have to..."
- "Remember to..."

## Workflow Steps

### 1. Identify the TODO Request
Listen for action-oriented phrases that indicate the user wants to track a task.

### 2. Extract the TODO Text
Parse the user's message to extract the actual TODO item text.

**Examples:**
- "Add a TODO to review the code" → Extract: "review the code"
- "Remind me to call Sarah" → Extract: "call Sarah"
- "I need to deploy to production" → Extract: "deploy to production"

### 3. Determine Category
Analyze the TODO content to determine the appropriate category:

**Work Category Indicators:**
- Project names, work tools, meetings with colleagues
- Technical tasks (deploy, review PR, write documentation)
- Professional communications (send status update, prepare presentation)
- Keywords: meeting, deploy, review, presentation, report, team, client

**Personal Category Indicators:**
- Household tasks, errands, personal appointments
- Family/friends, health, fitness, hobbies
- Personal finances, shopping, home maintenance
- Keywords: buy, groceries, call mom, doctor, gym, clean, pay bills

**Side Projects Category Indicators:**
- ARDEN improvements, learning new technologies
- Personal coding projects, experiments
- Technical learning, tutorials, courses
- Keywords: ARDEN, learn, experiment, side project, tutorial, practice

**Default:** If unclear, use **personal** category.

### 4. Execute the Tool
Run the add-todo.sh script with the determined category:

```bash
~/ARDEN/skills/todo-management/tools/add-todo.sh "TODO_TEXT" "category"
```

### 5. Parse the Result
The script outputs:
- Success/failure status
- TODO text
- Category name
- File location
- Confirmation message

### 6. Respond to User
Provide brief confirmation mentioning the category:

**Good Responses:**
- "Added to your work TODOs: [TODO_TEXT]"
- "Added to personal: [TODO_TEXT]"
- "I'll remind you to [TODO_TEXT] (added to side projects)"

**Avoid:**
- Long explanations
- Repeating system details
- Over-confirming

## Example Executions

### Example 1: Work TODO
```
User: "Add a TODO to review the deployment logs"

Analysis: "review deployment" → work category
Action: Execute tool
$ ~/ARDEN/skills/todo-management/tools/add-todo.sh "review the deployment logs" "work"

Response: "Added to your work TODOs: Review the deployment logs"
```

### Example 2: Personal TODO
```
User: "Remind me to buy groceries"

Analysis: "buy groceries" → personal category
Action: Execute tool
$ ~/ARDEN/skills/todo-management/tools/add-todo.sh "buy groceries" "personal"

Response: "Added to personal: Buy groceries"
```

### Example 3: Side Project TODO
```
User: "I need to add a new feature to ARDEN"

Analysis: "ARDEN" → side-projects category
Action: Execute tool
$ ~/ARDEN/skills/todo-management/tools/add-todo.sh "add a new feature to ARDEN" "side-projects"

Response: "Added to side projects: Add a new feature to ARDEN"
```

### Example 4: Explicit Category
```
User: "Add a work TODO to send the quarterly report"

Analysis: User explicitly said "work TODO"
Action: Execute tool
$ ~/ARDEN/skills/todo-management/tools/add-todo.sh "send the quarterly report" "work"

Response: "Added to work: Send the quarterly report"
```

### Example 5: Ambiguous (Default to Personal)
```
User: "Remind me to call Sarah"

Analysis: Unclear if personal or work → default to personal
Action: Execute tool
$ ~/ARDEN/skills/todo-management/tools/add-todo.sh "call Sarah" "personal"

Response: "Added: Call Sarah"
```

## Edge Cases

### Multiple TODOs in One Message
```
User: "Add three TODOs: review code, test deployment, send update"

Action: Analyze each TODO and execute tool multiple times
$ ~/ARDEN/skills/todo-management/tools/add-todo.sh "review code" "work"
$ ~/ARDEN/skills/todo-management/tools/add-todo.sh "test deployment" "work"
$ ~/ARDEN/skills/todo-management/tools/add-todo.sh "send update" "work"

Response: "Added 3 work items to your TODO list"
```

### Vague Request
```
User: "Add a TODO"

Response: "What would you like me to add to your TODO list?"
```

### TODO with Context
```
User: "Remind me to follow up with Sarah about the Q1 budget meeting we had yesterday"

Analysis: "Q1 budget meeting" → work category
Action: Execute tool
$ ~/ARDEN/skills/todo-management/tools/add-todo.sh "follow up with Sarah about the Q1 budget meeting" "work"

Response: "Added to work: Follow up with Sarah about the Q1 budget meeting"
```

### User Specifies Category
```
User: "Add a personal TODO to call my mom"

Analysis: User explicitly said "personal"
Action: Execute tool
$ ~/ARDEN/skills/todo-management/tools/add-todo.sh "call my mom" "personal"

Response: "Added to personal: Call my mom"
```

## Category Detection Guidelines

### High-Confidence Work Indicators:
- Deployment, staging, production
- Pull request, code review, documentation
- Client, meeting, presentation, report
- Team, colleague names (if known to be work)
- Professional tools/platforms

### High-Confidence Personal Indicators:
- Groceries, shopping, errands
- Family member names (mom, dad, etc.)
- Home maintenance, cleaning
- Doctor, dentist, personal appointments
- Bills, personal finances

### High-Confidence Side Projects Indicators:
- ARDEN (explicitly)
- Learning, tutorial, course, experiment
- Personal coding projects by name
- "side project" phrase

### When in Doubt:
- Default to **personal** if category unclear
- Look for explicit category mentions ("work TODO", "personal task")
- Consider user's context if available

## Integration with Voice

### Voice Input Processing
1. User speaks: "Add a work TODO to review pull request forty-two"
2. STT converts: "Add a work TODO to review pull request 42"
3. Detect category: "work TODO" → work category
4. Extract TODO: "review pull request 42"
5. Execute tool with category
6. TTS responds: "Added to work: Review pull request 42"

### Voice Response Guidelines
- Keep it short and natural
- Confirm the action
- Mention the category briefly
- Echo back the TODO for verification
- Use conversational tone

## Error Handling

### Missing TODO Text
```
User: "Add a TODO"
Response: "What would you like me to add to your TODO list?"
```

### Invalid Category (Script handles gracefully)
```
User provides: "Add TODO to unknown category"
Script behavior: Defaults to personal
Response: "Added to personal: [TODO_TEXT]"
```

### Notes Directory Missing
```
Script Error: Notes directory does not exist
Response: "I couldn't add that TODO. The notes directory doesn't exist."
```

### Tool Execution Fails
```
Script Error: Permission denied
Response: "I encountered an error adding that TODO. Please check the system logs."
```

## Best Practices

### DO:
- Extract clear, actionable TODO text
- Analyze content to determine correct category
- Keep responses brief and natural
- Confirm what was added with category
- Handle edge cases gracefully
- Respect user's explicit category mentions

### DON'T:
- Add overly long TODO items
- Include conversational filler in TODO text
- Over-explain the categorization process
- Lose important context from user's message
- Force a category when uncertain (default to personal)

## Testing the Workflow

Test with various inputs:
```bash
# Test work category
"Add a TODO to deploy the new feature to production"

# Test personal category
"Remind me to buy milk and eggs"

# Test side projects category
"I need to improve ARDEN's voice recognition"

# Test explicit category
"Add a work TODO to send the quarterly report"

# Test multiple TODOs
"Add TODOs to review code, call mom, and learn Rust"

# Test vague input
"Add a TODO"
```

## Success Criteria

A successful TODO addition:
1. ✅ TODO is added to the correct category file
2. ✅ Category is correctly determined from context
3. ✅ Consolidation script runs
4. ✅ User receives clear confirmation with category
5. ✅ TODO appears in web interface with proper category badge
6. ✅ TODO is actionable and clear
