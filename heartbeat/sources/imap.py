"""
IMAP Email Source for ARDEN Heartbeat

Supports any IMAP-compatible email server including:
- ProtonMail Bridge (127.0.0.1:1143)
- Gmail (IMAP)
- Standard IMAP servers

Usage:
    from sources.imap import IMAPClient
    from sources.protonmail import PROTONMAIL_CONFIG
    
    client = IMAPClient(**PROTONMAIL_CONFIG)
    emails = client.check_unread()
    
    for email in emails:
        print(f"From: {email['sender']}")
        print(f"Subject: {email['subject']}")
        print(f"Preview: {email['snippet'][:100]}...")
"""

import imaplib
import email
from email.header import decode_header
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging
import os

logger = logging.getLogger("arden.heartbeat.imap")


class IMAPClient:
    """Generic IMAP client for email monitoring."""
    
    def __init__(
        self,
        host: str,
        port: int,
        username: str,
        password: str,
        use_ssl: bool = True,
        folders: List[str] = None
    ):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.use_ssl = use_ssl
        self.folders = folders or ["INBOX"]
        self.connection = None
        
    def connect(self) -> bool:
        """Establish connection to IMAP server."""
        try:
            if self.use_ssl:
                self.connection = imaplib.IMAP4_SSL(self.host, self.port)
            else:
                self.connection = imaplib.IMAP4(self.host, self.port)
                
            self.connection.login(self.username, self.password)
            logger.info(f"Connected to IMAP server: {self.host}:{self.port}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to IMAP: {e}")
            return False
    
    def disconnect(self):
        """Close IMAP connection."""
        if self.connection:
            try:
                self.connection.close()
                self.connection.logout()
                logger.info("Disconnected from IMAP server")
            except Exception as e:
                logger.warning(f"Error during disconnect: {e}")
            finally:
                self.connection = None
    
    def check_unread(self, folder: str = "INBOX") -> List[Dict]:
        """Check for unread emails in specified folder."""
        if not self.connection:
            logger.error("Not connected to IMAP server")
            return []
        
        try:
            status, _ = self.connection.select(folder)
            if status != 'OK':
                logger.error(f"Failed to select folder: {folder}")
                return []
            
            # Search for unread emails
            status, messages = self.connection.search(None, 'UNSEEN')
            if status != 'OK':
                logger.warning("No unread messages found")
                return []
            
            email_ids = messages[0].split()
            logger.info(f"Found {len(email_ids)} unread emails in {folder}")
            
            emails = []
            for msg_id in email_ids[:10]:  # Limit to 10 most recent
                email_data = self._fetch_email(msg_id)
                if email_data:
                    emails.append(email_data)
            
            return emails
            
        except Exception as e:
            logger.error(f"Error checking unread emails: {e}")
            return []
    
    def fetch_emails_since(self, since: datetime, folder: str = "INBOX") -> List[Dict]:
        """Fetch emails received since specified datetime."""
        if not self.connection:
            logger.error("Not connected to IMAP server")
            return []
        
        try:
            status, _ = self.connection.select(folder)
            if status != 'OK':
                logger.error(f"Failed to select folder: {folder}")
                return []
            
            # Format date for IMAP search
            date_str = since.strftime("%d-%b-%Y")
            status, messages = self.connection.search(None, f'SINCE {date_str}')
            
            if status != 'OK':
                logger.warning("No messages found since specified date")
                return []
            
            email_ids = messages[0].split()
            emails = []
            
            for msg_id in email_ids[-20:]:  # Last 20 emails
                email_data = self._fetch_email(msg_id)
                if email_data:
                    # Filter by actual datetime
                    email_date = email_data.get('date')
                    if email_date and email_date >= since:
                        emails.append(email_data)
            
            return emails
            
        except Exception as e:
            logger.error(f"Error fetching emails: {e}")
            return []
    
    def _fetch_email(self, msg_id: bytes) -> Optional[Dict]:
        """Fetch and parse a single email by ID."""
        try:
            status, msg_data = self.connection.fetch(msg_id, '(RFC822)')
            if status != 'OK':
                return None
            
            raw_email = msg_data[0][1]
            msg = email.message_from_bytes(raw_email)
            
            # Parse headers
            subject = self._decode_header(msg.get('Subject', ''))
            sender = self._decode_header(msg.get('From', ''))
            date_str = msg.get('Date', '')
            
            # Parse date
            try:
                email_date = email.utils.parsedate_to_datetime(date_str)
            except:
                email_date = datetime.now()
            
            # Get body/snippet
            body = self._get_email_body(msg)
            snippet = body[:200] if body else ""
            
            return {
                'id': msg_id.decode(),
                'subject': subject,
                'sender': sender,
                'date': email_date,
                'snippet': snippet,
                'body': body,
                'is_read': False
            }
            
        except Exception as e:
            logger.error(f"Error parsing email {msg_id}: {e}")
            return None
    
    def _decode_header(self, header: str) -> str:
        """Decode email header (handles MIME encoding)."""
        if not header:
            return ""
        
        decoded_parts = decode_header(header)
        decoded = []
        
        for part, charset in decoded_parts:
            if isinstance(part, bytes):
                try:
                    decoded.append(part.decode(charset or 'utf-8'))
                except:
                    decoded.append(part.decode('utf-8', errors='ignore'))
            else:
                decoded.append(part)
        
        return ''.join(decoded)
    
    def _get_email_body(self, msg) -> str:
        """Extract plain text body from email message."""
        body = ""
        
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition", ""))
                
                # Skip attachments
                if "attachment" in content_disposition:
                    continue
                
                # Get text content
                if content_type == "text/plain":
                    try:
                        body = part.get_payload(decode=True).decode('utf-8')
                        break
                    except:
                        pass
                elif content_type == "text/html" and not body:
                    try:
                        html = part.get_payload(decode=True).decode('utf-8')
                        # Basic HTML to text conversion
                        import re
                        body = re.sub('<[^<]+?>', '', html)
                    except:
                        pass
        else:
            # Single part message
            try:
                body = msg.get_payload(decode=True).decode('utf-8')
            except:
                pass
        
        return body
    
    def mark_as_read(self, msg_id: str):
        """Mark an email as read (remove UNSEEN flag)."""
        if self.connection:
            try:
                self.connection.store(msg_id.encode(), '+FLAGS', '\\Seen')
                logger.debug(f"Marked email {msg_id} as read")
            except Exception as e:
                logger.error(f"Error marking email as read: {e}")


