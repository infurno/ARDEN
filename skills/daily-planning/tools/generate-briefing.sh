#!/bin/bash
#
# Daily Planning Briefing Script
# Scans TODOs and recent notes to create a daily briefing
#

set -e

# Configuration
NOTES_DIR="$HOME/Notes"
TODOS_DIR="$NOTES_DIR/todos"
DAYS_BACK=7  # Look at notes from last 7 days

# Colors for terminal output (won't show in chat but helps with debugging)
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current date/time info
CURRENT_DATE=$(date "+%A, %B %d, %Y")
CURRENT_TIME=$(date "+%I:%M %p")
GREETING="Good morning"
HOUR=$(date "+%H")
if [ "$HOUR" -ge 12 ] && [ "$HOUR" -lt 17 ]; then
  GREETING="Good afternoon"
elif [ "$HOUR" -ge 17 ]; then
  GREETING="Good evening"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📅 DAILY BRIEFING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$GREETING! It's $CURRENT_DATE at $CURRENT_TIME"
echo ""

# ============================================
# SECTION 1: TODO SUMMARY
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ YOUR TODOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d "$TODOS_DIR" ]; then
  # Count TODOs by category
  WORK_TOTAL=0
  WORK_PENDING=0
  PERSONAL_TOTAL=0
  PERSONAL_PENDING=0
  SIDE_TOTAL=0
  SIDE_PENDING=0
  
  # Work TODOs
  if [ -f "$TODOS_DIR/work.md" ]; then
    WORK_TOTAL=$(grep -c "^- \[" "$TODOS_DIR/work.md" 2>/dev/null) || WORK_TOTAL=0
    WORK_PENDING=$(grep -c "^- \[ \]" "$TODOS_DIR/work.md" 2>/dev/null) || WORK_PENDING=0
  fi
  
  # Personal TODOs
  if [ -f "$TODOS_DIR/personal.md" ]; then
    PERSONAL_TOTAL=$(grep -c "^- \[" "$TODOS_DIR/personal.md" 2>/dev/null) || PERSONAL_TOTAL=0
    PERSONAL_PENDING=$(grep -c "^- \[ \]" "$TODOS_DIR/personal.md" 2>/dev/null) || PERSONAL_PENDING=0
  fi
  
  # Side Projects TODOs
  if [ -f "$TODOS_DIR/side-projects.md" ]; then
    SIDE_TOTAL=$(grep -c "^- \[" "$TODOS_DIR/side-projects.md" 2>/dev/null) || SIDE_TOTAL=0
    SIDE_PENDING=$(grep -c "^- \[ \]" "$TODOS_DIR/side-projects.md" 2>/dev/null) || SIDE_PENDING=0
  fi
  
  # Clean variables (remove whitespace and ensure they're numbers)
  WORK_TOTAL=$(echo "$WORK_TOTAL" | tr -d ' \n\r')
  WORK_PENDING=$(echo "$WORK_PENDING" | tr -d ' \n\r')
  PERSONAL_TOTAL=$(echo "$PERSONAL_TOTAL" | tr -d ' \n\r')
  PERSONAL_PENDING=$(echo "$PERSONAL_PENDING" | tr -d ' \n\r')
  SIDE_TOTAL=$(echo "$SIDE_TOTAL" | tr -d ' \n\r')
  SIDE_PENDING=$(echo "$SIDE_PENDING" | tr -d ' \n\r')
  
  # Default to 0 if empty
  WORK_TOTAL=${WORK_TOTAL:-0}
  WORK_PENDING=${WORK_PENDING:-0}
  PERSONAL_TOTAL=${PERSONAL_TOTAL:-0}
  PERSONAL_PENDING=${PERSONAL_PENDING:-0}
  SIDE_TOTAL=${SIDE_TOTAL:-0}
  SIDE_PENDING=${SIDE_PENDING:-0}
  
  TOTAL_PENDING=$((WORK_PENDING + PERSONAL_PENDING + SIDE_PENDING))
  
  echo "📊 TODO Summary:"
  echo "  • Work: $WORK_PENDING pending (of $WORK_TOTAL total)"
  echo "  • Personal: $PERSONAL_PENDING pending (of $PERSONAL_TOTAL total)"
  echo "  • Side Projects: $SIDE_PENDING pending (of $SIDE_TOTAL total)"
  echo "  • TOTAL: $TOTAL_PENDING pending tasks"
  echo ""
  
  # Show top 5 pending work TODOs
  if [ "$WORK_PENDING" -gt 0 ]; then
    echo "🏢 Top Work TODOs:"
    grep "^- \[ \]" "$TODOS_DIR/work.md" 2>/dev/null | head -5 | sed 's/^- \[ \] /  • /' || echo "  (none)"
    echo ""
  fi
  
  # Show top 5 pending personal TODOs
  if [ "$PERSONAL_PENDING" -gt 0 ]; then
    echo "🏠 Top Personal TODOs:"
    grep "^- \[ \]" "$TODOS_DIR/personal.md" 2>/dev/null | head -5 | sed 's/^- \[ \] /  • /' || echo "  (none)"
    echo ""
  fi
  
  # Show top 3 side project TODOs
  if [ "$SIDE_PENDING" -gt 0 ]; then
    echo "🚀 Side Project TODOs:"
    grep "^- \[ \]" "$TODOS_DIR/side-projects.md" 2>/dev/null | head -3 | sed 's/^- \[ \] /  • /' || echo "  (none)"
    echo ""
  fi
