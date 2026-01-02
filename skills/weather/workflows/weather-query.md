# Weather Query Workflow

## When User Asks About Weather

### Step 1: Parse the Request

Identify:
- **Location**: Extract city/zip, or use default
- **Timeframe**: Current, today, tomorrow, forecast
- **Specific info**: Temperature, rain, wind, etc.

### Step 2: Execute Appropriate Tool

**For current weather:**
```bash
~/ARDEN/skills/weather/tools/get-weather.sh "LOCATION"
```

**For forecast:**
```bash
~/ARDEN/skills/weather/tools/get-forecast.sh "LOCATION"
```

### Step 3: Format Response

**For Voice (Telegram/Audio):**
- Keep under 30 seconds
- Lead with the most important info
- Add one actionable recommendation

**Template:**
```
Currently [TEMP] and [CONDITIONS] in [LOCATION]. 
[Add feels-like if >5 degrees different]
[Mention rain/snow if expected]
[Give high/low for today]
Recommendation: [umbrella/jacket/sunscreen/etc]
```

**For Text:**
- Can be more detailed
- Include full forecast
- Format with bullet points

### Step 4: Add Context

Consider adding:
- Comparison to yesterday
- Unusual conditions
- Relevant alerts
- Time-appropriate advice (morning vs evening)

## Example Interactions

### Example 1: Simple Query

**User:** "What's the weather?"

**Steps:**
1. No location specified → use default (Chicago)
2. No timeframe → current weather
3. Run: `get-weather.sh "Chicago"`
4. Format for voice

**Response:**
"Currently 45 degrees and partly cloudy in Chicago. Feels like 42. Light winds at 8 miles per hour. No rain expected today. High of 52, low of 38. Light jacket should be fine."

### Example 2: Specific Location

**User:** "What's the weather in New York?"

**Steps:**
1. Location: New York
2. Timeframe: Current
3. Run: `get-weather.sh "New York"`
4. Format response

**Response:**
"In New York, it's currently 38 degrees and clear. Wind chill makes it feel like 32. Expect a high of 42 today. It's cold out there, bundle up!"

### Example 3: Forecast Request

**User:** "Will it rain tomorrow?"

**Steps:**
1. Location: Default (Chicago)
2. Timeframe: Tomorrow
3. Run: `get-forecast.sh "Chicago"`
4. Extract rain info for tomorrow
5. Format response

**Response:**
"Tomorrow in Chicago: Partly cloudy with a high of 48. 20% chance of light rain in the afternoon. You should be fine without an umbrella, but keep an eye on it."

### Example 4: Travel Planning

**User:** "What's the weather going to be like in Miami this weekend?"

**Steps:**
1. Location: Miami
2. Timeframe: 3-day forecast
3. Run: `get-forecast.sh "Miami"`
4. Summarize weekend days
5. Add travel recommendations

**Response:**
"This weekend in Miami: Saturday will be sunny and 78 degrees, Sunday partly cloudy at 75. Low humidity, light breeze. Perfect beach weather! Don't forget sunscreen."

## Voice Optimization Tips

1. **Lead with action**: If they're asking about rain, start with yes/no
2. **Round numbers**: "About 45 degrees" not "44.7 degrees"
3. **Natural language**: "Light jacket weather" not "Temperature suggests light outerwear"
4. **Single units**: Fahrenheit OR Celsius, not both
5. **Chunk information**: Pause between related concepts

## Error Handling

### Location not found
"I couldn't find weather for '[LOCATION]'. Could you try a different city name or zip code?"

### Network error
"I'm having trouble getting weather data right now. Please try again in a moment."

### Ambiguous location
"There are multiple places called '[LOCATION]'. Could you be more specific? For example, 'Portland, Oregon' or 'Portland, Maine'?"

## Integration with Other Skills

### Daily Planning
Include weather in morning briefing:
"Good morning! It's 42 degrees and sunny. Perfect day for that outdoor meeting at 2pm."

### Note Taking
Can add weather context to notes:
"Meeting with John (72° and sunny - met at outdoor cafe)"

### Calendar
Suggest weather-appropriate scheduling:
"You have an outdoor event planned. Current forecast shows 60% rain. Should I suggest moving it indoors?"
