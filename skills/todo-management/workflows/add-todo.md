# Add TODO Workflow

## Overview
This workflow describes how to add a TODO item when requested by the user.

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

### 3. Determine Target File (Optional)
Check if the user specified a target file, otherwise use default (todo.md).

**Examples:**
- "Add to deployment checklist: test staging" → target-file: "deployment-checklist.md"
- "Add a TODO to review code" → target-file: "todo.md" (default)

### 4. Execute the Tool
Run the add-todo.sh script:

```bash
~/ARDEN/skills/todo-management/tools/add-todo.sh "TODO_TEXT" [target-file]
```

### 5. Parse the Result
The script outputs:
- Success/failure status
- TODO text
- File location
- Confirmation message

### 6. Respond to User
Provide brief confirmation:

**Good Responses:**
- "Added to your TODO list: [TODO_TEXT]"
- "Added: [TODO_TEXT]"
- "I'll remind you to [TODO_TEXT]"

**Avoid:**
- Long explanations
- Repeating system details
- Over-confirming

## Example Executions

### Example 1: Simple TODO
```
User: "Add a TODO to review the deployment logs"

Action: Execute tool
$ ~/ARDEN/skills/todo-management/tools/add-todo.sh "review the deployment logs"

Response: "Added to your TODO list: Review the deployment logs"
```

### Example 2: Natural Language
```
User: "Remind me to send the status update by Friday"

Action: Execute tool
$ ~/ARDEN/skills/todo-management/tools/add-todo.sh "send the status update by Friday"

Response: "Added: Send the status update by Friday"
```

### Example 3: Custom File
```
User: "Add to my deployment checklist: verify database backups"

Action: Execute tool
$ ~/ARDEN/skills/todo-management/tools/add-todo.sh "verify database backups" "deployment-checklist.md"

Response: "Added to deployment checklist: Verify database backups"
```

### Example 4: Implied TODO
```
User: "I need to update the API documentation"

Action: Execute tool
$ ~/ARDEN/skills/todo-management/tools/add-todo.sh "update the API documentation"

Response: "Added to your TODO list: Update the API documentation"
```

## Edge Cases

### Multiple TODOs in One Message
```
User: "Add three TODOs: review code, test deployment, send update"

Action: Execute tool three times
$ ~/ARDEN/skills/todo-management/tools/add-todo.sh "review code"
$ ~/ARDEN/skills/todo-management/tools/add-todo.sh "test deployment"
$ ~/ARDEN/skills/todo-management/tools/add-todo.sh "send update"

Response: "Added 3 items to your TODO list"
```

### Vague Request
```
User: "Add a TODO"

Response: "What would you like me to add to your TODO list?"
```

### TODO with Context
```
User: "Remind me to follow up with Sarah about the Q1 budget meeting we had yesterday"

Action: Execute tool
$ ~/ARDEN/skills/todo-management/tools/add-todo.sh "follow up with Sarah about the Q1 budget meeting"

Response: "Added: Follow up with Sarah about the Q1 budget meeting"
```

## Integration with Voice

### Voice Input Processing
1. User speaks: "Add a TODO to review pull request forty-two"
2. STT converts: "Add a TODO to review pull request 42"
3. Extract TODO: "review pull request 42"
4. Execute tool
5. TTS responds: "Added to your TODO list: Review pull request 42"

### Voice Response Guidelines
- Keep it short and natural
- Confirm the action
- Echo back the TODO for verification
- Use conversational tone

## Error Handling

### Missing TODO Text
```
User: "Add a TODO"
Response: "What would you like me to add to your TODO list?"
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
- Keep responses brief and natural
- Confirm what was added
- Handle edge cases gracefully

### DON'T:
- Add overly long TODO items
- Include conversational filler in TODO text
- Over-explain the process
- Lose important context from user's message

## Testing the Workflow

Test with various inputs:
```bash
# Test via chat
"Add a TODO to review the code"

# Test via voice
"Remind me to call Sarah"

# Test with custom file
"Add to my meeting notes: send follow-up email"

# Test multiple TODOs
"Add TODOs to review code, test deployment, and send update"

# Test vague input
"Add a TODO"
```

## Success Criteria

A successful TODO addition:
1. ✅ TODO is added to the correct file
2. ✅ Consolidation script runs
3. ✅ User receives clear confirmation
4. ✅ TODO appears in web interface
5. ✅ TODO is actionable and clear
