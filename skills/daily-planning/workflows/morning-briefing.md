# Morning Briefing Workflow

## Objective
Provide a concise, actionable daily briefing optimized for voice consumption.

## Workflow Steps

### 1. Gather Context
- [ ] Check current date and time
- [ ] Load calendar events for today
- [ ] Load task list and priorities
- [ ] Check for any urgent items or deadlines
- [ ] Review yesterday's unfinished tasks

### 2. Analyze Schedule
- [ ] Identify meeting commitments
- [ ] Calculate available focus time blocks
- [ ] Note any scheduling conflicts
- [ ] Identify travel or location requirements

### 3. Prioritize Tasks
- [ ] Apply priority framework (Eisenhower Matrix)
- [ ] Consider energy levels (morning vs afternoon tasks)
- [ ] Account for meeting preparation time
- [ ] Identify dependencies and blockers

### 4. Generate Recommendations
- [ ] Suggest time blocks for deep work
- [ ] Highlight preparation needs for meetings
- [ ] Flag potential scheduling issues
- [ ] Recommend task sequencing

### 5. Format Output
Voice-optimized structure:
```
GREETING
- Time-appropriate (Good morning/afternoon)
- Current date

SCHEDULE OVERVIEW
- Meeting count and times
- Available work blocks
- Any conflicts or notes

TOP PRIORITIES
- 3-5 highest priority tasks
- Time estimates
- Dependencies

RECOMMENDATIONS
- Specific time blocking suggestions
- Preparation reminders
- Energy optimization tips

QUICK STATS
- Tasks pending
- Deadlines approaching
- Time availability
```

## Voice Script Template

```
Good [morning/afternoon]! It's [Day], [Date].

SCHEDULE
You have [X] meetings today:
- [Time] - [Meeting name]
- [Time] - [Meeting name]

That leaves you [X] hours of focus time.

PRIORITIES
Your top [3] priorities:
1. [Task] - [Time estimate]
2. [Task] - [Time estimate]
3. [Task] - [Time estimate]

RECOMMENDATION
[Specific time blocking or sequencing advice]

[Optional: Deadline warnings, preparation reminders]

Ready to start your day?
```

## Implementation

### Input
- Calendar file/API
- Task list (JSON, MD, or API)
- User preferences
- Current date/time

### Processing
```bash
# 1. Extract calendar events
./tools/parse-calendar.sh today

# 2. Analyze tasks
python ./tools/analyze-tasks.py --date today --limit 5

# 3. Generate briefing
./tools/generate-briefing.sh
```

### Output
- Text briefing (for screen)
- Voice-optimized briefing (for TTS)
- Structured JSON (for API)

## Voice Optimization Rules

1. **Maximum 60 seconds** of speech
2. **3 meetings max** - summarize rest as "and X more"
3. **3-5 priorities** - user can drill down if needed
4. **Clear sections** - pause between sections
5. **Actionable** - specific times and tasks
6. **Scannable** - if displayed, easy to skim

## Example Output

### Text Version
```
Good morning! It's Monday, January 2nd.

📅 SCHEDULE
You have 3 meetings today:
- 9:00 AM - Team Standup (30 min)
- 2:00 PM - Client Review (1 hour)
- 4:00 PM - Project Planning (45 min)

You have ~5 hours of focus time available.

🎯 TOP PRIORITIES
1. Complete Q1 Report - 2 hours [DEADLINE: Today]
2. Review Sarah's Proposal - 30 minutes
3. Prepare client presentation - 1 hour

💡 RECOMMENDATION
Block 10:00 AM - 12:00 PM for deep work on the Q1 report.
This gives you uninterrupted time before the client review.

Prepare your client presentation from 12:30-1:30 PM.

⚡ QUICK STATS
- 12 tasks pending
- 2 deadlines today
- 1 deadline tomorrow

Ready to make today count?
```

### Voice Version (TTS-optimized)
```
Good morning! It's Monday, January 2nd.

You have 3 meetings today: Team standup at 9, Client review at 2, and Project planning at 4.

Your top priorities are: Complete the Q1 report, that's due today and takes about 2 hours. Review Sarah's proposal, 30 minutes. And prepare your client presentation, 1 hour.

My recommendation: Block 10 to 12 for deep work on that Q1 report. Then prepare your client presentation from 12:30 to 1:30.

You have 12 tasks pending and 2 deadlines today. Ready to start?
```

## Customization

Users can customize in `context/preferences.md`:
- Briefing time preferences
- Level of detail (concise/detailed)
- Priority framework
- Energy patterns (morning/afternoon person)
- Meeting preparation time defaults

## Follow-up Actions

After briefing, user might say:
- "Add focus time to my calendar" → Execute time-blocking
- "Tell me more about priority 1" → Drill into task details
- "Reschedule meeting 2" → Invoke scheduling skill
- "I need more time for the report" → Adjust plan

## Metrics

Track briefing effectiveness:
- Tasks completed from briefing
- Accuracy of time estimates
- User satisfaction (implicit from follow-ups)
- Plan adherence rate
