# Task Prioritization Workflow

## Objective
Help users prioritize their tasks using the Eisenhower Matrix and impact/urgency analysis.

## Workflow Steps

### 1. Gather All Tasks
- [ ] Load all TODOs from work, personal, and side-projects
- [ ] Load any tasks from calendar events
- [ ] Check for deadline indicators in task descriptions
- [ ] Look for "blocker" or "dependency" keywords

### 2. Apply Eisenhower Matrix
Categorize tasks by urgency and importance:

**Quadrant 1: Do First (Urgent & Important)**
- Deadlines today/tomorrow
- Blockers for other tasks
- Critical business needs
- Health/safety issues

**Quadrant 2: Schedule (Important, Not Urgent)**
- Strategic projects
- Skill development
- Relationship building
- Long-term planning

**Quadrant 3: Delegate (Urgent, Not Important)**
- Routine admin tasks
- Emails (non-critical)
- Meetings (low value)
- Interruptions

**Quadrant 4: Eliminate (Neither Urgent nor Important)**
- Time wasters
- Excessive social media
- Unnecessary meetings
- Busywork

### 3. Calculate Priority Scores
For each task, calculate:
```
Priority Score = (Impact × 3) + (Urgency × 2) + (Effort × -1)
```

Where:
- **Impact** (1-5): Value if completed
- **Urgency** (1-5): Time sensitivity
- **Effort** (1-5): Time/energy required

### 4. Sort and Rank
- Sort by priority score (highest first)
- Break ties by effort (lower effort first)
- Consider user's energy patterns
- Account for dependencies

## Voice Interaction

### Input Patterns
- "Prioritize my tasks"
- "What should I do first?"
- "Help me prioritize"
- "What's most important?"

### Output Format
```
TOP PRIORITIES (Ranked)

1. [Task] - Priority: [Score]
   Why: [Impact/Urgency reasoning]
   Time: [Estimated duration]

2. [Task] - Priority: [Score]
   Why: [Impact/Urgency reasoning]
   Time: [Estimated duration]

[...up to top 10]

RECOMMENDATION
Start with #[X] because [reasoning].
Block [time] for deep work on it.
```

## Implementation

### Tool Execution
```bash
# Analyze and prioritize all tasks
python ~/ARDEN/skills/daily-planning/tools/analyze-tasks.py --action prioritize --limit 10

# Generate prioritization report
./tools/generate-briefing.sh --mode priority
```

### Output Options
- **Text**: Full analysis with Eisenhower matrix
- **Voice**: Top 5 priorities with brief reasoning
- **JSON**: Structured data for integrations

## Prioritization Frameworks

### Eisenhower Matrix
Visual representation for users:
```
           URGENT        NOT URGENT
         ┌────────────┬────────────┐
IMPORTANT│  DO FIRST  │  SCHEDULE  │
         │  (Q1)      │  (Q2)      │
         ├────────────┼────────────┤
NOT IMP. │  DELEGATE  │  ELIMINATE │
         │  (Q3)      │  (Q4)      │
         └────────────┴────────────┘
```

### MoSCoW Method
- **Must have**: Critical for success
- **Should have**: Important but not critical
- **Could have**: Nice to have
- **Won't have**: Save for later

### RICE Scoring
- **R**each: How many people affected
- **I**mpact: Effect per person (3=high, 2=medium, 1=low)
- **C**onfidence: Certainty of impact (100%=high, 80%=medium)
- **E**ffort: Person-months required

Score = (Reach × Impact × Confidence) / Effort

## Example Output

```
🎯 TASK PRIORITIZATION

Using Eisenhower Matrix + Impact Scoring

TOP 5 PRIORITIES:

1. ⭐ Complete Q1 report (Priority: 14)
   Category: Work (Urgent & Important)
   Impact: High | Urgency: Today | Effort: 2 hours
   Why: Deadline today, high visibility, blocks review

2. ⭐ Fix production bug (Priority: 13)
   Category: Work (Urgent & Important)
   Impact: High | Urgency: Now | Effort: 1 hour
   Why: Affects customers, critical business need

3. Schedule dentist appointment (Priority: 8)
   Category: Personal (Important)
   Impact: Medium | Urgency: This week | Effort: 15 min
   Why: Health maintenance, prevents bigger issues

4. Review Sarah's proposal (Priority: 7)
   Category: Work (Important)
   Impact: Medium | Urgency: Tomorrow | Effort: 30 min
   Why: Team dependency, blocks her work

5. Plan team offsite (Priority: 5)
   Category: Work (Important)
   Impact: High | Urgency: Next week | Effort: 2 hours
   Why: Strategic, long-term team health

💡 RECOMMENDATION:
Focus on #1 and #2 this morning - both are urgent and high-impact.
Block 3 hours before lunch for these critical items.

Schedule #3-5 for tomorrow when you have more focus time.

---
Eisenhower Breakdown:
• Q1 (Do First): 2 tasks
• Q2 (Schedule): 5 tasks  
• Q3 (Delegate): 3 tasks
• Q4 (Eliminate): 1 task
```

## Customization

Users can customize in `context/priorities.md`:
- Default prioritization method
- Working hours
- Energy patterns
- Category weights
- Effort estimation preferences

## Follow-up Actions

After prioritization:
- "Add to calendar" → Invoke time-blocking
- "Tell me more about task 3" → Show details
- "Delegate task 5" → Suggest delegation options
- "Move task 2 to tomorrow" → Reschedule

## Metrics

Track prioritization effectiveness:
- Tasks completed from top priorities
- Accuracy of effort estimates
- User satisfaction
- Reduction in missed deadlines
