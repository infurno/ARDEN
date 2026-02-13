"""
ARDEN Heartbeat System

Proactive monitoring daemon that:
- Runs every 30 minutes during active hours
- Gathers data from Gmail and Google Calendar
- Uses Claude to reason about what needs attention
- Sends notifications via ARDEN's adapter system

Configuration is driven by HEARTBEAT.md in the project root.
"""
