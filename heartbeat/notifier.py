"""
Heartbeat Notifier - Routes notifications to ARDEN adapters

Sends notification messages to the configured adapter channels
by calling ARDEN's existing HTTP API.
"""

import json
import logging
import os
import urllib.request
import urllib.error
from typing import Optional

logger = logging.getLogger("arden.heartbeat.notifier")

# ARDEN API base URL (the existing Node.js web server)
ARDEN_API_URL = os.environ.get("ARDEN_API_URL", "http://127.0.0.1:3001")
ARDEN_API_TOKEN = os.environ.get("ARDEN_API_TOKEN", "")


def notify(message: str, channel: str = "telegram", urgency: str = "normal") -> bool:
    """
    Send a notification through ARDEN's adapter system.
    
    Args:
        message: The notification message
        channel: Target channel ("telegram", "discord", "web", "slack")
        urgency: "normal", "urgent", or "critical"
    
    Returns:
        True if notification was sent successfully
    """
    logger.info(f"Sending notification via {channel}: {message[:80]}...")
    
    # For now, send via ARDEN's chat API as a system message
    # In the future, this can use adapter-specific endpoints
    try:
        payload = json.dumps({
            "message": f"[Heartbeat] {message}",
            "source": "heartbeat",
            "urgency": urgency,
            "channel": channel,
        }).encode("utf-8")
        
        req = urllib.request.Request(
            f"{ARDEN_API_URL}/api/chat",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {ARDEN_API_TOKEN}",
            },
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status == 200:
                logger.info("Notification sent successfully")
                return True
            else:
                logger.warning(f"Notification API returned status {resp.status}")
                return False
    
    except urllib.error.URLError as e:
        logger.error(f"Failed to send notification: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending notification: {e}")
        return False


def notify_all_channels(message: str, urgency: str = "urgent") -> int:
    """
    Send notification to all active channels (for urgent/critical messages).
    
    Returns:
        Number of channels successfully notified
    """
    channels = ["telegram", "web"]  # Active channels
    success = 0
    
    for channel in channels:
        if notify(message, channel=channel, urgency=urgency):
            success += 1
    
    return success


def log_heartbeat_result(message: str):
    """
    Log heartbeat result to the daily log via ARDEN's memory API.
    
    This is a fire-and-forget call -- if it fails, we just log the error.
    """
    try:
        payload = json.dumps({
            "section": "Heartbeat",
            "entry": message,
        }).encode("utf-8")
        
        req = urllib.request.Request(
            f"{ARDEN_API_URL}/api/memory/daily-log",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {ARDEN_API_TOKEN}",
            },
            method="POST"
        )
        
        urllib.request.urlopen(req, timeout=5)
    except Exception as e:
        logger.debug(f"Failed to log heartbeat result: {e}")
