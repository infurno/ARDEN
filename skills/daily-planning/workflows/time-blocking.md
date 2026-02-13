# Time Blocking Workflow

## Objective
Help users allocate specific time blocks for tasks based on priorities, energy levels, and calendar constraints.

## Workflow Steps

### 1. Analyze Available Time
- [ ] Get calendar events for the day
- [ ] Calculate gaps between meetings
- [ ] Identify focus blocks (90+ min uninterrupted)
- [ ] Note transition times between activities

### 2. Match Tasks to Time Blocks
- [ ] High-focus tasks → Morning blocks (if morning person)
- [ ] Creative work → When energy peaks
- [ ] Admin tasks → Low energy periods
- [ ] Quick tasks (<15 min) → Transition gaps

### 3. Apply Time Blocking Rules
- **Deep Work**: 90-120 min blocks
- **Shallow Work**: 30-60 min blocks
- **Buffer**: 15-30 min between blocks
- **Breaks**: 5-10 min every hour
- **Lunch**: Protected 30-60 min block

### 4. Create Schedule
- Assign specific times to top priorities
- Build in buffer for overruns
- Schedule breaks and meals
- Leave white space for emergencies

### 5. Output Formats
- Visual timeline
- Text schedule
- Calendar events (optional)
- Voice briefing

## Voice Interaction

### Input Patterns
- "Block time for my tasks"
- "Help me schedule my day"
- "Create a time block schedule"
- "When should I work on [task]?"

### Output Format
```
⏰ TIME BLOCK SCHEDULE - [Day, Date]

MORNING
├─ 8:00-8:30   🌅 Morning routine
├─ 8:30-9:00   📧 Email triage (shallow)
├─ 9:00-9:30   🚫 BUFFER
├─ 9:30-11:00  🎯 DEEP WORK: Q1 Report
│               [High priority, needs focus]
├─ 11:00-11:15 ☕ Break
└─ 11:15-12:00 📝 Review proposals

AFTERNOON
├─ 12:00-1:00  🍽️ LUNCH (protected)
├─ 1:00-2:00   💻 Admin tasks
├─ 2:00-3:00   🤝 Client Call [Meeting]
├─ 3:00-3:15   🚶 Walk break
└─ 3:15-5:00   🎯 DEEP WORK: Bug fixes

EVENING
└─ 5:00-5:30   🌅 Evening review

TOTALS
• Deep work: 3 hours
• Meetings: 1 hour
• Admin/shallow: 1.5 hours
• Breaks: 0.75 hours
```

## Time Blocking Principles

### Energy Mapping
Match task type to energy level:

**High Energy** (usually morning):
- Deep work
- Creative tasks
- Complex problem solving
- Strategic planning

**Medium Energy** (mid-day):
- Meetings
- Collaborative work
- Code reviews
- Documentation

**Low Energy** (afternoon/evening):
- Email responses
- Routine admin
- Data entry
- Organization

### Buffer Rules
Always include buffer time:
- Before/after meetings: 15 min
- Between deep work blocks: 30 min
- End of day: 30 min for review
- Emergency buffer: 1 hour

### Task Sizing Guidelines
```
Task Duration → Block Size
< 15 min      → Fill gaps between meetings
15-30 min     → 30 min block
30-60 min     → 60 min block
60-90 min     → 90 min block
90-120 min    → 120 min block
> 120 min     → Split into 90-min chunks
```

## Implementation

### Tool Execution
```bash
# Generate time block schedule
~/ARDEN/skills/daily-planning/tools/generate-briefing.sh --mode timeblock

# Analyze calendar and suggest blocks
python ~/ARDEN/skills/daily-planning/tools/analyze-tasks.py --action timeblock --date today
```

### Calendar Integration (Optional)
```bash
# Export schedule to calendar
./tools/export-schedule.sh --format ical
```

## Schedule Templates

### Deep Work Day (Minimal Meetings)
```
08:00-08:30  Morning routine
08:30-10:30  Deep Work Block 1
10:30-10:45  Break
10:45-12:15  Deep Work Block 2
12:15-01:15  Lunch
01:15-01:30  Email triage
01:30-03:30  Deep Work Block 3
03:30-03:45  Break
03:45-04:45  Shallow work/Admin
04:45-05:00  Plan tomorrow
```

### Meeting-Heavy Day
```
08:00-08:30  Morning routine
08:30-09:00  Quick task #1
09:00-10:00  Meeting 1
10:00-10:15  Buffer
10:15-11:00  Focus block (45 min)
11:00-11:30  Quick task #2
11:30-12:30  Meeting 2
12:30-01:15  Lunch
01:15-02:00  Email/Admin
02:00-03:00  Meeting 3
03:00-04:00  Focus block (60 min)
04:00-04:15  Buffer
04:15-04:45  Quick task #3
04:45-05:00  Review & wrap up
```

