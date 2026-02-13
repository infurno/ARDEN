"""
Heartbeat Configuration Parser

Reads HEARTBEAT.md and extracts structured configuration.
This allows the heartbeat behavior to be controlled by editing a markdown file.
"""

import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("arden.heartbeat.config")

ARDEN_ROOT = Path(__file__).parent.parent
HEARTBEAT_PATH = ARDEN_ROOT / "HEARTBEAT.md"


def load_config() -> Dict[str, Any]:
    """
    Parse HEARTBEAT.md into a structured configuration dict.
    
    Returns:
        {
            "schedule": {"interval_minutes": 30, "active_start": "06:00", "active_end": "22:00", "timezone": "America/Chicago"},
            "sources": {
                "gmail": {"enabled": True, ...},
                "calendar": {"enabled": True, ...},
                "asana": {"enabled": False, ...},
                "slack": {"enabled": False, ...}
            },
            "notifications": {
                "primary_channel": "telegram",
                "fallback": "web",
                ...
            }
        }
    """
    try:
        content = HEARTBEAT_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        logger.warning("HEARTBEAT.md not found, using defaults")
        return _default_config()
    
    config = _default_config()
    
    # Parse schedule
    schedule_section = _extract_section(content, "## Schedule")
    if schedule_section:
        interval = _extract_field(schedule_section, "Interval")
        if interval:
            # Extract number from "Every 30 minutes"
            match = re.search(r"(\d+)", interval)
            if match:
                config["schedule"]["interval_minutes"] = int(match.group(1))
        
        active = _extract_field(schedule_section, "Active Hours")
        if active:
            match = re.search(r"(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})", active)
            if match:
                config["schedule"]["active_start"] = match.group(1)
                config["schedule"]["active_end"] = match.group(2)
        
        tz = _extract_field(schedule_section, "Timezone")
        if tz:
            # Extract timezone name, e.g. "America/Chicago (Central)" -> "America/Chicago"
            config["schedule"]["timezone"] = tz.split("(")[0].strip()
    
    # Parse sources
    for source_name in ["Gmail", "Google Calendar", "Asana", "Slack"]:
        source_section = _extract_section(content, f"### {source_name}")
        if source_section:
            key = source_name.lower().replace("google ", "")
            enabled = _extract_field(source_section, "Enabled")
            config["sources"][key]["enabled"] = enabled and enabled.lower() == "true"
    
    # Parse notification preferences
    notif_section = _extract_section(content, "## Notification Preferences")
    if notif_section:
        primary = _extract_field(notif_section, "Primary Channel")
        if primary:
            config["notifications"]["primary_channel"] = primary.lower().split("(")[0].strip()
        
        fallback = _extract_field(notif_section, "Fallback")
        if fallback:
            config["notifications"]["fallback"] = fallback.lower().split()[0].strip()
    
    logger.info("Heartbeat config loaded", extra={
        "interval": config["schedule"]["interval_minutes"],
        "sources": {k: v["enabled"] for k, v in config["sources"].items()}
    })
    
    return config


def _default_config() -> Dict[str, Any]:
    """Return default heartbeat configuration."""
    return {
        "schedule": {
            "interval_minutes": 30,
            "active_start": "06:00",
            "active_end": "22:00",
            "timezone": "America/Chicago"
        },
        "sources": {
            "gmail": {"enabled": True},
            "calendar": {"enabled": True},
            "asana": {"enabled": False},
            "slack": {"enabled": False}
        },
        "notifications": {
            "primary_channel": "telegram",
            "fallback": "web",
            "quiet_mode": True
        }
    }


def _extract_section(content: str, header: str) -> Optional[str]:
    """Extract content under a markdown section header."""
    # Match header level
    level = header.count("#")
    pattern = re.compile(
        rf"^{re.escape(header)}\s*$\n(.*?)(?=^{'#' * level}\s|\Z)",
        re.MULTILINE | re.DOTALL
    )
    match = pattern.search(content)
    return match.group(1).strip() if match else None


def _extract_field(section: str, field_name: str) -> Optional[str]:
    """Extract a field value from '- **Field**: Value' format."""
    pattern = re.compile(rf"\*\*{re.escape(field_name)}\*\*:\s*(.+)", re.IGNORECASE)
    match = pattern.search(section)
    return match.group(1).strip() if match else None
