"""
Gmail Source - Fetches unread emails from Gmail API

Uses OAuth2 for authentication. Credentials stored in heartbeat/credentials/.
Only reads emails -- never sends, modifies, or deletes.
"""

import logging
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

logger = logging.getLogger("arden.heartbeat.gmail")

CREDENTIALS_DIR = Path(__file__).parent.parent / "credentials"
TOKEN_PATH = CREDENTIALS_DIR / "gmail_token.json"
CLIENT_SECRET_PATH = CREDENTIALS_DIR / "client_secret.json"

# Gmail API scopes (read-only)
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


def is_configured() -> bool:
    """Check if Gmail credentials are set up."""
    return CLIENT_SECRET_PATH.exists()


def get_service():
    """
    Get an authenticated Gmail API service.
    
    Requires:
    - heartbeat/credentials/client_secret.json (OAuth2 client config)
    - heartbeat/credentials/gmail_token.json (auto-created after first auth)
    """
    try:
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from googleapiclient.discovery import build
    except ImportError:
        logger.error("Google API packages not installed. Run: pip install google-api-python-client google-auth-oauthlib")
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
                logger.error("Download from Google Cloud Console > APIs & Services > Credentials")
                return None
            
            flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRET_PATH), SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save token for future use
        CREDENTIALS_DIR.mkdir(parents=True, exist_ok=True)
        TOKEN_PATH.write_text(creds.to_json())
        logger.info("Gmail token saved")
    
    return build("gmail", "v1", credentials=creds)


def fetch_unread_emails(max_results: int = 20) -> List[Dict]:
    """
    Fetch unread emails from the inbox.
    
    Returns:
        List of email dicts with keys:
        - id: message ID
        - subject: email subject
        - sender: from address
        - snippet: brief preview
        - date: received date
        - labels: list of label names
        - is_important: bool
    """
    service = get_service()
    if not service:
        logger.warning("Gmail service not available")
        return []
    
    try:
        # Fetch unread messages in inbox
        results = service.users().messages().list(
            userId="me",
            q="is:unread in:inbox",
            maxResults=max_results
        ).execute()
        
        messages = results.get("messages", [])
        if not messages:
            logger.info("No unread emails")
            return []
        
        emails = []
        for msg_ref in messages:
            try:
                msg = service.users().messages().get(
                    userId="me",
                    id=msg_ref["id"],
                    format="metadata",
                    metadataHeaders=["Subject", "From", "Date"]
                ).execute()
                
                headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}
                labels = msg.get("labelIds", [])
                
                emails.append({
                    "id": msg["id"],
                    "subject": headers.get("Subject", "(no subject)"),
                    "sender": headers.get("From", "unknown"),
                    "snippet": msg.get("snippet", ""),
                    "date": headers.get("Date", ""),
                    "labels": labels,
                    "is_important": "IMPORTANT" in labels,
                })
            except Exception as e:
                logger.warning(f"Failed to fetch email {msg_ref['id']}: {e}")
                continue
        
        logger.info(f"Fetched {len(emails)} unread emails")
        return emails
    
    except Exception as e:
        logger.error(f"Failed to fetch emails: {e}")
        return []


def summarize_emails(emails: List[Dict]) -> str:
    """
    Create a text summary of emails for the reasoner.
    
    Returns a structured text that Claude can reason over.
    """
    if not emails:
        return "No unread emails."
    
    lines = [f"Unread emails: {len(emails)}"]
    
    important = [e for e in emails if e["is_important"]]
    if important:
        lines.append(f"\nIMPORTANT ({len(important)}):")
        for e in important:
            lines.append(f"  - From: {e['sender']}")
            lines.append(f"    Subject: {e['subject']}")
            lines.append(f"    Preview: {e['snippet'][:100]}")
    
    regular = [e for e in emails if not e["is_important"]]
    if regular:
        lines.append(f"\nRegular ({len(regular)}):")
        for e in regular[:10]:  # Limit to 10
            lines.append(f"  - {e['sender']}: {e['subject']}")
    
    return "\n".join(lines)
