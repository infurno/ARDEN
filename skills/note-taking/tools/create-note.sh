#!/bin/bash

# ARDEN Note Creation Tool
# Creates a markdown note from user input

# Arguments:
# $1 - Note content
# $2 - Note type (optional: quick, meeting, idea, todo)
# -c flag: Include user context

CONTENT="$1"
NOTE_TYPE="${2:-quick}"
NOTES_DIR="$HOME/Notes"
ARDEN_ROOT="$HOME/ARDEN"

# Check if -c flag was passed (include context)
INCLUDE_CONTEXT=false
if [[ "$*" == *"-c"* ]]; then
  INCLUDE_CONTEXT=true
fi

# Get user context if requested
USER_CONTEXT=""
if [ "$INCLUDE_CONTEXT" = true ]; then
  if [ -f "$ARDEN_ROOT/skills/user-context/tools/user_context.sh" ]; then
    USER_CONTEXT=$("$ARDEN_ROOT/skills/user-context/tools/user_context.sh" compact)
  fi
fi

# Ensure notes directory exists
mkdir -p "$NOTES_DIR"

# Generate filename
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H-%M)

# Extract first few words for slug
SLUG=$(echo "$CONTENT" | head -c 50 | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 ]//g' | tr ' ' '-' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')

# Limit slug length
SLUG=$(echo "$SLUG" | cut -c1-50)

FILENAME="${DATE}-${SLUG}.md"
FILEPATH="$NOTES_DIR/$FILENAME"

# If file exists, append time
if [ -f "$FILEPATH" ]; then
  FILENAME="${DATE}-${SLUG}-${TIME}.md"
  FILEPATH="$NOTES_DIR/$FILENAME"
fi

# Build footer with optional user context
FOOTER="*Created via ARDEN"
if [ -n "$USER_CONTEXT" ]; then
  FOOTER="${FOOTER} | ${USER_CONTEXT}"
fi
FOOTER="${FOOTER}*"

# Generate a title from the content (first 50 chars, capitalized)
TITLE=$(echo "$CONTENT" | head -c 50 | sed 's/^./\U&/' | sed 's/[^a-zA-Z0-9 ]$//')
if [ ${#TITLE} -gt 50 ]; then
  TITLE="${TITLE}..."
fi

# Create note based on type
case "$NOTE_TYPE" in
  quick)
    cat > "$FILEPATH" << NOTEEOF
# $TITLE

$CONTENT

---
${FOOTER}
NOTEEOF
    ;;
    
  meeting)
    cat > "$FILEPATH" << NOTEEOF
# $TITLE

**Date:** ${DATE}
**Time:** $(date +%H:%M)

## Notes

$CONTENT

## Action Items

- [ ] 

---
${FOOTER}
NOTEEOF
    ;;
    
  idea)
    cat > "$FILEPATH" << NOTEEOF
# $TITLE

**Date:** ${DATE}
**Time:** $(date +%H:%M)

## Idea

$CONTENT

## Context



## Next Steps


---
${FOOTER}
NOTEEOF
    ;;
    
  *)
    cat > "$FILEPATH" << NOTEEOF
# $TITLE

**Date:** ${DATE}
**Time:** $(date +%H:%M)

## Content

$CONTENT

---
${FOOTER}
NOTEEOF
    ;;
esac

# Output the filename for confirmation
echo "$FILENAME"
