# HEARTBEAT - Proactive Monitoring Configuration

> Controls what ARDEN checks on a schedule and when to notify.
> The heartbeat daemon reads this file to know what to monitor.

## Schedule

- **Interval**: Every 30 minutes
- **Active Hours**: 06:00 - 22:00 (respect sleep)
- **Timezone**: America/Chicago (Central)

## Sources

### Gmail
- **Enabled**: true
- **Check**: Unread messages in inbox
- **Notify When**:
  - Urgent/important flagged emails
  - Emails from key contacts (manager, team leads)
  - Action-required emails older than 2 hours
- **Ignore**: Newsletters, automated notifications, marketing

### Google Calendar
- **Enabled**: true
- **Check**: Upcoming events in next 2 hours
- **Notify When**:
  - Meeting in 15 minutes with empty/missing prep doc
  - Double-booked time slots
  - All-day events starting tomorrow (evening reminder)
  - Cancelled meetings (free up time notification)
- **Include**: Meeting links, attendee list, attached documents

### Asana (Future)
- **Enabled**: false
- **Check**: Tasks due today, overdue tasks, new assignments
- **Notify When**: Task due within 2 hours, new high-priority assignment

### Slack (Future)
- **Enabled**: false
- **Check**: Direct messages, mentions, channel highlights
- **Notify When**: Unread DMs older than 30 min, @mentions in key channels

## Notification Preferences

### Delivery
- **Primary Channel**: Telegram (voice-friendly format)
- **Fallback**: Web dashboard push notification
- **Quiet Mode**: Only critical notifications during meetings

### Format
- Keep notifications brief and actionable
- Example: "Meeting in 15 min -- prep doc is empty"
- Example: "3 unread emails from [Manager Name], oldest 2 hours ago"
- If nothing to report: log `HEARTBEAT_OK` silently (no notification)

### Escalation
- **Normal**: Single notification via primary channel
- **Urgent**: Notify on all active adapters
- **Critical**: Notify + create a TODO item automatically

## Reasoning Instructions

When the heartbeat daemon gathers data, Claude should:
1. Summarize what's happening across all sources
2. Identify anything that needs attention NOW
3. Identify anything that needs attention SOON (next 2 hours)
4. Decide: notify or stay silent
5. If notifying, craft a concise, actionable message
6. Log the heartbeat result to `daily/` session log

---
*Read by heartbeat daemon at each cycle. Edit to adjust monitoring behavior.*
*Last updated: 2026-02-13*
