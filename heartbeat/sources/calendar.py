"""
Google Calendar Source - Fetches upcoming events

Uses OAuth2 for authentication. Credentials stored in heartbeat/credentials/.
Read-only access to calendar events.
"""

import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional

logger = logging.getLogger("arden.heartbeat.calendar")

CREDENTIALS_DIR = Path(__file__).parent.parent / "credentials"
TOKEN_PATH = CREDENTIALS_DIR / "calendar_token.json"
CLIENT_SECRET_PATH = CREDENTIALS_DIR / "client_secret.json"

# Calendar API scopes (read-only)
SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]


def is_configured() -> bool:
    """Check if Calendar credentials are set up."""
    return CLIENT_SECRET_PATH.exists()


def get_service():
    """
    Get an authenticated Calendar API service.
    
    Shares client_secret.json with Gmail (same Google Cloud project).
    """
    try:
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from googleapiclient.discovery import build
    except ImportError:
        logger.error("Google API packages not installed")
        return None
    
    creds = None
    
    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not CLIENT_SECRET_PATH.exists():
                logger.error(f"OAuth client secret not found at {CLIENT_SECRET_PATH}")
                return None
            
            flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRET_PATH), SCOPES)
            creds = flow.run_local_server(port=0)
        
        CREDENTIALS_DIR.mkdir(parents=True, exist_ok=True)
        TOKEN_PATH.write_text(creds.to_json())
        logger.info("Calendar token saved")
    
    return build("calendar", "v3", credentials=creds)


def fetch_upcoming_events(hours_ahead: int = 2) -> List[Dict]:
    """
    Fetch calendar events in the next N hours.
    
    Args:
        hours_ahead: How far ahead to look (default 2 hours)
    
    Returns:
        List of event dicts with keys:
        - id: event ID
        - summary: event title
        - start: start datetime string
        - end: end datetime string
        - location: event location (if set)
        - description: event description (if set)
        - meeting_link: video call link (if found)
        - attendees: list of attendee emails
        - is_all_day: bool
        - minutes_until: minutes until event starts
    """
    service = get_service()
    if not service:
        logger.warning("Calendar service not available")
        return []
    
    try:
        now = datetime.now(timezone.utc)
        time_max = now + timedelta(hours=hours_ahead)
        
        events_result = service.events().list(
            calendarId="primary",
            timeMin=now.isoformat(),
            timeMax=time_max.isoformat(),
            maxResults=20,
            singleEvents=True,
            orderBy="startTime"
        ).execute()
        
        events = events_result.get("items", [])
        
        parsed_events = []
        for event in events:
            start = event.get("start", {})
            end = event.get("end", {})
            
            # Determine if all-day event
            is_all_day = "date" in start and "dateTime" not in start
            
            # Parse start time
            start_str = start.get("dateTime", start.get("date", ""))
            
            # Calculate minutes until start
            minutes_until = None
            if not is_all_day and start_str:
                try:
                    start_dt = datetime.fromisoformat(start_str)
                    if start_dt.tzinfo is None:
                        start_dt = start_dt.replace(tzinfo=timezone.utc)
                    minutes_until = int((start_dt - now).total_seconds() / 60)
                except (ValueError, TypeError):
                    pass
            
            # Look for meeting links
            meeting_link = None
            if event.get("hangoutLink"):
                meeting_link = event["hangoutLink"]
            elif event.get("conferenceData", {}).get("entryPoints"):
                for ep in event["conferenceData"]["entryPoints"]:
                    if ep.get("entryPointType") == "video":
                        meeting_link = ep.get("uri")
                        break
            
            # Get attendees
            attendees = []
            for attendee in event.get("attendees", []):
                attendees.append(attendee.get("email", ""))
            
            parsed_events.append({
                "id": event.get("id", ""),
                "summary": event.get("summary", "(no title)"),
                "start": start_str,
                "end": end.get("dateTime", end.get("date", "")),
                "location": event.get("location", ""),
                "description": (event.get("description", "") or "")[:200],
                "meeting_link": meeting_link,
                "attendees": attendees,
                "is_all_day": is_all_day,
                "minutes_until": minutes_until,
            })
        
        logger.info(f"Fetched {len(parsed_events)} upcoming events")
        return parsed_events
    
    except Exception as e:
        logger.error(f"Failed to fetch calendar events: {e}")
        return []


def summarize_events(events: List[Dict]) -> str:
    """
    Create a text summary of upcoming events for the reasoner.
    """
    if not events:
        return "No upcoming events in the next 2 hours."
    
    lines = [f"Upcoming events: {len(events)}"]
    
    for event in events:
        lines.append(f"\n- {event['summary']}")
        
        if event["minutes_until"] is not None:
            if event["minutes_until"] <= 0:
                lines.append(f"  Time: NOW / in progress")
            else:
                lines.append(f"  Time: in {event['minutes_until']} minutes")
        
        if event["is_all_day"]:
            lines.append(f"  All-day event")
        
        if event["location"]:
            lines.append(f"  Location: {event['location']}")
        
        if event["meeting_link"]:
            lines.append(f"  Meeting link: {event['meeting_link']}")
        
        if event["attendees"]:
            lines.append(f"  Attendees: {', '.join(event['attendees'][:5])}")
            if len(event["attendees"]) > 5:
                lines.append(f"    ... and {len(event['attendees']) - 5} more")
        
        if event["description"]:
            lines.append(f"  Notes: {event['description'][:100]}")
    
    return "\n".join(lines)
