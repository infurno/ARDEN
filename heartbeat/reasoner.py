"""
Heartbeat Reasoner - Claude-powered reasoning over gathered data

Takes raw data from sources (Gmail, Calendar) and uses Claude to:
1. Summarize what's happening
2. Identify urgent items
3. Decide whether to notify
4. Craft actionable notification messages
"""

import logging
import os
from typing import Dict, Optional, Tuple

logger = logging.getLogger("arden.heartbeat.reasoner")

SYSTEM_PROMPT = """You are ARDEN's heartbeat reasoner. Your job is to analyze data gathered from the user's Gmail, ProtonMail, and Calendar, and decide if the user (Hal) needs to be notified about anything.

Rules:
- Only notify when there's something actionable or time-sensitive
- Keep notifications brief and direct (1-2 sentences max)
- If nothing needs attention, respond with exactly: HEARTBEAT_OK
- Never be alarmist -- just factual and helpful
- Consider the user's preferences: they prefer concise, technical communication
- ProtonMail often contains more sensitive/personal emails -- use judgment

When you DO need to notify, format your response as:
NOTIFY: <brief actionable message>

Examples:
- NOTIFY: Meeting with DevOps team in 15 min -- no agenda doc shared yet
- NOTIFY: 3 unread emails from your manager, oldest is 2 hours ago
- NOTIFY: Calendar conflict: Standup and Architecture Review both at 2pm
- NOTIFY: ProtonMail: Urgent security alert from your bank
- HEARTBEAT_OK
"""


def reason_over_data(
    email_summary: str,
    calendar_summary: str,
    protonmail_summary: str = "",
    additional_context: str = ""
) -> Tuple[bool, str]:
    """
    Use Claude to reason over gathered data and decide whether to notify.
    
    Args:
        email_summary: Formatted Gmail summary text
        calendar_summary: Formatted calendar summary text
        protonmail_summary: Formatted ProtonMail summary text
        additional_context: Any additional context (e.g., from HEARTBEAT.md)
    
    Returns:
        Tuple of (should_notify: bool, message: str)
        If should_notify is False, message is "HEARTBEAT_OK"
    """
    try:
        import anthropic
    except ImportError:
        logger.error("anthropic package not installed. Run: pip install anthropic")
        return False, "HEARTBEAT_OK (reasoner unavailable)"
    
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        logger.warning("ANTHROPIC_API_KEY not set, skipping reasoning")
        return False, "HEARTBEAT_OK (no API key)"
    
    # Build the data prompt
    user_message = f"""Current time: {_current_time()}

=== GMAIL STATUS ===
{email_summary}

=== PROTONMAIL STATUS ===
{protonmail_summary}

=== CALENDAR STATUS ===
{calendar_summary}
"""
    
    if additional_context:
        user_message += f"\n=== ADDITIONAL CONTEXT ===\n{additional_context}\n"
    
    user_message += "\nAnalyze the above and decide: should Hal be notified? Respond with NOTIFY: <message> or HEARTBEAT_OK."
    
    try:
        client = anthropic.Anthropic(api_key=api_key)
        
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=200,
            system=SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": user_message}
            ]
        )
        
        result = response.content[0].text.strip()
        logger.info(f"Reasoner response: {result}")
        
        if result.startswith("NOTIFY:"):
            message = result[7:].strip()
            return True, message
        else:
            return False, "HEARTBEAT_OK"
    
    except Exception as e:
        logger.error(f"Reasoning failed: {e}")
        return False, f"HEARTBEAT_OK (error: {e})"


def _current_time() -> str:
    """Get current time formatted for the reasoner."""
    from datetime import datetime
    try:
        import zoneinfo
        tz = zoneinfo.ZoneInfo("America/Chicago")
        now = datetime.now(tz)
    except Exception:
        now = datetime.now()
    
    return now.strftime("%A, %B %d, %Y at %I:%M %p %Z")
