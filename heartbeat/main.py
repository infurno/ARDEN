"""
ARDEN Heartbeat Daemon - Main Entry Point

Scheduled loop that:
1. Reads configuration from HEARTBEAT.md
2. Gathers data from enabled sources (Gmail, Calendar)
3. Sends data to Claude for reasoning
4. Routes notifications to adapters
5. Logs results to daily log

Run directly:
    python -m heartbeat.main

Or via PM2:
    pm2 start ecosystem.config.js --only arden-heartbeat
"""

import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from heartbeat.config import load_config
from heartbeat.sources.gmail import fetch_unread_emails, summarize_emails, is_configured as gmail_configured
from heartbeat.sources.calendar import fetch_upcoming_events, summarize_events, is_configured as calendar_configured
from heartbeat.sources.imap import get_protonmail_client
from heartbeat.reasoner import reason_over_data
from heartbeat.notifier import notify, notify_all_channels, log_heartbeat_result

# Configure logging
log_dir = Path(__file__).parent.parent / "logs"
log_dir.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(log_dir / "heartbeat.log", mode="a")
    ]
)
logger = logging.getLogger("arden.heartbeat.main")


def is_active_hours(config: dict) -> bool:
    """Check if current time is within active hours."""
    try:
        import zoneinfo
        tz = zoneinfo.ZoneInfo(config["schedule"]["timezone"])
        now = datetime.now(tz)
    except Exception:
        now = datetime.now()
    
    current_time = now.strftime("%H:%M")
    start = config["schedule"]["active_start"]
    end = config["schedule"]["active_end"]
    
    return start <= current_time <= end


def check_protonmail():
    """Check ProtonMail for unread emails via Bridge."""
    try:
        client = get_protonmail_client()
        if not client:
            return "ProtonMail not configured (set PROTONMAIL_USERNAME and PROTONMAIL_BRIDGE_PASSWORD)."
        
        if not client.connect():
            return "ProtonMail Bridge not running (start: protonmail-bridge)."
        
        emails = client.check_unread()
        client.disconnect()
        
        if not emails:
            return "No unread ProtonMail messages."
        
        # Format summary
        summary = f"{len(emails)} unread ProtonMail messages:\n"
        for email in emails[:5]:  # Top 5
            summary += f"- From: {email['sender'][:50]}, Subject: {email['subject'][:60]}\n"
        
        return summary
        
    except Exception as e:
        logger.error(f"Error checking ProtonMail: {e}")
        return f"ProtonMail check failed: {str(e)}"


def run_heartbeat_cycle():
    """Execute a single heartbeat cycle."""
    logger.info("=== Heartbeat cycle starting ===")
    
    # Load config from HEARTBEAT.md
    config = load_config()
    
    # Check active hours
    if not is_active_hours(config):
        logger.info("Outside active hours, skipping cycle")
        return
    
    # Gather data from enabled sources
    gmail_summary = "Gmail not configured."
    protonmail_summary = "ProtonMail not checked."
    calendar_summary = "Calendar not configured."
    
    if config["sources"]["gmail"]["enabled"]:
        if gmail_configured():
            emails = fetch_unread_emails()
            gmail_summary = summarize_emails(emails)
        else:
            gmail_summary = "Gmail not configured (missing credentials)."
            logger.info("Gmail enabled but not configured")
    
    # Check ProtonMail (always try if credentials are set)
    if os.getenv('PROTONMAIL_USERNAME') and os.getenv('PROTONMAIL_BRIDGE_PASSWORD'):
        protonmail_summary = check_protonmail()
        logger.info("ProtonMail checked")
    else:
        logger.info("ProtonMail not configured")
    
    if config["sources"]["calendar"]["enabled"]:
        if calendar_configured():
            events = fetch_upcoming_events(hours_ahead=2)
            calendar_summary = summarize_events(events)
        else:
            calendar_summary = "Calendar not configured (missing credentials)."
            logger.info("Calendar enabled but not configured")
    
    # Send to Claude for reasoning
    should_notify, message = reason_over_data(
        email_summary=gmail_summary,
        calendar_summary=calendar_summary,
        protonmail_summary=protonmail_summary
    )
    
    # Act on the result
    if should_notify:
        logger.info(f"Notification needed: {message}")
        
        # Send to primary channel
        primary = config["notifications"]["primary_channel"]
        notify(message, channel=primary)
        
        # Log to daily log
        log_heartbeat_result(f"NOTIFY: {message}")
    else:
        logger.info("HEARTBEAT_OK - nothing to report")
        log_heartbeat_result("HEARTBEAT_OK")
    
    logger.info("=== Heartbeat cycle complete ===")


def main():
    """Run the heartbeat daemon with scheduling."""
    logger.info("ARDEN Heartbeat Daemon starting")
    
    config = load_config()
    interval_minutes = config["schedule"]["interval_minutes"]
    interval_seconds = interval_minutes * 60
    
    logger.info(f"Schedule: every {interval_minutes} minutes")
    logger.info(f"Active hours: {config['schedule']['active_start']} - {config['schedule']['active_end']} {config['schedule']['timezone']}")
    logger.info(f"Sources: {', '.join(k for k, v in config['sources'].items() if v['enabled'])}")
    
    # Try using APScheduler for robust scheduling
    try:
        from apscheduler.schedulers.blocking import BlockingScheduler
        from apscheduler.triggers.interval import IntervalTrigger
        
        scheduler = BlockingScheduler()
        scheduler.add_job(
            run_heartbeat_cycle,
            IntervalTrigger(minutes=interval_minutes),
            id="heartbeat",
            name="ARDEN Heartbeat",
            next_run_time=datetime.now()  # Run immediately on start
        )
        
        logger.info("Using APScheduler for heartbeat scheduling")
        scheduler.start()
    
    except ImportError:
        # Fallback to simple sleep loop
        logger.info("APScheduler not available, using simple sleep loop")
        
        while True:
            try:
                run_heartbeat_cycle()
            except Exception as e:
                logger.error(f"Heartbeat cycle failed: {e}", exc_info=True)
            
            logger.info(f"Sleeping {interval_minutes} minutes until next cycle...")
            time.sleep(interval_seconds)


if __name__ == "__main__":
    main()
