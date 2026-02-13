---
name: daily-planning
version: 1.0.0
enabled: true
triggers:
  - "morning briefing"
  - "daily briefing"
  - "plan my day"
patterns:
  - "(?:morning\\s+briefing|daily\\s+briefing)"
  - "(?:plan\\s+my\\s+day|what'?s\\s+my\\s+day\\s+look\\s+like)"
  - "(?:what'?s\\s+on\\s+my\\s+agenda|what\\s+are\\s+my\\s+priorities)"
  - "(?:what\\s+should\\s+i\\s+(?:do|focus\\s+on)\\s+today)"
entry: tools/generate-briefing.sh
timeout: 30000
agents: [assistant, strategist, analyst]
---

# Daily Planning Skill

## Purpose
Provides daily planning, scheduling, and task prioritization capabilities with voice-first interaction design.

## When to Invoke
This skill should be automatically invoked when the user:
- Asks about their schedule or calendar
- Requests a daily briefing or morning summary
- Wants to plan their day
- Asks "what should I do today?" or similar
- Requests task prioritization
- Says phrases like:
  - "What's on my agenda?"
  - "Plan my day"
  - "Morning briefing"
  - "What are my priorities?"

## Capabilities
- Generate morning briefings with schedule and priorities
- Analyze task lists and suggest priorities
- Create structured daily plans
- Time blocking and scheduling
- Evening reviews and next-day preparation
- Voice-optimized responses (concise, scannable)

## Workflows
- `morning-briefing.md` - Daily morning summary workflow
- `task-prioritization.md` - Prioritize tasks by impact/urgency
- `evening-review.md` - End of day reflection and planning
- `time-blocking.md` - Allocate time blocks for tasks

## Tools
- `parse-calendar.sh` - Extract calendar events
- `analyze-tasks.py` - Task analysis and prioritization
- `generate-briefing.sh` - Create daily briefing report

## Context Files
- `planning-templates.md` - Standard planning formats
- `priorities.md` - User's priority framework
- `time-preferences.md` - User's scheduling preferences

## Voice Interaction Design

### Input Patterns
- "Hey ARDEN, what's my day look like?"
- "Plan my day"
- "What should I focus on today?"
- "Give me my morning briefing"

### Output Format
Voice responses should be:
- **Concise**: 2-3 sentences per section
- **Scannable**: Clear sections (Schedule, Priorities, Notes)
- **Actionable**: Specific next steps
- **Time-bound**: Include time estimates

### Example Voice Response
```
Good morning! You have 3 meetings today:
- 9 AM team standup
- 2 PM client call
- 4 PM project review

Your top priorities:
1. Finish the Q1 report (2 hours)
2. Review Sarah's proposal (30 minutes)
3. Prepare for client call (1 hour)

Recommendation: Block 10-12 AM for deep work on the Q1 report.
```

## Dependencies
- Access to calendar (via API or file)
- Task management system integration
- User preferences in context/

## Agent Preferences
Best used with:
- **Assistant** agent - General daily planning
- **Strategist** agent - Complex prioritization
- **Analyst** agent - Data-driven insights

## Examples

### Example 1: Morning Briefing
**User**: "Morning briefing"
**ARDEN**: *Loads daily-planning skill, executes morning-briefing workflow*

### Example 2: Task Prioritization
**User**: "I have 20 tasks. What should I do first?"
**ARDEN**: *Loads daily-planning skill, executes task-prioritization workflow*

### Example 3: Time Blocking
**User**: "Help me schedule my tasks for today"
**ARDEN**: *Loads daily-planning skill, executes time-blocking workflow*
