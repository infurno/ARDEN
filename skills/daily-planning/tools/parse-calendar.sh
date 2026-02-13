#!/bin/bash
#
# Parse Calendar Script
# Extracts calendar events from various sources
#

set -e

# Default configuration
DEFAULT_DAYS=1
OUTPUT_FORMAT="text"
DATE_FILTER="today"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --days)
      DAYS="$2"
      shift 2
      ;;
    --date)
      DATE_FILTER="$2"
      shift 2
      ;;
    --format)
      OUTPUT_FORMAT="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: parse-calendar.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --days N       Parse N days (default: 1)"
      echo "  --date DATE    Specific date (YYYY-MM-DD) or 'today', 'tomorrow'"
      echo "  --format TYPE  Output format: text, json (default: text)"
      echo "  --help         Show this help"
      echo ""
      echo "Examples:"
      echo "  parse-calendar.sh --date today"
      echo "  parse-calendar.sh --date tomorrow --format json"
      echo "  parse-calendar.sh --days 7"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Resolve date filter
if [ "$DATE_FILTER" = "today" ]; then
  TARGET_DATE=$(date +%Y-%m-%d)
  DISPLAY_DATE="Today"
elif [ "$DATE_FILTER" = "tomorrow" ]; then
  TARGET_DATE=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "tomorrow" +%Y-%m-%d)
  DISPLAY_DATE="Tomorrow"
else
  TARGET_DATE="$DATE_FILTER"
  DISPLAY_DATE="$TARGET_DATE"
fi

# Function to parse calendar from various sources
parse_calendars() {
  local target_date="$1"
  local events=""
  
  # Try to find calendar files in common locations
  CALENDAR_PATHS=(
    "$HOME/.calendar"
    "$HOME/Notes/calendar"
    "$HOME/.local/share/calendar"
  )
  
  for cal_path in "${CALENDAR_PATHS[@]}"; do
    if [ -d "$cal_path" ]; then
      # Look for calendar files
      for cal_file in "$cal_path"/*.ics "$cal_path"/*.json "$cal_path"/*.md; do
        if [ -f "$cal_file" ]; then
          events+=$(extract_events "$cal_file" "$target_date")
        fi
      done
    fi
  done
  
  # Also check for inline calendar in notes
  if [ -f "$HOME/Notes/calendar.md" ]; then
    events+=$(parse_markdown_calendar "$HOME/Notes/calendar.md" "$target_date")
  fi
  
  echo "$events"
}

# Extract events from various file formats
extract_events() {
  local file="$1"
  local date="$2"
  local ext="${file##*.}"
  
  case "$ext" in
    ics)
      parse_ics "$file" "$date"
      ;;
    json)
      parse_json_calendar "$file" "$date"
      ;;
    md)
      parse_markdown_calendar "$file" "$date"
      ;;
  esac
}

# Parse iCalendar format (.ics)
parse_ics() {
  local file="$1"
  local target_date="$2"
  
  # Basic ICS parsing - extract VEVENT blocks
  awk -v date="$target_date" '
    BEGIN { in_event = 0; summary = ""; start = ""; duration = ""; }
    /^BEGIN:VEVENT/ { in_event = 1; }
    /^END:VEVENT/ {
      in_event = 0;
      if (summary != "" && start != "") {
        print summary "|" start "|" duration;
      }
      summary = ""; start = ""; duration = "";
    }
    in_event && /^SUMMARY:/ { summary = substr($0, 9); }
    in_event && /^DTSTART:/ { 
      # Extract date and time
      datetime = substr($0, 9);
      if (length(datetime) >= 8) {
        event_date = substr(datetime, 1, 4) "-" substr(datetime, 5, 2) "-" substr(datetime, 7, 2);
        if (event_date == date) {
          if (length(datetime) >= 13) {
            start = substr(datetime, 10, 2) ":" substr(datetime, 12, 2);
          } else {
            start = "All day";
          }
        }
      }
    }
    in_event && /^DURATION:/ {
      duration = substr($0, 11);
    }
  ' "$file"
}

# Parse JSON calendar format
parse_json_calendar() {
  local file="$1"
  local target_date="$2"
  
  # Simple JSON parsing using jq if available
  if command -v jq &> /dev/null; then
    jq -r --arg date "$target_date" '
      .events[] | select(.date == $date) |
      "\(.summary)|\(.start_time // "All day")|\(.duration // "")"
    ' "$file" 2>/dev/null || echo ""
  fi
}

# Parse markdown calendar format
parse_markdown_calendar() {
  local file="$1"
  local target_date="$2"
  
  # Parse markdown tables or lists with date patterns
  awk -v date="$target_date" '
    # Look for date headers
    $0 ~ "^## " date { in_section = 1; next; }
    /^## / && in_section { in_section = 0; }
    
    in_section && /^- / {
      # Parse event line: "- 9:00 AM - 10:00 AM: Meeting Name"
      if (match($0, /- ([0-9]+:[0-9]+ ?[AP]M) - ([0-9]+:[0-9]+ ?[AP]M): (.+)/, arr)) {
        print arr[3] "|" arr[1] "|" arr[2];
      }
      # Parse all-day: "- All day: Event Name"
      else if (match($0, /- All day: (.+)/, arr)) {
        print arr[1] "|All day|";
      }
    }
  ' "$file"
}

# Main execution
echo "📅 Calendar Events for $DISPLAY_DATE ($TARGET_DATE)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Parse events
events=$(parse_calendars "$TARGET_DATE")

if [ -z "$events" ]; then
  echo "No calendar events found for $DISPLAY_DATE."
  echo ""
  echo "💡 Tips:"
  echo "  • Add calendar files to ~/.calendar/ or ~/Notes/calendar.md"
  echo "  • Supports .ics, .json, and .md formats"
  echo "  • Run with --help for more options"
else
  # Sort events by start time
  sorted_events=$(echo "$events" | sort -t'|' -k2)
  
  if [ "$OUTPUT_FORMAT" = "json" ]; then
    # Output as JSON
    echo "["
    first=true
    echo "$sorted_events" | while IFS='|' read -r summary start_time duration; do
      if [ "$first" = true ]; then
        first=false
      else
        echo ","
      fi
      echo "  {"
      echo "    \"summary\": \"$summary\","
      echo "    \"start_time\": \"$start_time\","
      echo "    \"duration\": \"$duration\""
      echo -n "  }"
    done
    echo ""
    echo "]"
  else
    # Output as text
    echo "$sorted_events" | while IFS='|' read -r summary start_time duration; do
      if [ "$start_time" = "All day" ]; then
        echo "🌅 All day: $summary"
      else
        if [ -n "$duration" ]; then
          echo "🕐 $start_time - $duration: $summary"
        else
          echo "🕐 $start_time: $summary"
        fi
      fi
    done
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
