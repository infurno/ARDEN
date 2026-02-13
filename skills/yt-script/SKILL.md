---
name: yt-script
version: 0.1.0
enabled: false
triggers:
  - "youtube script"
  - "video script"
  - "script outline"
patterns:
  - "(?:youtube|yt|video)\\s+script(?:\\s+for)?\\s+(.+)"
  - "(?:write|create)\\s+(?:a\\s+)?script\\s+(?:for|about)\\s+(.+)"
  - "(?:script\\s+outline|outline\\s+script)\\s+(.+)"
entry: null
timeout: 60000
agents: [assistant, strategist]
---

# YouTube Script Skill

## Purpose
Generate structured YouTube video scripts with hooks, segments, talking points, and calls-to-action. Optimized for retention and engagement.

## Status
🚧 **PLANNED** - Not yet implemented

## Planned Capabilities
- Hook generation (first 30 seconds)
- Script structure (intro, body, outro)
- Talking points and transitions
- B-roll suggestions
- Call-to-action placement
- Timestamp generation
- Thumbnail title ideas
- Description templates
- Hashtag recommendations

## Tools (Planned)
- `generate-script.py` - Main script generator
- `analyze-topic.py` - Research topic for script angles
- `create-outline.py` - Generate structured outline
- `suggest-broll.py` - Recommend visual elements
- `generate-hooks.py` - Create multiple hook options
- `estimate-duration.py` - Calculate video length from script

## Workflows (Planned)
- `tutorial-script.md` - Educational content format
- `vlog-script.md` - Personal/lifestyle format
- `review-script.md` - Product/service review format
- `storytelling-script.md` - Narrative-driven format
- `livestream-prep.md` - Live stream planning

## Agent Preferences
- **Assistant** - General script writing
- **Strategist** - Content strategy and positioning

## Output Format
Scripts include:
- Hook (0-30s)
- Intro/Setup (30-60s)
- Main Content (segments with timestamps)
- B-roll cues [in brackets]
- Transitions
- Call-to-Action
- Outro

## Integration
- Export to Google Docs
- Save to `~/Notes/content/scripts/`
- Tag with content calendar