# ProtonMail Bridge specific configuration
PROTONMAIL_IMAP_CONFIG = {
    "host": "127.0.0.1",
    "port": 1143,
    "use_ssl": False,  # Bridge uses localhost, encryption handled by Proton
    "folders": ["INBOX", "Starred", "Archive"]
}


def get_protonmail_client() -> Optional[IMAPClient]:
    """Create IMAP client configured for ProtonMail Bridge."""
    username = os.getenv('PROTONMAIL_USERNAME')
    password = os.getenv('PROTONMAIL_BRIDGE_PASSWORD')
    
    if not username or not password:
        logger.error("ProtonMail credentials not set in environment")
        logger.info("Set PROTONMAIL_USERNAME and PROTONMAIL_BRIDGE_PASSWORD")
        return None
    
    return IMAPClient(
        host=PROTONMAIL_IMAP_CONFIG["host"],
        port=PROTONMAIL_IMAP_CONFIG["port"],
        username=username,
        password=password,
        use_ssl=PROTONMAIL_IMAP_CONFIG["use_ssl"],
        folders=PROTONMAIL_IMAP_CONFIG["folders"]
    )


# Test function
if __name__ == "__main__":
    # Test connection
    print("Testing IMAP connection...")
    
    # Check environment
    if not os.getenv('PROTONMAIL_USERNAME'):
        print("❌ PROTONMAIL_USERNAME not set")
        print("   Run: export PROTONMAIL_USERNAME=your-email@protonmail.com")
        exit(1)
    
    if not os.getenv('PROTONMAIL_BRIDGE_PASSWORD'):
        print("❌ PROTONMAIL_BRIDGE_PASSWORD not set")
        print("   Get this from ProtonMail Bridge settings")
        exit(1)
    
    # Create client
    client = get_protonmail_client()
    if not client:
        exit(1)
    
    # Connect
    if not client.connect():
        print("❌ Failed to connect to ProtonMail Bridge")
        print("   Make sure protonmail-bridge is running")
        exit(1)
    
    print("✅ Connected to ProtonMail Bridge")
    
    # Check unread
    emails = client.check_unread()
    print(f"📧 Found {len(emails)} unread emails")
    
    for email in emails[:3]:  # Show first 3
        print(f"\nFrom: {email['sender']}")
        print(f"Subject: {email['subject']}")
        print(f"Preview: {email['snippet'][:80]}...")
    
    client.disconnect()
    print("\n✅ Test complete!")