### Balanced Day
```
08:00-08:30  Morning routine
08:30-09:00  Email triage
09:00-10:30  Deep Work
10:30-10:45  Break
10:45-11:30  Meeting/Collaboration
11:30-12:30  Deep Work
12:30-01:30  Lunch
01:30-02:30  Admin/Shallow work
02:30-02:45  Break
02:45-04:00  Deep Work
04:00-04:15  Buffer
04:15-04:45  Planning/Review
04:45-05:00  Tomorrow preview
```

## Smart Scheduling Rules

### Priority-Based Allocation
1. **Quadrant 1 (Urgent/Important)**: Schedule first, protect fiercely
2. **Quadrant 2 (Important)**: Schedule in best energy slots
3. **Quadrant 3 (Urgent)**: Fill gaps, batch together
4. **Quadrant 4**: Eliminate or batch at day's end

### Anti-Patterns to Avoid
❌ Back-to-back meetings without buffers
❌ Scheduling deep work right before meetings
❌ No lunch break
❌ Starting with email/social media
❌ Over-scheduling (no white space)

### Best Practices
✅ Morning = Deep work (if morning person)
✅ Protect 2-4 hours for focus daily
✅ Batch similar tasks together
✅ Schedule breaks and lunch
✅ End day with review, not work

## Customization

Users can customize in `context/time-preferences.md`:
- Working hours
- Peak energy times
- Meeting preferences
- Break frequency
- Lunch duration
- Default block sizes

## Example Output

```
⏰ YOUR TIME BLOCK SCHEDULE
Friday, February 13, 2025

Based on your calendar and 3 pending TODOs

🌅 MORNING (Peak Energy: High)
├─ 8:00-8:30   Morning routine & coffee
├─ 8:30-9:00   📧 Process emails (15 messages)
├─ 9:00-9:30   🚫 PREP BUFFER - Review demo notes
├─ 9:30-10:30  🎯 DEEP WORK: Prepare demo presentation
│               Priority #1 - High visibility meeting!
├─ 10:30-10:45 ☕ Break - Step away from screen
└─ 10:45-11:00 📝 Final demo prep & tech check

🌞 MIDDAY
├─ 11:00-12:30 🤝 Sprint Planning [Meeting]
├─ 12:30-12:45 🚶 Walk break
└─ 12:45-1:45  🍽️ LUNCH (protected time)

🌤️ AFTERNOON (Energy: Medium→Low)
├─ 1:45-2:00   📧 Quick email check
├─ 2:00-2:30   📝 Review marketing proposal
│               Priority #2 - Carried from yesterday
├─ 2:30-2:45   ☕ Break
├─ 2:45-3:00   🚫 BUFFER - Prepare for demo
├─ 3:00-4:00   🎤 DEMO to stakeholders [Meeting]
│               🎉 Showtime!
├─ 4:00-4:15   🎉 Post-demo celebration break
└─ 4:15-4:45   📧 Send client follow-up
                Priority #3 - Commitment from meeting

🌆 EVENING
└─ 4:45-5:00   🌅 Quick evening review

📊 SCHEDULE STATS
• Deep work: 1.5 hours
• Meetings: 2.5 hours
• Admin/shallow: 1.5 hours
• Breaks: 0.75 hours
• Buffer: 0.5 hours
• Total planned: 9 hours

💡 TIPS FOR TODAY
• Demo at 3 PM - your most important event!
• Morning deep work block is protected - no interruptions
• Take the walk break after sprint planning
• If demo ends early, use buffer time for follow-up

🎯 FOCUSED TASKS
1. Prepare demo presentation (9:30-10:30)
2. Review marketing proposal (2:00-2:30)
3. Send client follow-up (4:15-4:45)

Ready to have a productive day! 🚀
```

## Follow-up Actions

After creating time blocks:
- "Add these to my calendar" → Export to calendar
- "Adjust the lunch block" → Modify schedule
- "I have a new meeting at 2" → Rebuild schedule
- "Give me a simpler version" → Minimal output

## Metrics

Track time blocking effectiveness:
- Adherence to schedule
- Completion rate of blocked tasks
- Energy level maintenance
- Reduction in context switching
- User satisfaction with schedule

## Integration

- **Daily Planning**: Uses priorities from morning briefing
- **Calendar**: Read/write calendar events
- **TODO Management**: Convert blocks to TODOs
- **User Context**: Learn energy patterns over time
