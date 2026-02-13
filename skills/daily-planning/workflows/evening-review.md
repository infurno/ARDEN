# Evening Review Workflow

## Objective
Conduct an end-of-day review to reflect on accomplishments, capture remaining tasks, and plan for tomorrow.

## Workflow Steps

### 1. Review Today's Accomplishments
- [ ] Count completed TODOs (by category)
- [ ] List notes created today
- [ ] Check off completed calendar events
- [ ] Identify wins and achievements

### 2. Assess Unfinished Tasks
- [ ] List pending TODOs
- [ ] Identify why tasks weren't completed
  - Not enough time?
  - Blocked by dependencies?
  - Lower priority than expected?
  - Unforeseen interruptions?
- [ ] Decide: carry forward or reschedule?

### 3. Capture Loose Ends
- [ ] Review today's notes for action items
- [ ] Check voice memos/transcriptions
- [ ] Scan emails/slack for follow-ups
- [ ] Review meeting notes for action items

### 4. Plan Tomorrow
- [ ] Identify top 3 priorities for tomorrow
- [ ] Check calendar for tomorrow's meetings
- [ ] Estimate available focus time
- [ ] Note any deadlines or important dates

### 5. Reflect and Learn
- [ ] What went well today?
- [ ] What could be improved?
- [ ] Any patterns or insights?
- [ ] Energy level throughout the day?

## Voice Interaction

### Input Patterns
- "Evening review"
- "End of day summary"
- "What did I accomplish today?"
- "Plan for tomorrow"
- "Daily wrap-up"

### Output Format
```
🌅 EVENING REVIEW - [Date]

✅ TODAY'S WINS
• [Completed task 1]
• [Completed task 2]
• [Created X notes]

📊 STATS
• Completed: X TODOs
• Pending: Y TODOs (carried forward)
• Notes created: Z
• Focus time: H hours

🔄 CARRY FORWARD
Tasks moving to tomorrow:
• [Task 1] - Reason: [why]
• [Task 2] - Reason: [why]

📋 NEW ACTION ITEMS CAPTURED
• [From notes/emails]

🎯 TOMORROW'S PREVIEW
• [Meeting 1 at time]
• [Meeting 2 at time]
• Available focus time: X hours

💡 TOP 3 FOR TOMORROW
1. [Priority task]
2. [Priority task]
3. [Priority task]

📝 REFLECTION
• Best moment: [win]
• Improvement: [what to change]
• Energy: [high/medium/low]

Ready to rest and recharge! 🌙
```

## Implementation

### Tool Execution
```bash
# Generate evening review
~/ARDEN/skills/daily-planning/tools/generate-briefing.sh --mode evening

# Analyze today's productivity
python ~/ARDEN/skills/daily-planning/tools/analyze-tasks.py --action review --date today
```

### Output Options
- **Full Review**: Complete analysis with reflection prompts
- **Quick Summary**: Just stats and tomorrow's preview
- **Voice Version**: Optimized for audio consumption

## Review Categories

### Productivity Metrics
```
📊 TODAY'S NUMBERS

TODOs:
• Completed: X (Y% of planned)
• Added today: Z
• Net change: [+/-]

Notes:
• Created: X
• Modified: Y
• Captures: Z ideas

Time:
• Meetings: X hours
• Focus work: Y hours
• Available: Z hours

Streaks:
• Daily notes: X days
• Git commits: Y days
```

### Accomplishment Log
Capture wins across categories:
- **Work**: Projects completed, problems solved
- **Personal**: Errands run, self-care
- **Learning**: New skills, insights gained
- **Relationships**: Connections made

### Blocker Analysis
Identify patterns in unfinished tasks:
```
🚧 WHY TASKS WEREN'T COMPLETED

• Interruptions: X tasks (meetings, emergencies)
• Underestimated: Y tasks (took longer than expected)
• Dependencies: Z tasks (waiting on others)
• Priority shift: W tasks (lower priority emerged)

💡 INSIGHT: [Pattern observed]
```

## Tomorrow's Preview

