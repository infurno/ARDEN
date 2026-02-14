"""
Heartbeat Reasoner - AI-powered reasoning over gathered data

Takes raw data from sources (Gmail, ProtonMail, Calendar) and uses AI to:
1. Summarize what's happening
2. Identify urgent items
3. Decide whether to notify
4. Craft actionable notification messages

Supports: OpenAI, Anthropic (Claude), or local fallback
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
    Use AI to reason over gathered data and decide whether to notify.
    
    Tries OpenAI first, then Anthropic, then falls back to simple rules.
    
    Args:
        email_summary: Formatted Gmail summary text
        calendar_summary: Formatted calendar summary text
        protonmail_summary: Formatted ProtonMail summary text
        additional_context: Any additional context (e.g., from HEARTBEAT.md)
    
    Returns:
        Tuple of (should_notify: bool, message: str)
        If should_notify is False, message is "HEARTBEAT_OK"
    """
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
    
    # Try OpenAI first
    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        try:
            return _reason_with_openai(user_message)
        except Exception as e:
            logger.warning(f"OpenAI reasoning failed: {e}, trying Anthropic...")
    
    # Try Anthropic as fallback
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    if anthropic_key:
        try:
            return _reason_with_anthropic(user_message)
        except Exception as e:
            logger.warning(f"Anthropic reasoning failed: {e}, using fallback...")
    
    # Fallback: simple rule-based
    logger.info("No AI provider available, using fallback logic")
    return _reason_with_fallback(email_summary, calendar_summary, protonmail_summary)


def _reason_with_openai(user_message: str) -> Tuple[bool, str]:
    """Use OpenAI GPT to reason over data."""
    try:
        import openai
    except ImportError:
        logger.error("openai package not installed. Run: pip install openai")
        raise
    
    client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # Fast and cost-effective
        max_tokens=200,
        temperature=0.3,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message}
        ]
    )
    
    result = response.choices[0].message.content.strip()
    logger.info(f"OpenAI reasoner response: {result}")
    
    if result.startswith("NOTIFY:"):
        message = result[7:].strip()
        return True, message
    else:
        return False, "HEARTBEAT_OK"


def _reason_with_anthropic(user_message: str) -> Tuple[bool, str]:
    """Use Anthropic Claude to reason over data."""
    try:
        import anthropic
    except ImportError:
        logger.error("anthropic package not installed. Run: pip install anthropic")
        raise
    
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=200,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": user_message}
        ]
    )
    
    result = response.content[0].text.strip()
    logger.info(f"Anthropic reasoner response: {result}")
    
    if result.startswith("NOTIFY:"):
        message = result[7:].strip()
        return True, message
    else:
        return False, "HEARTBEAT_OK"


def _reason_with_fallback(
    email_summary: str,
    calendar_summary: str,
    protonmail_summary: str
) -> Tuple[bool, str]:
    """Simple rule-based fallback when no AI provider is available."""
    
    # Check for urgent keywords
    urgent_keywords = ["urgent", "asap", "immediate", "action required", "deadline", "overdue"]
    all_text = f"{email_summary} {calendar_summary} {protonmail_summary}".lower()
    
    # Count unread emails
    unread_count = 0
    if "unread" in email_summary.lower():
        try:
            import re
            match = re.search(r'(\d+)\s+unread', email_summary.lower())
            if match:
                unread_count += int(match.group(1))
        except:
            pass
    
    if "unread" in protonmail_summary.lower():
        try:
            import re
            match = re.search(r'(\d+)\s+unread', protonmail_summary.lower())
            if match:
                unread_count += int(match.group(1))
        except:
            pass
    
    # Check for urgent items
    has_urgent = any(keyword in all_text for keyword in urgent_keywords)
    has_meeting_soon = "in 15 min" in all_text or "in 30 min" in all_text
    
    if has_urgent:
        return True, f"Urgent items detected across your inbox"
    elif has_meeting_soon:
        return True, f"Meeting starting soon"
    elif unread_count > 10:
        return True, f"{unread_count} unread emails waiting"
    else:
        return False, "HEARTBEAT_OK"


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
