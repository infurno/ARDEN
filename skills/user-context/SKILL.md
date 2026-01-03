# User Context Skill

## Overview
Provides structured user profile and context information to other skills and AI interactions. Ensures consistent personalization across all ARDEN features.

## Purpose
- Supply user profile information to skills
- Maintain consistent context across sessions
- Enable personalized note-taking and task management
- Support context-aware AI responses

## Components

### Tools
- **user_context.sh**: Retrieves user context in multiple formats

### Context Files
User context is sourced from:
- `~/Notes/profile.md`: Primary user profile (maintained by user)
- Fallback variables in `user_context.sh` if profile.md is unavailable

## Usage

### Command Line
```bash
# Get user context in text format (default)
~/ARDEN/skills/user-context/tools/user_context.sh

# Get user context in JSON format
~/ARDEN/skills/user-context/tools/user_context.sh json

# Get compact context (for embedding in notes)
~/ARDEN/skills/user-context/tools/user_context.sh compact
```

### In Other Skills
```bash
# Include user context in a note
USER_CONTEXT=$(~/ARDEN/skills/user-context/tools/user_context.sh compact)
echo "Author: $USER_CONTEXT" >> my-note.md

# Get full context for AI prompts
USER_INFO=$(~/ARDEN/skills/user-context/tools/user_context.sh text)
```

### In JavaScript/Node.js
```javascript
const { execSync } = require('child_process');

// Get user context as text
const userContext = execSync(
  '~/ARDEN/skills/user-context/tools/user_context.sh text'
).toString();

// Get user context as JSON
const userContextJson = JSON.parse(
  execSync('~/ARDEN/skills/user-context/tools/user_context.sh json').toString()
);
```

## Output Formats

### Text Format (Default)
Human-readable format with sections:
- Personal Information
- Work Context
- Environment
- Communication Preferences

### JSON Format
Structured JSON for programmatic use:
```json
{
  "personal": { "name": "...", "role": "...", ... },
  "work_context": { ... },
  "environment": { ... },
  "preferences": { ... }
}
```

### Compact Format
Single-line summary for embedding in notes:
```
Context: Hal Borland | Strategic Engineer @ FedEx Freight | Chicago | Tech: K8S, VMware, Azure, Linux
```

## Integration Points

### Note-Taking Skill
The note-taking skill uses user context to:
- Add author information to notes
- Personalize note templates
- Include relevant work context

### Context Loader Service
The `context-loader.js` service uses user context to:
- Provide AI with user background
- Enable personalized responses
- Maintain conversation context

### Daily Planning Skill
Uses user context to:
- Customize morning briefings
- Include relevant work information
- Adapt to user preferences

## Configuration

User context is defined in `~/Notes/profile.md`. Update this file to change:
- Personal information
- Work context
- Technologies
- Preferences
- Current project status

The user_context.sh script reads from this file for the most up-to-date information.

## Maintenance

### Updating User Context
1. Edit `~/Notes/profile.md` with current information
2. Changes are immediately available to all skills
3. No restart required

### Adding New Context Fields
1. Update `~/Notes/profile.md` with new sections
2. Modify `user_context.sh` to parse new fields
3. Update documentation

## Examples

### Example 1: Add Context to Note
```bash
#!/bin/bash
NOTE_FILE="$HOME/Notes/daily/$(date +%Y-%m-%d).md"
CONTEXT=$(~/ARDEN/skills/user-context/tools/user_context.sh compact)

echo "---" > "$NOTE_FILE"
echo "author: $CONTEXT" >> "$NOTE_FILE"
echo "date: $(date)" >> "$NOTE_FILE"
echo "---" >> "$NOTE_FILE"
echo "" >> "$NOTE_FILE"
echo "# Daily Notes" >> "$NOTE_FILE"
```

### Example 2: Use in AI Context
```javascript
const userContext = execSync(
  '~/ARDEN/skills/user-context/tools/user_context.sh text'
).toString();

const aiPrompt = `
${userContext}

Based on the user context above, help with the following task:
${userRequest}
`;
```

## Benefits
- **Consistency**: Same context across all skills
- **Personalization**: Tailored responses and actions
- **Efficiency**: No need to repeat user information
- **Maintainability**: Single source of truth in profile.md

## Related Skills
- **note-taking**: Uses context for note authorship
- **daily-planning**: Uses context for personalized briefings
- **weather**: Uses location from context

## Future Enhancements
- Auto-detect changes to profile.md
- Cache context for performance
- Add project-specific context
- Include active TODO context
- Time-based context (work hours, weekends)