else
  echo "No TODO directory found at $TODOS_DIR"
  echo ""
fi

# ============================================
# SECTION 2: RECENT NOTES
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 RECENT NOTES (Last $DAYS_BACK days)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d "$NOTES_DIR" ]; then
  # Find notes modified in the last N days (excluding todos directory)
  RECENT_NOTES=$(find "$NOTES_DIR" -name "*.md" -type f -mtime -${DAYS_BACK} ! -path "*/todos/*" -exec ls -lt {} + 2>/dev/null | head -10)
  
  if [ -n "$RECENT_NOTES" ]; then
    NOTE_COUNT=$(echo "$RECENT_NOTES" | wc -l | tr -d ' ')
    echo "Found $NOTE_COUNT recent notes:"
    echo ""
    
    # Parse and display recent notes with titles
    find "$NOTES_DIR" -name "*.md" -type f -mtime -${DAYS_BACK} ! -path "*/todos/*" -exec stat -f "%m %N" {} + 2>/dev/null | \
      sort -rn | head -10 | while read -r mtime filepath; do
      
      # Get relative path
      RELATIVE_PATH="${filepath#$NOTES_DIR/}"
      
      # Extract title from first H1 in the file
      TITLE=$(grep -m 1 "^# " "$filepath" 2>/dev/null | sed 's/^# //' || echo "")
      
      # Get modification date
      MOD_DATE=$(date -r "$mtime" "+%b %d, %I:%M %p" 2>/dev/null || echo "")
      
      # Get first line of content (preview)
      PREVIEW=$(head -20 "$filepath" | grep -v "^#" | grep -v "^---" | grep -v "^\s*$" | head -1 | cut -c1-80)
      
      if [ -n "$TITLE" ]; then
        echo "📄 $TITLE"
      else
        echo "📄 $(basename "$filepath" .md)"
      fi
      echo "   📁 $RELATIVE_PATH"
      echo "   🕒 Modified: $MOD_DATE"
      if [ -n "$PREVIEW" ]; then
        echo "   💡 $PREVIEW..."
      fi
      echo ""
    done
  else
    echo "No notes modified in the last $DAYS_BACK days."
    echo ""
  fi
else
  echo "Notes directory not found at $NOTES_DIR"
  echo ""
fi

# ============================================
# SECTION 3: NEW NOTES TODAY
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ NEW NOTES CREATED TODAY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d "$NOTES_DIR" ]; then
  # Find notes created today (birth time = today)
  TODAY_START=$(date -j -f "%Y-%m-%d %H:%M:%S" "$(date +%Y-%m-%d) 00:00:00" "+%s" 2>/dev/null || date +%s)
  
  NEW_TODAY=$(find "$NOTES_DIR" -name "*.md" -type f ! -path "*/todos/*" -newerBt "@$TODAY_START" 2>/dev/null)
  
  if [ -n "$NEW_TODAY" ]; then
    NEW_COUNT=$(echo "$NEW_TODAY" | wc -l | tr -d ' ')
    echo "📝 $NEW_COUNT new notes created today:"
    echo ""
    
    echo "$NEW_TODAY" | while read -r filepath; do
      # Get relative path
      RELATIVE_PATH="${filepath#$NOTES_DIR/}"
      
      # Extract title
      TITLE=$(grep -m 1 "^# " "$filepath" 2>/dev/null | sed 's/^# //' || echo "")
      
      # Get creation time
      CREATED=$(stat -f "%SB" -t "%I:%M %p" "$filepath" 2>/dev/null || echo "")
      
      if [ -n "$TITLE" ]; then
        echo "  ✅ $TITLE"
      else
        echo "  ✅ $(basename "$filepath" .md)"
      fi
      echo "     📁 $RELATIVE_PATH"
      echo "     🕒 Created: $CREATED"
      echo ""
    done
  else
    echo "No new notes created today yet."
    echo ""
  fi
else
  echo "Notes directory not found."
  echo ""
fi

# ============================================
# SECTION 4: QUICK STATS
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📈 QUICK STATS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d "$NOTES_DIR" ]; then
  TOTAL_NOTES=$(find "$NOTES_DIR" -name "*.md" -type f ! -path "*/todos/*" 2>/dev/null | wc -l | tr -d ' ')
  NOTES_THIS_WEEK=$(find "$NOTES_DIR" -name "*.md" -type f -mtime -7 ! -path "*/todos/*" 2>/dev/null | wc -l | tr -d ' ')
  
  echo "📚 Total notes in your second brain: $TOTAL_NOTES"
  echo "📝 Notes modified this week: $NOTES_THIS_WEEK"
  echo "✅ Pending TODOs across all categories: $TOTAL_PENDING"
  echo ""
fi

# ============================================
# SECTION 5: RECOMMENDATIONS
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 RECOMMENDATIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Smart recommendations based on data
if [ "$WORK_PENDING" -gt 10 ]; then
  echo "⚠️  You have $WORK_PENDING work TODOs. Consider prioritizing the top 3 today."
  echo ""
fi

if [ "$PERSONAL_PENDING" -gt 5 ]; then
  echo "🏠 You have $PERSONAL_PENDING personal TODOs. Try to knock out a few quick ones."
  echo ""
fi

if [ "$NOTES_THIS_WEEK" -eq 0 ]; then
  echo "📝 You haven't created any notes this week. Consider capturing your thoughts!"
  echo ""
fi

echo "🎯 Focus suggestion: Pick 3 high-impact tasks from your work TODOs to complete today."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "End of briefing. Have a productive day! 🚀"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
