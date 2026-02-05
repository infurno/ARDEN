# Quick Fix for VPS NPM Install Error

## Problem
The `better-sqlite3` package fails to build because:
1. Python 3.13+ removed the `distutils` module (now only in setuptools)
2. node-gyp is using the venv Python instead of system Python
3. Modern Ubuntu versions (22.04+) don't have a separate `python3-distutils` package

## Solution

SSH into your VPS as the `arden` user and run:

```bash
# Install required build dependencies
sudo apt update
sudo apt install -y \
    build-essential \
    python3-dev \
    python3-pip \
    python3-setuptools \
    python3-venv \
    sqlite3 \
    libsqlite3-dev \
    ffmpeg

# Temporarily deactivate venv so npm uses system Python
deactivate 2>/dev/null || true

# Set node-gyp to use system Python (not venv Python)
export npm_config_python=/usr/bin/python3

# Clean and reinstall npm packages
cd ~/ARDEN/api
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --production

# Verify installation
npm list better-sqlite3
```

**Alternative Fix (if above doesn't work):**

```bash
# Install setuptools in the venv (provides distutils for Python 3.13+)
source ~/ARDEN/venv/bin/activate
pip install setuptools

# Then try npm install again
cd ~/ARDEN/api
npm install --production
```

## What This Does

1. **build-essential** - Provides C++ compiler needed for native modules
2. **python3-setuptools** - Provides distutils for Python 3.13+ (replaces removed python3-distutils)
3. **python3-dev** - Python development headers
4. **python3-venv** - Python virtual environment support
5. **libsqlite3-dev** - SQLite development libraries for better-sqlite3
6. **ffmpeg** - Audio processing (required for voice features)
7. Cleans npm cache and node_modules to ensure fresh install

## After Installation

```bash
# Verify installation succeeded
cd ~/ARDEN/api
npm list better-sqlite3

# Start services
cd ~/ARDEN
pm2 start ecosystem.config.js
pm2 save
```

## For Future Deployments

Use the automated setup script:

```bash
curl -fsSL https://raw.githubusercontent.com/infurno/ARDEN/arden-prod/scripts/setup-vps.sh | bash
```

This installs all dependencies automatically.