### Calendar Scan
```
📅 TOMORROW - [Day, Date]

Meetings (X total):
• 9:00 AM - Team Standup (30 min)
• 2:00 PM - Client Call (1 hour)

Focus Time:
• Morning: 9:30 AM - 12:00 PM (2.5 hours)
• Afternoon: 3:00 PM - 5:00 PM (2 hours)
• Total available: 4.5 hours

⚠️ WATCH FOR:
• Deadline: Q1 report due
• Early meeting: Standup at 9 AM
```

### Top 3 Priorities
Suggested by system based on:
- Today's carry-forward tasks
- Upcoming deadlines
- Calendar availability
- User priority framework

## Reflection Prompts

### Quick Check-in (30 seconds)
- Rate today 1-10
- One word to describe the day
- One thing you're grateful for

### Deeper Reflection (2-3 minutes)
```
🤔 REFLECTION QUESTIONS

1. What was your biggest win today?
   → [Capture answer]

2. What drained your energy?
   → [Capture answer]

3. What would you do differently?
   → [Capture answer]

4. What are you looking forward to tomorrow?
   → [Capture answer]

5. One thing to celebrate:
   → [Capture answer]
```

## Evening Ritual Integration

### Suggested Workflow
1. **Complete work** - Finish any quick tasks (< 5 min)
2. **Review** - Run evening review
3. **Capture** - Note any lingering thoughts
4. **Plan** - Confirm tomorrow's top 3
5. **Disconnect** - Clear workspace, close apps
6. **Reflect** - Quick journal entry (optional)

### Automation Ideas
- Trigger review at set time (e.g., 5:30 PM)
- Send summary to email/Slack
- Create tomorrow's top 3 as TODOs
- Archive today's completed items

## Example Output

```
🌅 EVENING REVIEW - Thursday, Feb 12

✅ TODAY'S WINS
• Completed Q1 report (big deadline met!)
• Fixed 3 production bugs
• Had productive 1:1 with Sarah
• Created 2 notes from client meeting
• Went for lunch walk (self-care!)

📊 STATS
• Completed: 8 TODOs
• Pending: 3 TODOs (moved to tomorrow)
• Notes created: 2
• Notes modified: 5
• Focus time: 4.5 hours

🔄 CARRYING FORWARD
• Review marketing proposal - Reason: Ran out of time
• Update documentation - Reason: Lower priority than bugs
• Call dentist - Reason: Forgot, setting reminder

📋 NEW ACTION ITEMS
• [From client meeting notes] Send follow-up by Friday
• [From Slack] Review design mockups

🎯 TOMORROW PREVIEW - Friday, Feb 13

Meetings:
• 9:00 AM - Team Standup
• 11:00 AM - Sprint Planning (2 hours)
• 3:00 PM - Demo to stakeholders

Focus Time: ~3 hours (morning block 9:30-11, afternoon 4-5)

💡 TOP 3 FOR TOMORROW
1. Prepare demo presentation (high visibility)
2. Review marketing proposal (carried forward)
3. Send client follow-up email (commitment made)

📝 REFLECTION
• Best moment: Nailing the Q1 report!
• Improvement: Start documentation earlier in sprint
• Energy: High in morning, dipped after 3 PM
• Grateful for: Supportive team

Tomorrow is Friday - finish strong! 🚀

🌙 Sleep well and recharge!
```

## Customization

Users can customize in `context/planning-templates.md`:
- Review time preference
- Metrics to track
- Reflection prompts
- Automation rules
- Output format (brief/detailed)

## Follow-up Actions

After evening review:
- "Add reflection to my journal" → Create note
- "Create tomorrow's TODOs" → Add top 3 as tasks
- "Send summary to my email" → Email digest
- "I need to finish one more thing" → Stay in work mode

## Metrics

Track review effectiveness:
- Completion rate of planned tasks
- Accuracy of time estimates
- Reduction in forgotten tasks
- User consistency (daily reviews)
- Improvement in work-life balance

## Integration with Other Skills

- **TODO Management**: Update task status, carry forward
- **Note-Taking**: Create reflection note, capture insights
- **Daily Planning**: Morning briefing uses evening review data
- **User Context**: Track patterns, energy levels
