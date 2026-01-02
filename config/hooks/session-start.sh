#!/bin/bash

# ARDEN Session Start Hook
# Automatically executed when a Claude Code session begins
# Loads context, initializes tracking, and prepares the environment

ARDEN_HOME="$HOME/ARDEN"
SESSION_DATE=$(date +%Y-%m-%d)
SESSION_TIME=$(date +%H-%M-%S)
SESSION_DIR="$ARDEN_HOME/history/sessions/$SESSION_DATE"
SESSION_FILE="$SESSION_DIR/session_${SESSION_TIME}.md"

# Create session directory
mkdir -p "$SESSION_DIR"

# Create session log
cat > "$SESSION_FILE" << EOF
# ARDEN Session Log
Date: $SESSION_DATE
Time: $SESSION_TIME
Session ID: ${SESSION_DATE}_${SESSION_TIME}

## Session Start
- Working Directory: $(pwd)
- User: $(whoami)
- System: $(uname -s)

## Loaded Skills
EOF

# List available skills
if [ -d "$ARDEN_HOME/skills" ]; then
  find "$ARDEN_HOME/skills" -name "SKILL.md" -type f | while read -r skill; do
    skill_name=$(basename $(dirname "$skill"))
    echo "- $skill_name" >> "$SESSION_FILE"
  done
fi

cat >> "$SESSION_FILE" << EOF

## Context Loaded
- Configuration: config/arden.json
- Agents: Available
- Voice: Enabled

## Session Activity
EOF

# Output session info
echo "📝 Session logged: $SESSION_FILE"

# Load ARDEN system prompt enhancement
if [ -f "$ARDEN_HOME/config/system-prompt.md" ]; then
  echo "🧠 ARDEN context loaded"
fi

# Check for scheduled routines
current_hour=$(date +%H)

# Morning briefing (8 AM)
if [ "$current_hour" -eq 8 ]; then
  echo "🌅 Morning briefing time! Say 'morning briefing' to get started."
fi

# Evening review (6 PM)
if [ "$current_hour" -eq 18 ]; then
  echo "🌆 Evening review time! Say 'evening review' when ready."
fi

echo "✅ ARDEN initialized"
