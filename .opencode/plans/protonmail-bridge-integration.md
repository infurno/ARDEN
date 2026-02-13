# ProtonMail Bridge Integration Plan

> Integrate ProtonMail with ARDEN Heartbeat system via ProtonMail Bridge (local IMAP)
> **Created:** 2026-02-13
> **Status:** Planning Phase

## Overview

ProtonMail uses end-to-end encryption, making direct API access impossible. The solution is **ProtonMail Bridge** - a local application that decrypts emails and exposes them via IMAP/SMTP on localhost. This allows ARDEN to monitor ProtonMail just like Gmail, but with full privacy.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  ProtonMail     │────▶│  Bridge (local)  │────▶│  ARDEN          │
│  (encrypted)    │     │  IMAP:1143       │     │  Heartbeat      │
│                 │     │  SMTP:1025       │     │  (reasoning)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌──────────────────┐
                        │  Claude API      │
                        │  (analysis)      │
                        └──────────────────┘
```

## Phase 1: Install ProtonMail Bridge

### 1.1 System Requirements
- Arch Linux (confirmed ✓)
- GUI or CLI capable of handling auth flow
- Ports 1143 (IMAP) and 1025 (SMTP) available locally

### 1.2 Installation Options

#### Option A: AUR Package (Recommended)
```bash
# Using yay
yay -S protonmail-bridge

# Or using paru
paru -S protonmail-bridge
```

#### Option B: Official Binary
```bash
# Download from https://proton.me/mail/bridge
wget https://proton.me/download/bridge/protonmail-bridge-3.18.0-1-x86_64.pkg.tar.zst
sudo pacman -U protonmail-bridge-3.18.0-1-x86_64.pkg.tar.zst
```

#### Option C: Build from Source
```bash
git clone https://github.com/ProtonMail/proton-bridge.git
cd proton-bridge
make build
sudo make install
```

### 1.3 Initial Configuration

```bash
# Start bridge (GUI mode - for initial setup)
protonmail-bridge

# Or CLI mode
protonmail-bridge --cli
```

**Setup Steps:**
1. Login with ProtonMail credentials
2. Complete 2FA if enabled
3. Bridge will start listening on:
   - IMAP: `127.0.0.1:1143`
   - SMTP: `127.0.0.1:1025`
4. Note the **bridge password** (randomly generated, different from your ProtonMail password)

## Phase 2: Create IMAP Source Module

### 2.1 File Structure
```
heartbeat/
└── sources/
    ├── __init__.py
    ├── gmail.py          # Existing
    ├── calendar.py       # Existing
    └── imap.py           # NEW - Generic IMAP client
        └── protonmail    # ProtonMail-specific config
```

### 2.2 Module: `heartbeat/sources/imap.py`

**Key Features:**
- Generic IMAP client (works with any IMAP server)
- ProtonMail Bridge pre-configuration
- OAuth2 support for future Gmail-IMAP
- SSL/TLS support
- IDLE mode for real-time notifications (optional)

**Core Functions:**
```python
class IMAPClient:
    def connect(host, port, username, password, ssl=True)
    def check_unread(folder="INBOX") -> List[Email]
    def fetch_emails(since: datetime) -> List[Email]
    def get_email_content(msg_id) -> Email
    def mark_as_read(msg_id)
    def disconnect()
```

### 2.3 ProtonMail-Specific Config

```python
# heartbeat/sources/protonmail.py
PROTONMAIL_CONFIG = {
    "host": "127.0.0.1",
    "port": 1143,
    "ssl": False,  # Bridge uses localhost, encryption handled by Proton
    "username": "your-email@protonmail.com",
    "password": "bridge-password-from-step-1.3",
    "folders": ["INBOX", "Starred", "Archive"]
}
```

## Phase 3: Integrate with Heartbeat

### 3.1 Update Heartbeat Config

Add to `HEARTBEAT.md` and `heartbeat/config.py`:

```yaml
sources:
  protonmail:
    enabled: true
    type: imap
    bridge_host: 127.0.0.1
    bridge_port: 1143
    username: ${PROTONMAIL_USERNAME}
    password: ${PROTONMAIL_BRIDGE_PASSWORD}
    check_interval: 1800  # 30 minutes
    folders:
      - INBOX
      - Starred
    priority_keywords:
      - urgent
      - important
      - meeting
      - deadline
```

### 3.2 Update Heartbeat Main Loop

```python
# In heartbeat/main.py
from sources.imap import IMAPClient
from sources.protonmail import PROTONMAIL_CONFIG

async def check_protonmail():
    client = IMAPClient(**PROTONMAIL_CONFIG)
    await client.connect()
    
    unread = await client.check_unread()
    important = filter_priority_emails(unread)
    
    await client.disconnect()
    return {
        "source": "protonmail",
        "unread_count": len(unread),
        "important_count": len(important),
        "emails": important
    }
```

### 3.3 Reasoning Integration

Claude will now receive data from both Gmail AND ProtonMail:

```python
context = {
    "gmail": {...},
    "protonmail": {...},
    "calendar": {...}
}

# Claude analyzes both email sources
```

## Phase 4: Security Considerations

### 4.1 Bridge Password Storage
- Store in `.env` file (already .gitignored)
- Never commit credentials
- Use systemd user service to auto-start bridge

### 4.2 Local Security
- Bridge only listens on 127.0.0.1 (localhost)
- No external network exposure
- Emails decrypted only in memory

### 4.3 Credential Rotation
- Bridge password can be regenerated
- Document rotation procedure

## Phase 5: Testing Plan

### 5.1 Manual Tests
```bash
# Test 1: Bridge connectivity
python -c "from heartbeat.sources.imap import IMAPClient; ..."

# Test 2: Fetch emails
python heartbeat/sources/imap.py --test

# Test 3: Full heartbeat cycle
python heartbeat/main.py --dry-run
```

### 5.2 Integration Tests
- Send test email to ProtonMail
- Verify heartbeat detects it
- Verify Claude receives context
- Verify notification sent to web UI

## Phase 6: Deployment

### 6.1 Auto-Start Bridge
Create systemd user service:
```ini
# ~/.config/systemd/user/protonmail-bridge.service
[Unit]
Description=ProtonMail Bridge
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/protonmail-bridge --noninteractive
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
```

Enable:
```bash
systemctl --user enable protonmail-bridge
systemctl --user start protonmail-bridge
```

### 6.2 PM2 Integration
Bridge runs independently, heartbeat connects to it:
```bash
# Start bridge (if not using systemd)
protonmail-bridge --daemon

# Start heartbeat (already configured)
pm2 restart arden-heartbeat
```

## Implementation Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1 | 15 min | Bridge installed & running |
| 2 | 45 min | IMAP module created |
| 3 | 30 min | Heartbeat integration |
| 4 | 15 min | Security review |
| 5 | 20 min | Testing complete |
| **Total** | **~2 hours** | **Full ProtonMail integration** |

## Next Steps

1. **Install Bridge** - Run Phase 1 commands
2. **Test Connection** - Verify IMAP connectivity
3. **Build Module** - I'll create the IMAP source code
4. **Integrate** - Connect to heartbeat
5. **Test** - Send test emails

**Ready to start with Phase 1?** (Install ProtonMail Bridge)

---

**Notes:**
- Bridge must be running before heartbeat starts
- First auth requires browser/GUI
- CLI mode available for headless operation
- Consider using Proton's official CLI tool if available
