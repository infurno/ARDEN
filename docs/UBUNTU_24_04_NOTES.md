# Ubuntu 24.04 LTS Deployment Notes for ARDEN

This document covers Ubuntu 24.04 specific considerations when deploying ARDEN.

## Key Differences from Ubuntu 22.04

### Python 3.13 Changes

Ubuntu 24.04 ships with **Python 3.13.x** which introduced several important changes:

1. **`distutils` module removed** (PEP 632)
   - The `distutils` module is no longer part of the standard library
   - This affects native module compilation (like better-sqlite3)
   - The `python3-distutils` package no longer exists in Ubuntu 24.04

2. **Solution: `python3-setuptools`**
   - Setuptools 48+ includes a vendored copy of distutils
   - Installing `python3-setuptools` provides distutils functionality
   - Our setup scripts install this automatically

### Node.js Requirements

**ARDEN requires Node.js 20+ on Ubuntu 24.04**

Why Node.js 20+:
- better-sqlite3 v12.5.0 officially supports Node.js 20, 22, 23, 24, 25
- Node.js 20 comes with npm 10.x which includes node-gyp v10+
- node-gyp v10+ removed the distutils dependency
- Node.js 18 reaches EOL in April 2025

### Package Changes

Packages that **don't exist** in Ubuntu 24.04:
- `python3-distutils` (merged into python3-setuptools)

Packages **required** for Ubuntu 24.04:
- `python3-setuptools` (provides distutils for Python 3.13)
- `python3-venv` (Python virtual environment support)
- `build-essential` (C++ compiler for native modules)
- `python3-dev` (Python development headers)
- `libsqlite3-dev` (SQLite development libraries)
- `ffmpeg` (Audio processing for voice features)

## Installation Process

### Automated Setup

Use our Ubuntu 24.04 compatible setup script:

```bash
./scripts/deploy-full-auto.sh
```

This script automatically:
1. Installs all required system packages
2. Installs Node.js 20 LTS via NVM
3. Configures npm to use system Python
4. Handles Python 3.13 compatibility
5. Builds better-sqlite3 successfully
6. Configures all services

### Manual Setup

If you prefer manual installation:

```bash
# 1. Install system dependencies
sudo apt update
sudo apt install -y \
    build-essential \
    python3-dev \
    python3-pip \
    python3-setuptools \
    python3-venv \
    git \
    curl \
    wget \
    nginx \
    certbot \
    python3-certbot-nginx \
    sqlite3 \
    libsqlite3-dev \
    ffmpeg

# 2. Install Node.js 20 LTS via NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20

# 3. Configure npm for Python 3.13
npm config set python /usr/bin/python3
echo 'export npm_config_python=/usr/bin/python3' >> ~/.bashrc

# 4. Install PM2
npm install -g pm2

# 5. Clone and setup ARDEN
cd ~
git clone https://github.com/yourusername/ARDEN.git
cd ARDEN
git checkout arden-prod

# 6. Configure environment
cp .env.example .env
nano .env  # Add your API keys

# 7. Install dependencies
cd api
npm install --omit=dev

# 8. Start services
cd ..
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'distutils'"

**Cause**: Python 3.13 removed distutils, and node-gyp is trying to use it.

**Solution**:
```bash
# Install python3-setuptools
sudo apt install -y python3-setuptools

# Configure npm to use system Python
export npm_config_python=/usr/bin/python3
npm config set python /usr/bin/python3

# Clean and reinstall
cd ~/ARDEN/api
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --omit=dev
```

### Issue: "Unsupported engine" warning for better-sqlite3

**Cause**: Using Node.js 18 or older.

**Solution**:
```bash
# Upgrade to Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# Verify version
node -v  # Should show v20.x.x

# Reinstall dependencies
cd ~/ARDEN/api
rm -rf node_modules
npm install --omit=dev
```

### Issue: npm install fails with "gyp ERR!"

**Cause**: Missing build dependencies.

**Solution**:
```bash
# Install all build dependencies
sudo apt install -y \
    build-essential \
    python3-dev \
    python3-setuptools \
    libsqlite3-dev

