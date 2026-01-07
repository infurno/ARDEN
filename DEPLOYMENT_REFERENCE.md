# ARDEN Deployment Quick Reference

## VPS: rocket.id10t.social

### Production URLs
- **Web Dashboard:** https://rocket.id10t.social
- **SSH:** `ssh arden@rocket.id10t.social`
- **Git Repo:** git@github.com:infurno/ARDEN.git
- **Branch:** arden-prod

---

## Quick Commands

### Deploy Full Stack
```bash
cd /Users/hal/ARDEN/ansible
ansible-playbook deploy.yml
```

### Deploy Application Only (Fast)
```bash
cd /Users/hal/ARDEN/ansible
ansible-playbook deploy.yml --tags application,pm2
```

### Manual Deployment
```bash
# 1. Push code
git push origin arden-prod

# 2. SSH to VPS
ssh arden@rocket.id10t.social

# 3. Update and restart
cd ~/ARDEN
git pull origin arden-prod
npm install
source ~/.nvm/nvm.sh
pm2 restart all --update-env
pm2 save
```

---

## PM2 Process Management

### Check Status
```bash
ssh arden@rocket.id10t.social
source ~/.nvm/nvm.sh
pm2 status
```

### View Logs
```bash
# All logs
pm2 logs

# Specific service
pm2 logs arden-discord --lines 50
pm2 logs arden-web --lines 50
pm2 logs arden-bot --lines 50

# Error logs only
pm2 logs --err
```

### Restart Services
```bash
# All services
pm2 restart all --update-env

# Specific service
pm2 restart arden-discord --update-env
pm2 restart arden-web --update-env
pm2 restart arden-bot --update-env

# Save PM2 state
pm2 save
```

### Stop/Start Services
```bash
# Stop
pm2 stop arden-discord
pm2 stop all

# Start
pm2 start arden-discord
pm2 start all

# Delete process
pm2 delete arden-discord
```

---

## Configuration Updates

### Update AI Provider/Model
```bash
ssh arden@rocket.id10t.social
nano ~/ARDEN/.env

# Edit:
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini

# Restart
source ~/.nvm/nvm.sh
pm2 restart all --update-env
```

### Update Bot Tokens
```bash
ssh arden@rocket.id10t.social
nano ~/ARDEN/.env

# Edit:
DISCORD_BOT_TOKEN=your-new-token
TELEGRAM_BOT_TOKEN=your-new-token

# Restart specific bot
source ~/.nvm/nvm.sh
pm2 restart arden-discord --update-env
```

### Update Web Dashboard Token
```bash
ssh arden@rocket.id10t.social
nano ~/ARDEN/.env

# Edit:
ARDEN_API_TOKEN=your-new-token

# Restart
source ~/.nvm/nvm.sh
pm2 restart arden-web --update-env
```

---

## Monitoring

### System Resources
```bash
ssh arden@rocket.id10t.social

# CPU/Memory
htop

# Disk usage
df -h

# Specific directory
du -sh ~/ARDEN/*
```

### Check Services
```bash
# Nginx
sudo systemctl status nginx
sudo nginx -t  # Test config

# PM2
pm2 status
pm2 monit  # Real-time monitoring

# Ports
sudo netstat -tlnp | grep 3001  # Web server
sudo netstat -tlnp | grep 80    # Nginx
sudo netstat -tlnp | grep 443   # Nginx SSL
```

### SSL Certificates
```bash
# Check expiry
sudo certbot certificates

# Renew (automatic via cron, but manual if needed)
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

---

## Troubleshooting

### Bot Not Responding

**Discord:**
```bash
# 1. Check status
pm2 logs arden-discord --lines 30

# 2. Verify token
grep DISCORD_BOT_TOKEN ~/ARDEN/.env

# 3. Check MESSAGE CONTENT INTENT enabled in Discord Developer Portal

# 4. Restart
pm2 restart arden-discord --update-env
```

**Telegram:**
```bash
# 1. Check status
pm2 logs arden-bot --lines 30

# 2. Verify token
grep TELEGRAM_BOT_TOKEN ~/ARDEN/.env

# 3. Restart
pm2 restart arden-bot --update-env
```

### Web Dashboard Not Loading

```bash
# 1. Check PM2
pm2 status
pm2 logs arden-web

# 2. Check Nginx
sudo systemctl status nginx
sudo nginx -t

# 3. Check port
sudo netstat -tlnp | grep 3001

# 4. Restart everything
pm2 restart arden-web
sudo systemctl restart nginx
```

### High Memory Usage

```bash
# 1. Check PM2 status
pm2 status

# 2. Use session management
# Go to: https://rocket.id10t.social/sessions.html
# Click "Kill All Sessions" or kill individual idle sessions

# 3. Restart services
pm2 restart all

# 4. Check system memory
free -h
```

### Database Issues

```bash
# 1. Check database file
ls -lh ~/ARDEN/data/arden.db

# 2. Backup database
cp ~/ARDEN/data/arden.db ~/ARDEN/data/arden.db.backup

