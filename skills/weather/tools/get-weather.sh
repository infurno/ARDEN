#!/bin/bash

# ARDEN Weather Tool
# Gets current weather for a location using wttr.in (free API)

# Get script directory and ARDEN root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARDEN_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Get default location from config file
DEFAULT_LOCATION_FILE="$ARDEN_ROOT/skills/weather/context/default-location.txt"
if [ -f "$DEFAULT_LOCATION_FILE" ]; then
    DEFAULT_LOCATION=$(head -n 1 "$DEFAULT_LOCATION_FILE" | tr -d '\n\r')
else
    DEFAULT_LOCATION="Farmington, AR"
fi

LOCATION="${1:-$DEFAULT_LOCATION}"  # Use provided location or default

# URL encode the location (replace spaces with +)
LOCATION_ENCODED="${LOCATION// /+}"

# Fetch weather data in a single call (faster and more reliable)
WEATHER_RAW=$(curl -s --connect-timeout 5 --max-time 8 "https://wttr.in/${LOCATION_ENCODED}?format=%l|%C|%t|%f|%h|%w|%p" 2>/dev/null)

# Check if request succeeded
if [ -z "$WEATHER_RAW" ]; then
    echo "Error: Unable to fetch weather data. Check your internet connection."
    exit 1
fi

# Check for "Unknown location" error
if echo "$WEATHER_RAW" | grep -q "Unknown location"; then
    echo "Error: Unknown location '$LOCATION'. Please try a different city name or zip code."
    exit 1
fi

# Parse the pipe-separated data
IFS='|' read -r LOCATION_NAME CONDITION TEMP FEELS_LIKE HUMIDITY WIND PRECIPITATION <<< "$WEATHER_RAW"

# Display weather in clean format
echo "Location: ${LOCATION_NAME}"
echo "Condition: ${CONDITION}"
echo "Temperature: ${TEMP}"
echo "Feels like: ${FEELS_LIKE}"
echo "Humidity: ${HUMIDITY}"
echo "Wind: ${WIND}"
echo "Precipitation: ${PRECIPITATION}"
echo ""
echo ""

# Optional: Add weather recommendation
TEMP_NUM=$(echo "$TEMP" | grep -oE '\+?-?[0-9]+' | head -1)

echo "Recommendation:"

# Extract temperature number for recommendations
TEMP_NUM=$(echo "$TEMP" | grep -oE '\+?-?[0-9]+' | head -1)
WIND_SPEED=$(echo "$WIND" | grep -oE '[0-9]+' | head -1)

if echo "$CONDITION" | grep -qi "rain\|shower"; then
    echo "- Bring an umbrella"
fi

if [ ! -z "$TEMP_NUM" ]; then
    # Remove + or - sign for comparison
    TEMP_ABS=$(echo "$TEMP_NUM" | tr -d '+-')
    
    if [ "$TEMP_ABS" -lt 40 ]; then
        echo "- Wear a heavy coat, it's cold!"
    elif [ "$TEMP_ABS" -lt 60 ]; then
        echo "- Light jacket recommended"
    elif [ "$TEMP_ABS" -lt 75 ]; then
        echo "- Comfortable weather, dress casually"
    else
        echo "- It's warm! Light clothing recommended"
    fi
fi

if [ ! -z "$WIND_SPEED" ] && [ "$WIND_SPEED" -gt 20 ]; then
    echo "- Windy conditions, secure loose items"
fi
