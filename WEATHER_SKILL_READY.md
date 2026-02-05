# ☁️ Weather Skill - Ready!

Your ARDEN can now get real-time weather information!

## What You Can Ask

### Current Weather
- "What's the weather?"
- "What's the temperature?"
- "How's the weather in Chicago?"
- "Weather for New York"

### Forecasts
- "Will it rain today?"
- "Weather forecast for tomorrow"
- "What's the weather this weekend?"

### Specific Info
- "Should I bring an umbrella?"
- "Is it cold outside?"
- "Do I need a jacket?"

## How It Works

ARDEN uses **wttr.in** - a free weather API that requires no API key!

When you ask about weather, ARDEN:
1. Identifies the location (or uses default)
2. Fetches current weather data
3. Formats it in a voice-friendly way
4. Adds helpful recommendations

## Your Setup

**Default Location:** Chicago
- Change it: Edit `~/ARDEN/skills/weather/context/default-location.txt`

**Tools Available:**
- `get-weather.sh` - Current conditions + today's forecast
- `get-forecast.sh` - 3-day detailed forecast

## Test It Now!

### Via Command Line
```bash
# Current weather for default location
~/ARDEN/skills/weather/tools/get-weather.sh

# Weather for specific city
~/ARDEN/skills/weather/tools/get-weather.sh "New York"

# Weather by zip code
~/ARDEN/skills/weather/tools/get-weather.sh "60601"

# International
~/ARDEN/skills/weather/tools/get-weather.sh "London,UK"
~/ARDEN/skills/weather/tools/get-weather.sh "Tokyo"

# 3-day forecast
~/ARDEN/skills/weather/tools/get-forecast.sh "Chicago"
```

### Via Telegram Bot

Just send a voice or text message:

**Voice:** "Hey, what's the weather like?"

**ARDEN will respond with:**
> Currently 24 degrees and partly cloudy in Chicago. Feels like 16. Light winds at 7 miles per hour. No precipitation expected. High of 24, low of 18. 
>
> Recommendation: Wear a heavy coat, it's cold!

## Example Interactions

### Example 1: Quick Check
**You:** "What's the weather?"

**ARDEN:** "Currently 45 degrees and partly cloudy in Chicago. No rain expected. Light jacket weather."

### Example 2: Different City
**You:** "How's the weather in Miami?"

**ARDEN:** "In Miami, it's 78 degrees and sunny. Beautiful beach weather! Don't forget sunscreen."

### Example 3: Rain Check
**You:** "Should I bring an umbrella?"

**ARDEN:** "No rain in the forecast for Chicago today. You should be fine without one."

### Example 4: Planning
**You:** "What's the weather this weekend?"

**ARDEN:** "This weekend in Chicago: Tomorrow will be partly cloudy with a high of 24. Sunday looks similar at 24 degrees. Bundle up, it's cold out there!"

## Customization

### Change Default Location

Edit `~/ARDEN/skills/weather/context/default-location.txt`:
```bash
echo "New York" > ~/ARDEN/skills/weather/context/default-location.txt
```

Or any location:
- City name: "Chicago", "Los Angeles", "Miami"
- Zip code: "60601", "90210"
- International: "London,UK", "Paris,France", "Tokyo,Japan"

### Supported Locations

wttr.in supports:
- ✅ Cities worldwide
- ✅ US zip codes
- ✅ Airports (ORD, JFK, LAX)
- ✅ Coordinates (41.8781,-87.6298)
- ✅ Domain names (@github.com uses GitHub's location)

## Integration with Other Skills

### Daily Planning
Weather automatically included in morning briefings:
"Good morning! It's 45 degrees and sunny. Your outdoor meeting at 2pm should be perfect."

### Note Taking
Add weather context to notes:
"Take a note: Great walk today (78° and sunny)"

## Features

### Current Weather Includes:
- ☀️ Conditions (sunny, cloudy, rainy, etc.)
- 🌡️ Temperature (actual)
- 🥶 Feels-like temperature
- 💧 Humidity
- 💨 Wind speed and direction
- 🌧️ Precipitation amount
- 🌅 Sunrise time
- 🌇 Sunset time

### Forecast Includes:
- 📅 3-day outlook
- 🌡️ High temperatures
- ☁️ Conditions
- 🌙 Moon phase

### Smart Recommendations:
- 🧥 Jacket needed? (based on temperature)
- ☔ Umbrella needed? (based on precipitation)
- 💨 Wind warnings (if very windy)
- ❄️ Cold warnings (below 40°F)
- ☀️ Sunscreen reminder (above 75°F)

## Voice-Optimized Responses

ARDEN formats weather for voice:
- ✅ Concise (under 30 seconds)
- ✅ Most important info first
- ✅ Natural language
- ✅ Actionable recommendations
- ✅ Rounded numbers (no decimals)

## Advanced Usage

### Compare Locations
**You:** "Compare weather in Chicago and Miami"

**ARDEN:** "Chicago is 24 degrees and partly cloudy. Miami is 78 and sunny. Miami is definitely the warmer choice - 54 degrees warmer!"

### Travel Planning
**You:** "What's the weather in Paris next few days?"

**ARDEN:** "3-day forecast for Paris: Tomorrow 15 degrees and partly cloudy, Sunday 12 degrees with possible rain, Monday 14 and cloudy. Pack layers and an umbrella."

### Hourly Forecast
For detailed planning, you can request specific times:
**You:** "What's the weather at 6pm today?"

## Troubleshooting

### "Unable to fetch weather data"
- Check internet connection
- wttr.in might be temporarily down (rare)
- Try again in a moment

### "Unknown location"
- Try more specific: "Portland, Oregon" instead of "Portland"
- Use zip code: "97201"
- Try different format: "Chicago,IL"

### Weather for wrong location
- Update default location in `context/default-location.txt`
- Be specific: "Chicago, Illinois" not just "Chicago"

## Privacy

**No API key needed** = No tracking, no account, completely free!

wttr.in is:
- ✅ Free forever
- ✅ No registration
- ✅ No rate limits
- ✅ Open source
- ✅ Privacy-friendly

## What's Next?

Your ARDEN now has 3 working skills:
1. ✅ **Daily Planning** - Morning briefings
2. ✅ **Note Taking** - Voice notes to ~/Notes/
3. ✅ **Weather** - Real-time weather info

You can:
- Create more custom skills
- Integrate weather into daily planning
- Add location-based reminders
- Build automation around weather

## Example Daily Briefing

With weather integrated:

**You:** "Good morning ARDEN"

**ARDEN:** 
> Good morning! It's Friday, January 3rd, 2026.
>
> Weather: Currently 24 degrees and partly cloudy. Bundle up - it's cold!
>
> You have 3 meetings today: Team standup at 9, lunch with Sarah at noon, and project review at 3.
>
> Top priorities: Finish the Q1 report and review the new proposals.
>
> Recommendation: Block 10-12 for focused work. And bring a coat for lunch - it's chilly out there!

---

**Your weather skill is ready! Try it out via Telegram!** ☁️🌤️⛅🌦️🌧️

Ask: "What's the weather?" or "Should I bring a jacket?"
