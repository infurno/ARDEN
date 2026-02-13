---
name: weather
version: 1.0.0
enabled: true
triggers:
  - "weather in {location}"
  - "temperature in {location}"
  - "forecast for {location}"
patterns:
  - "weather\\s+(?:in|for)\\s+(.+)"
  - "what'?s\\s+the\\s+weather\\s+(?:in|for)\\s+(.+)"
  - "how'?s\\s+the\\s+weather\\s+(?:in|for)\\s+(.+)"
  - "temperature\\s+in\\s+(.+)"
  - "current\\s+conditions?\\s+(?:for|in)\\s+(.+)"
  - "forecast\\s+(?:for|in)\\s+(.+)"
entry: tools/get-weather.sh
timeout: 15000
agents: [assistant, analyst]
---

# Weather Skill

## Purpose
Get current weather information and forecasts for any location.

## How to Execute This Skill

When the user asks about weather, use the Bash tool to run:

```bash
~/ARDEN/skills/weather/tools/get-weather.sh "LOCATION"
```

Where LOCATION = city name, zip code, or "current" for user's current location

**Examples:**
```bash
~/ARDEN/skills/weather/tools/get-weather.sh "Chicago"
~/ARDEN/skills/weather/tools/get-weather.sh "60601"
~/ARDEN/skills/weather/tools/get-weather.sh "New York"
```

The script returns weather info in a voice-friendly format.

## When to Invoke

This skill should be automatically invoked when the user:
- Asks about the weather
- Says "what's the weather"
- Asks "how's the weather in [location]"
- Says "weather forecast"
- Asks "should I bring an umbrella"
- Asks about temperature
- Asks if it will rain/snow

## Capabilities
- Get current weather conditions
- Temperature (actual and feels-like)
- Precipitation chance
- Wind speed and direction
- Humidity
- 3-day forecast
- Weather alerts
- Sunrise/sunset times

## Voice Interaction Design

### Input Patterns
- "What's the weather?"
- "What's the weather in Chicago?"
- "Will it rain today?"
- "What's the temperature?"
- "Weather forecast for tomorrow"

### Output Format
Voice responses should be:
- **Concise**: Temperature, conditions, key info
- **Actionable**: Include recommendations (bring umbrella, wear jacket, etc.)
- **Brief**: Under 30 seconds to speak

### Example Voice Interaction

**User**: "What's the weather like?"

**ARDEN**: 
> Currently 45 degrees and partly cloudy in Chicago. Feels like 42. 
> Light winds from the west at 8 miles per hour.
> No rain expected today. High of 52, low of 38.
> Recommendation: Light jacket should be fine.

**User**: "Will it rain tomorrow?"

**ARDEN**:
> Tomorrow in Chicago: 30% chance of rain in the afternoon. 
> High of 48, mostly cloudy.
> You might want to keep an umbrella handy.

## Configuration

Default location can be set in `skills/weather/context/default-location.txt`

## Tools
- `get-weather.sh` - Fetch current weather for a location
- `get-forecast.sh` - Get 3-day forecast
- `weather-alert.sh` - Check for weather alerts

## Context Files
- `default-location.txt` - User's default location
- `weather-preferences.md` - Temperature units, detail level

## Dependencies
- curl (built-in)
- Internet connection
- Uses wttr.in API (free, no API key needed)

## Agent Preferences
Best used with:
- **Assistant** agent - General weather queries
- **Analyst** agent - Detailed forecasts and patterns
