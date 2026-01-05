#!/bin/bash

# ARDEN TODO Consolidation Script
# Parses TODO files in ~/Notes/todos/ and consolidates them into todo.md

NOTES_DIR="$HOME/Notes"
TODOS_DIR="$NOTES_DIR/todos"
OUTPUT_FILE="$NOTES_DIR/todo.md"
TEMP_FILE="/tmp/arden-todos-$$.md"
STATS_FILE="/tmp/arden-stats-$$.txt"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== ARDEN TODO Consolidator ===${NC}"
echo -e "Scanning: $TODOS_DIR"
echo -e "Output: $OUTPUT_FILE\n"

# Check if todos directory exists
if [ ! -d "$TODOS_DIR" ]; then
    echo -e "${YELLOW}Creating todos directory: $TODOS_DIR${NC}"
    mkdir -p "$TODOS_DIR"
    
    # Create initial TODO files
    cat > "$TODOS_DIR/work.md" << 'EOF'
# Work TODOs

- [ ] Example work task
EOF
    
    cat > "$TODOS_DIR/personal.md" << 'EOF'
# Personal TODOs

- [ ] Example personal task
EOF
    
    cat > "$TODOS_DIR/side-projects.md" << 'EOF'
# Side Projects

- [ ] Example side project task
EOF
    
    echo -e "${GREEN}✓${NC} Created initial TODO files in $TODOS_DIR"
fi

# Create header for TODO file
cat > "$TEMP_FILE" << 'HEADER'
---
id: consolidated-todos
title: Consolidated TODO List
author: Hal Borland
last_updated: TIMESTAMP
generated_by: ARDEN
source: todos directory only
---

# Consolidated TODO List

> **Auto-generated** by ARDEN TODO Consolidator
> Last updated: TIMESTAMP
> Source: Only scans `~/Notes/todos/` directory (work, personal, side projects)

This file contains all TODO items from your dedicated TODO files.
**Note**: TODOs in regular notes are NOT included.

---

HEADER

# Replace timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
sed -i "s/TIMESTAMP/$TIMESTAMP/g" "$TEMP_FILE"

# Initialize stats file
echo "0 0 0 0" > "$STATS_FILE"

# Find all markdown files and search for TODOs
echo -e "${YELLOW}Scanning TODO files in todos/ directory...${NC}\n"

# Create a temporary file list - only scan todos/ directory
FILELIST="/tmp/arden-files-$$.txt"
find "$TODOS_DIR" -type f -name "*.md" -printf '%T@ %p\n' 2>/dev/null | \
sort -rn | cut -d' ' -f2- > "$FILELIST"

# Check if any files were found
if [ ! -s "$FILELIST" ]; then
    echo -e "${YELLOW}No TODO files found in $TODOS_DIR${NC}"
    echo -e "${YELLOW}Creating default TODO files...${NC}\n"
    
    # Create default files if none exist
    mkdir -p "$TODOS_DIR"
    echo "# Work TODOs" > "$TODOS_DIR/work.md"
    echo "" >> "$TODOS_DIR/work.md"
    echo "- [ ] Example work task" >> "$TODOS_DIR/work.md"
    
    echo "# Personal TODOs" > "$TODOS_DIR/personal.md"
    echo "" >> "$TODOS_DIR/personal.md"
    echo "- [ ] Example personal task" >> "$TODOS_DIR/personal.md"
    
    echo "# Side Projects" > "$TODOS_DIR/side-projects.md"
    echo "" >> "$TODOS_DIR/side-projects.md"
    echo "- [ ] Example side project task" >> "$TODOS_DIR/side-projects.md"
    
    # Re-scan
    find "$TODOS_DIR" -type f -name "*.md" -printf '%T@ %p\n' 2>/dev/null | \
    sort -rn | cut -d' ' -f2- > "$FILELIST"
fi