# 3. Check database integrity (if installed)
sqlite3 ~/ARDEN/data/arden.db "PRAGMA integrity_check;"
```

---

## Backups

### Automated Backups
- **Schedule:** Daily at 2:00 AM
- **Location:** `/home/arden/backups/`
- **Retention:** 7 days
- **Script:** `/home/arden/backup.sh`

### Manual Backup
```bash
ssh arden@rocket.id10t.social

# Run backup script
~/backup.sh

# Or manual backup
cd ~/ARDEN
tar -czf ~/backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  data/arden.db \
  .env \
  ~/.pm2
```

### Restore from Backup
```bash
ssh arden@rocket.id10t.social

# List backups
ls -lh ~/backups/

# Extract backup
cd ~/ARDEN
tar -xzf ~/backups/arden-backup-YYYYMMDD.tar.gz

# Restart services
source ~/.nvm/nvm.sh
pm2 restart all
```

---

## Development Workflow

### Local → Production

```bash
# 1. Local testing
cd /Users/hal/ARDEN
node api/discord-bot.js  # Test locally

# 2. Commit changes
git add .
git commit -m "Description of changes"

# 3. Push to GitHub
git push origin arden-prod

# 4. Deploy via Ansible
cd ansible
ansible-playbook deploy.yml --tags application,pm2

# 5. Verify
ssh arden@rocket.id10t.social
source ~/.nvm/nvm.sh
pm2 status
pm2 logs --lines 30
```

### Emergency Rollback

```bash
ssh arden@rocket.id10t.social
cd ~/ARDEN

# 1. Check commit history
git log --oneline -10

# 2. Rollback to previous commit
git reset --hard HEAD~1

# Or specific commit
git reset --hard <commit-hash>

# 3. Force pull if needed
git fetch origin
git reset --hard origin/arden-prod

# 4. Reinstall dependencies
npm install

# 5. Restart
source ~/.nvm/nvm.sh
pm2 restart all --update-env
```

---

## Ansible Playbook Tags

Use tags for targeted deployments:

```bash
# System packages only
ansible-playbook deploy.yml --tags system

# Node.js setup only
ansible-playbook deploy.yml --tags nodejs

# Application code only
ansible-playbook deploy.yml --tags application

# PM2 processes only
ansible-playbook deploy.yml --tags pm2

# Nginx configuration only
ansible-playbook deploy.yml --tags nginx

# Backup setup only
ansible-playbook deploy.yml --tags backup

# Multiple tags
ansible-playbook deploy.yml --tags application,pm2
```

---

## Environment Variables Reference

### Required
```bash
# AI Provider
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-proj-...

# Bot Tokens (at least one required)
TELEGRAM_BOT_TOKEN=...
DISCORD_BOT_TOKEN=...

# Security
ARDEN_API_TOKEN=...
```

### Optional
```bash
# Voice Services
ELEVENLABS_API_KEY=...

# Alternative AI Providers
OLLAMA_MODEL=llama3.2
OLLAMA_URL=http://localhost:11434
ANTHROPIC_API_KEY=...
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Invalid token" error | Check .env token, restart with `--update-env` |
| Bot offline | Check PM2 status, verify token, check intents |
| Web 502 error | Check PM2 status, ensure port 3001 running |
| SSL certificate expired | Run `sudo certbot renew` |
| High memory | Use session management to kill idle sessions |
| Database locked | Restart PM2, check for zombie processes |
| Nginx not starting | Check config with `sudo nginx -t` |
| Git pull fails | Check SSH keys, use HTTPS instead |

---

## Security Checklist

- [ ] Change default ARDEN_API_TOKEN
- [ ] Rotate bot tokens periodically
- [ ] Keep OpenAI API key secret
- [ ] Enable UFW firewall (ports 22, 80, 443 only)
- [ ] Regular system updates (`sudo apt update && sudo apt upgrade`)
- [ ] Monitor PM2 logs for suspicious activity
- [ ] Backup .env file securely
- [ ] Use Discord allowed_users if needed
- [ ] SSL certificates auto-renew

---

## Quick Status Check

```bash
#!/bin/bash
# Save as: ~/check-arden.sh

echo "=== ARDEN Status Check ==="
echo ""

echo "PM2 Processes:"
source ~/.nvm/nvm.sh
pm2 status

echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager | head -5

echo ""
echo "SSL Certificates:"
sudo certbot certificates 2>/dev/null | grep -A 2 "rocket.id10t.social"

echo ""
echo "Disk Usage:"
df -h | grep -E '(Filesystem|/$)'

echo ""
echo "Memory Usage:"
free -h

echo ""
echo "Latest Logs (last 5 lines):"
pm2 logs --lines 5 --nostream
```

Run: `bash ~/check-arden.sh`

---

## Support Contacts

- **VPS Provider:** [Your VPS provider]
- **Domain Registrar:** [Your domain registrar]
- **Repository:** https://github.com/infurno/ARDEN
- **Admin:** hal@borlandtech.com

---

**Last Updated:** January 7, 2026
