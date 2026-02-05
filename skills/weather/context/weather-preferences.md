# Weather Preferences

## Temperature Units
Fahrenheit (default for US locations)

## Detail Level
- **Concise**: Temperature, conditions, rain chance (for voice)
- **Detailed**: Full forecast with hourly breakdown (for text)

## Voice Response Format

Keep it under 30 seconds. Include:
1. Current temperature and conditions
2. Feels-like temperature if significantly different
3. Key alerts (rain, wind, extreme temps)
4. One actionable recommendation

## Example Good Response
"Currently 45 degrees and partly cloudy. Feels like 42. No rain expected. Light jacket should be fine."

## Example Too Detailed (avoid for voice)
"The current temperature is 45 degrees Fahrenheit with partly cloudy skies. The barometric pressure is 30.1 inches and rising. Humidity is at 65% with a dew point of 35 degrees. Winds are from the west-northwest at 8 miles per hour with gusts up to 12..."

## Location Resolution
- If no location specified, use default from `default-location.txt`
- Accept city names, zip codes, or coordinates
- Handle "here", "current location" as default location