# Process each file
while read -r file; do
    # Search for TODO patterns:
    # - [ ] unchecked checkboxes
    # - [x] checked checkboxes
    # - [X] checked checkboxes
    # - TODO: text
    # - todo: text
    # - #todo tags
    
    TODOS=$(grep -niE '(- \[ \]|- \[x\]|- \[X\]|TODO:|todo:|#todo)' "$file" 2>/dev/null)
    
    if [ -n "$TODOS" ]; then
        # Make path relative to Notes directory for cleaner display
        RELPATH="${file#$NOTES_DIR/}"
        
        echo -e "${GREEN}✓${NC} Found TODOs in: $RELPATH"
        
        # Add section header to output
        echo "" >> "$TEMP_FILE"
        echo "## 📄 $RELPATH" >> "$TEMP_FILE"
        echo "" >> "$TEMP_FILE"
        
        # Read current stats
        read TOTAL_TODOS TOTAL_FILES TOTAL_CHECKED TOTAL_UNCHECKED < "$STATS_FILE"
        
        # Increment file counter
        ((TOTAL_FILES++))
        
        # Process each TODO line
        while IFS= read -r line; do
            # Extract line number and content
            LINE_NUM=$(echo "$line" | cut -d: -f1)
            CONTENT=$(echo "$line" | cut -d: -f2-)
            
            # Clean up the content
            CONTENT=$(echo "$CONTENT" | sed 's/^[[:space:]]*//')
            
            # Add to output with source reference
            echo "$CONTENT" >> "$TEMP_FILE"
            echo "  *Source: $RELPATH:$LINE_NUM*" >> "$TEMP_FILE"
            echo "" >> "$TEMP_FILE"
            
            ((TOTAL_TODOS++))
            
            # Count checked vs unchecked
            if echo "$CONTENT" | grep -qE '\[x\]|\[X\]'; then
                ((TOTAL_CHECKED++))
            elif echo "$CONTENT" | grep -qE '\[ \]'; then
                ((TOTAL_UNCHECKED++))
            fi
            
        done <<< "$TODOS"
        
        # Update stats file
        echo "$TOTAL_TODOS $TOTAL_FILES $TOTAL_CHECKED $TOTAL_UNCHECKED" > "$STATS_FILE"
    fi
done < "$FILELIST"

# Read final stats
read TOTAL_TODOS TOTAL_FILES TOTAL_CHECKED TOTAL_UNCHECKED < "$STATS_FILE"

# Add statistics footer
cat >> "$TEMP_FILE" << 'FOOTER'

---

## 📊 Statistics

FOOTER

echo "- **Total TODO items found**: $TOTAL_TODOS" >> "$TEMP_FILE"
echo "- **Files with TODOs**: $TOTAL_FILES" >> "$TEMP_FILE"
echo "- **Unchecked items**: $TOTAL_UNCHECKED" >> "$TEMP_FILE"
echo "- **Checked items**: $TOTAL_CHECKED" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"
echo "---" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"
echo "*Generated by ARDEN TODO Consolidator on $TIMESTAMP*" >> "$TEMP_FILE"

# Move temp file to final location
mv "$TEMP_FILE" "$OUTPUT_FILE"

# Clean up
rm -f "$STATS_FILE" "$FILELIST"

# Print summary
echo ""
echo -e "${BLUE}=== Consolidation Complete ===${NC}"
echo -e "${GREEN}✓${NC} Found $TOTAL_TODOS TODO items"
echo -e "${GREEN}✓${NC} Across $TOTAL_FILES files"
echo -e "${GREEN}✓${NC} Unchecked: $TOTAL_UNCHECKED | Checked: $TOTAL_CHECKED"
echo ""
echo -e "Output saved to: ${YELLOW}$OUTPUT_FILE${NC}"
echo ""

# Preview
if command -v bat &> /dev/null; then
    echo -e "Preview (first 100 lines):"
    bat -l markdown --paging=never --line-range :100 "$OUTPUT_FILE"
elif command -v head &> /dev/null; then
    echo -e "Preview (first 50 lines):"
    head -50 "$OUTPUT_FILE"
else
    echo -e "Run: ${YELLOW}cat $OUTPUT_FILE${NC} to view"
fi
