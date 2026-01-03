#!/bin/bash

# ARDEN Weather Tool
# Gets current weather for a location using wttr.in (free API)

# Get default location from config file
DEFAULT_LOCATION_FILE="$HOME/ARDEN/skills/weather/context/default-location.txt"
if [ -f "$DEFAULT_LOCATION_FILE" ]; then
    DEFAULT_LOCATION=$(head -n 1 "$DEFAULT_LOCATION_FILE" | tr -d '\n\r')
else
    DEFAULT_LOCATION="Farmington, AR"
fi

LOCATION="${1:-$DEFAULT_LOCATION}"  # Use provided location or default

# URL encode the location (replace spaces with +)
LOCATION_ENCODED="${LOCATION// /+}"

# Fetch weather from wttr.in in format optimized for parsing
# Format codes:
# %C = Weather condition
# %t = Temperature
# %f = Feels like
# %h = Humidity  
# %w = Wind
# %p = Precipitation
# %m = Moon phase
# %S = Sunrise
# %s = Sunset

WEATHER_DATA=$(curl -s --connect-timeout 10 "https://wttr.in/${LOCATION_ENCODED}?format=%C+%t+feels+like+%f,+humidity+%h,+wind+%w,+precipitation+%p,+sunrise+%S,+sunset+%s")
CURL_EXIT=$?

# Check if request succeeded
if [ -z "$WEATHER_DATA" ] || [ $CURL_EXIT -ne 0 ]; then
    echo "Error: Unable to fetch weather data. Check your internet connection."
    exit 1
fi

# Check for "Unknown location" error
if echo "$WEATHER_DATA" | grep -q "Unknown location"; then
    echo "Error: Unknown location '$LOCATION'. Please try a different city name or zip code."
    exit 1
fi

# Get location name (formatted)
LOCATION_NAME=$(curl -s --connect-timeout 10 "https://wttr.in/${LOCATION_ENCODED}?format=%l")

# Parse the weather data
echo "Weather for ${LOCATION_NAME}:"
echo "$WEATHER_DATA"

# Get simple forecast for next 2 days
echo ""
echo "Forecast:"
curl -s --connect-timeout 10 "https://wttr.in/${LOCATION_ENCODED}?format=Tomorrow:+%C+High+%t\nDay+after:+%C+High+%t"

# Optional: Add weather recommendation
TEMP_NUM=$(echo "$WEATHER_DATA" | grep -oE '\+?-?[0-9]+' | head -1)
CONDITIONS=$(echo "$WEATHER_DATA" | awk '{print $1}')

echo ""
echo "Recommendation:"
if echo "$WEATHER_DATA" | grep -qi "rain\|shower"; then
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

if echo "$WEATHER_DATA" | grep -qi "wind.*[2-9][0-9]"; then
    echo "- Windy conditions, secure loose items"
fi