# Deactivate any Python virtual environment
deactivate 2>/dev/null || true

# Set npm to use system Python
export npm_config_python=/usr/bin/python3

# Retry installation
cd ~/ARDEN/api
npm install --omit=dev
```

### Issue: SSL certificate fails

**Cause**: DNS not propagated or rate limit hit.

**Solution**:
```bash
# Verify DNS is pointing to your VPS
dig rocket.id10t.social +short

# If DNS is correct, manually request certificate
sudo certbot --nginx -d rocket.id10t.social

# If rate limited, use staging first
sudo certbot --nginx -d rocket.id10t.social --staging
```

### Issue: Services won't start

**Cause**: Various - check logs first.

**Solution**:
```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs

# Check specific service
pm2 logs arden-bot
pm2 logs arden-web

# Restart services
pm2 restart all

# If still failing, check .env
cat ~/ARDEN/.env | grep -E "TELEGRAM_BOT_TOKEN|OPENAI_API_KEY"
```

## Performance Optimization

### Memory Management

Ubuntu 24.04 on a VPS typically has limited memory:

```bash
# Check memory usage
free -h

# Monitor PM2 processes
pm2 monit

# Adjust memory limits in ecosystem.config.js if needed
nano ~/ARDEN/ecosystem.config.js
# Change max_memory_restart value
```

### Disk Space

```bash
# Check disk usage
df -h

# Clear old logs
pm2 flush  # Clear PM2 logs

# Clean npm cache if needed
npm cache clean --force

# Clear old backups (keeps 7 days automatically)
ls -lh ~/backups/
```

## Security Considerations

### Firewall

Our setup enables UFW firewall automatically:

```bash
# Check firewall status
sudo ufw status

# Verify rules
sudo ufw status numbered

# Should show:
# 22 (SSH) - ALLOW
# 80 (HTTP) - ALLOW
# 443 (HTTPS) - ALLOW
```

### SSL/TLS

Let's Encrypt certificates auto-renew:

```bash
# Check certificate expiry
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Force renewal if needed
sudo certbot renew
```

### API Keys

Protect your .env file:

```bash
# Verify permissions
ls -la ~/ARDEN/.env
# Should be: -rw------- (600)

# Fix if needed
chmod 600 ~/ARDEN/.env
```

## Monitoring

### System Health

```bash
# Check all services
pm2 status

# View logs
pm2 logs --lines 100

# Monitor resources
pm2 monit

# Check system resources
htop
```

### Backups

Automated daily backups are configured:

```bash
# Check backup directory
ls -lh ~/backups/

# View backup log
tail -f ~/backups/backup.log

# Manually trigger backup
~/backups/daily-backup.sh

# Restore from backup
cd ~/ARDEN
cp ~/backups/YYYY-MM-DD.tar.gz .
tar -xzf YYYY-MM-DD.tar.gz
cp YYYY-MM-DD/.env .env
chmod 600 .env
pm2 restart all
```

## Upgrade Path

### From Ubuntu 22.04 to 24.04

If upgrading your VPS from Ubuntu 22.04:

1. **Before upgrade**:
   ```bash
   # Backup everything
   ~/backups/daily-backup.sh
   
   # Stop services
   pm2 save
   pm2 stop all
   ```

2. **After upgrade**:
   ```bash
   # Reinstall Node.js 20
   nvm install 20
   nvm use 20
   
   # Reinstall npm packages
   cd ~/ARDEN/api
   rm -rf node_modules
   npm install --omit=dev
   
   # Restart services
   pm2 resurrect
   ```

## Additional Resources

- [Python 3.13 What's New](https://docs.python.org/3/whatsnew/3.13.html)
- [PEP 632 - Deprecate distutils](https://peps.python.org/pep-0632/)
- [Node.js 20 Release Notes](https://nodejs.org/en/blog/release/v20.0.0)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs: `pm2 logs`
3. Run verification: `./scripts/verify-deployment.sh`
4. Check the main deployment guide: `DEPLOYMENT_ROCKET.md`
