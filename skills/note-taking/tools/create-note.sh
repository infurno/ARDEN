#!/bin/bash

# ARDEN Note Creation Tool
# Creates a markdown note from user input

# Arguments:
# $1 - Note content
# $2 - Note type (optional: quick, meeting, idea, todo)

CONTENT="$1"
NOTE_TYPE="${2:-quick}"
NOTES_DIR="$HOME/Notes"

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

# Create note based on type
case "$NOTE_TYPE" in
  quick)
    cat > "$FILEPATH" << NOTEEOF
# Quick Note

$CONTENT

---
*${DATE} ${TIME} - Created via ARDEN*
NOTEEOF
    ;;
    
  meeting)
    cat > "$FILEPATH" << NOTEEOF
# Meeting Note

**Date:** ${DATE}
**Time:** $(date +%H:%M)

## Notes

$CONTENT

## Action Items

- [ ] 

---
*Created via ARDEN*
NOTEEOF
    ;;
    
  idea)
    cat > "$FILEPATH" << NOTEEOF
# Idea

**Date:** ${DATE}
**Time:** $(date +%H:%M)

## Idea

$CONTENT

## Context


## Next Steps


---
*Created via ARDEN*
NOTEEOF
    ;;
    
  *)
    cat > "$FILEPATH" << NOTEEOF
# Note

**Date:** ${DATE}
**Time:** $(date +%H:%M)

## Content

$CONTENT

---
*Created via ARDEN voice assistant*
NOTEEOF
    ;;
esac

# Output the filename for confirmation
echo "$FILENAME"
