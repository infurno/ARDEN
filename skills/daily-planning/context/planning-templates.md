# Planning Templates

## Overview
This file contains customizable templates for daily planning activities. Modify these to match your preferences and workflow.

## Default Planning Templates

### Morning Briefing Template
```
Good [morning/afternoon]! It's [Day, Date].

📅 SCHEDULE
You have [X] meetings today:
- [Time] - [Meeting name]
- [Time] - [Meeting name]

That leaves you [X] hours of focus time.

🎯 TOP PRIORITIES
Your top [3] priorities:
1. [Task] - [Time estimate]
2. [Task] - [Time estimate]
3. [Task] - [Time estimate]

💡 RECOMMENDATION
[Specific time blocking or sequencing advice]

Ready to start your day?
```

### Evening Review Template
```
🌅 EVENING REVIEW - [Date]

✅ TODAY'S WINS
• [Completed task 1]
• [Completed task 2]

📊 STATS
• Completed: X TODOs
• Pending: Y TODOs

🔄 CARRY FORWARD
• [Task] - [Reason]

🎯 TOMORROW'S TOP 3
1. [Priority task]
2. [Priority task]
3. [Priority task]

📝 REFLECTION
• Best moment: [win]
• Improvement: [what to change]
• Energy: [high/medium/low]
```

### Time Block Schedule Template
```
⏰ TIME BLOCK SCHEDULE - [Date]

MORNING
├─ [Time] Morning routine
├─ [Time] Email triage
├─ [Time] Deep work: [Task]
└─ [Time] Break

AFTERNOON
├─ [Time] Lunch
├─ [Time] Meeting: [Name]
└─ [Time] Admin tasks

EVENING
└─ [Time] Review & wrap up
```

## Customization Options

### Output Level
Choose your preferred detail level:
- **Concise**: Essential info only (recommended for voice)
- **Standard**: Balanced detail
- **Detailed**: Full analysis with all metrics

**Current setting:** Standard

### Review Time Preference
When do you prefer to do your reviews?
- **Morning**: Start of day (default)
- **Evening**: End of day
- **Both**: Morning and evening

**Current setting:** Both

### Metrics to Track
Select which productivity metrics to include:
- [x] TODO completion count
- [x] Notes created/modified
- [x] Focus time hours
- [ ] Git commits (if applicable)
- [ ] Meetings attended
- [ ] Energy level tracking

### Reflection Prompts
Customize your reflection questions:

**Quick (30 seconds):**
1. Rate today 1-10: ___
2. One word for today: ___
3. Grateful for: ___

**Deep (2-3 minutes):**
1. Biggest win today?
2. What drained energy?
3. What to do differently?
4. Looking forward to tomorrow?

## Automation Rules

### Auto-Trigger Settings
- [ ] Auto-generate morning briefing at 8:00 AM
- [ ] Auto-generate evening review at 5:30 PM
- [ ] Send summary to email
- [ ] Create tomorrow's top 3 as TODOs

### Smart Defaults
- Default deep work block: 90 minutes
- Default buffer between meetings: 15 minutes
- Default lunch duration: 60 minutes
- End-of-day buffer: 30 minutes

## Advanced Options

### Eisenhower Matrix Weights
Adjust quadrant emphasis:
- Q1 (Do First): Weight 1.5
- Q2 (Schedule): Weight 1.2
- Q3 (Delegate): Weight 0.8
- Q4 (Eliminate): Weight 0.5

### Priority Scoring Formula
Default: `(Impact × 3) + (Urgency × 2) + (Effort × -1)`

Customize multipliers:
- Impact multiplier: 3
- Urgency multiplier: 2
- Effort multiplier: -1

### Calendar Integration
- Preferred calendar format: Markdown (~/Notes/calendar.md)
- Alternative: iCalendar (.ics) files in ~/.calendar/
- Export created blocks to calendar: No

## User Preferences

### Working Hours
- Start: 8:00 AM
- End: 5:00 PM
- Lunch: 12:00 PM - 1:00 PM

### Energy Patterns
- Peak energy: Morning (8 AM - 12 PM)
- Medium energy: Early afternoon (1 PM - 3 PM)
- Low energy: Late afternoon (3 PM - 5 PM)

### Meeting Preferences
- Preferred meeting times: 10 AM - 12 PM, 2 PM - 4 PM
- Meeting-free blocks: 8 AM - 9 AM, 4 PM - 5 PM
- Buffer before meetings: 15 minutes
- Buffer after meetings: 15 minutes

### Break Preferences
- Frequency: Every 60-90 minutes
- Duration: 5-15 minutes
- Include: Short walk, hydration, stretch

## Notes
- Templates support Markdown formatting
- Variables are marked with [brackets]
- Modify any section to match your workflow
- Changes take effect immediately
