# Hetzner VPS Deployment Checklist

Use this checklist when deploying ARDEN to your Hetzner VPS.

## Pre-Deployment

### 1. Hetzner Setup
- [ ] VPS provisioned (recommended: CPX41 - 8 vCPU, 16 GB RAM)
- [ ] Ubuntu 22.04 LTS installed
- [ ] SSH key added to server
- [ ] Can access via SSH: `ssh root@YOUR_SERVER_IP`

### 2. Telegram Setup
- [ ] Created bot with @BotFather
- [ ] Got bot token: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
- [ ] Got your Telegram user ID from @userinfobot
- [ ] Tested bot responds to /start

### 3. Local Preparation
- [ ] Repository cloned locally
- [ ] All changes committed to git
- [ ] Ready to push to remote (if using git deployment)

## Server Initial Setup

### 4. System Preparation
- [ ] Updated system: `apt update && apt upgrade -y`
- [ ] Created non-root user: `adduser arden`
- [ ] Gave sudo access: `usermod -aG sudo arden`
- [ ] Switched to user: `su - arden`

### 5. Install Dependencies
- [ ] Node.js 18+ installed
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt install -y nodejs
  ```
- [ ] Python 3.11+ installed
  ```bash
  sudo apt install -y python3 python3-pip python3-venv
  ```
- [ ] Build tools installed
  ```bash
  sudo apt install -y build-essential git curl
  ```

### 6. Ollama Setup (for local AI)
- [ ] Ollama installed: `curl -fsSL https://ollama.com/install.sh | sh`
- [ ] Model downloaded: `ollama pull llama3.2`
- [ ] Service running: `systemctl status ollama`

## ARDEN Deployment

### 7. Clone and Setup
- [ ] Repository cloned: `git clone https://github.com/YOUR_USERNAME/ARDEN.git`
- [ ] Changed to directory: `cd ARDEN`
- [ ] Checked out remote-server branch: `git checkout remote-server`

### 8. Automated Deployment
- [ ] Made script executable: `chmod +x scripts/deploy-vps.sh`
- [ ] Ran deployment: `./scripts/deploy-vps.sh`
- [ ] Script completed without errors

### 9. Configuration
- [ ] `.env` file created and configured with:
  - [ ] `TELEGRAM_BOT_TOKEN`
  - [ ] `AI_PROVIDER=ollama`
  - [ ] `OLLAMA_MODEL=llama3.2`
  - [ ] Any other required variables
- [ ] `config/arden.json` updated with your Telegram user ID

### 10. Start Service
Choose one:

**Option A: PM2 (Recommended)**
- [ ] Bot started: `pm2 start ecosystem.config.js`
- [ ] Auto-start configured: `pm2 startup && pm2 save`
- [ ] Status checked: `pm2 status`

**Option B: systemd**
- [ ] Service installed: `sudo ./scripts/install-systemd-service.sh`
- [ ] Status checked: `sudo systemctl status arden-bot`

## Security Configuration

### 11. Firewall
- [ ] UFW enabled: `sudo ufw enable`
- [ ] SSH allowed: `sudo ufw allow OpenSSH`
- [ ] Status checked: `sudo ufw status`

### 12. Fail2Ban (Optional but Recommended)
- [ ] Installed: `sudo apt install -y fail2ban`
- [ ] Enabled: `sudo systemctl enable fail2ban`
- [ ] Started: `sudo systemctl start fail2ban`

### 13. Access Control
- [ ] Telegram user ID added to `config/arden.json`
- [ ] Other users blocked by default
- [ ] `.env` file secured (permissions 600)

## Testing

### 14. Functionality Tests
- [ ] Bot responds in Telegram
- [ ] Can send text messages
- [ ] Can send voice messages
- [ ] Voice is transcribed correctly
- [ ] AI responds correctly
- [ ] Voice response is generated

### 15. Log Verification
- [ ] Logs accessible: `pm2 logs arden-bot` or `sudo journalctl -u arden-bot`
- [ ] No error messages in logs
- [ ] Normal operation confirmed

### 16. Performance Check
- [ ] Response time acceptable (1-4s with GPU, 15-40s CPU-only)
- [ ] Memory usage normal: `free -h`
- [ ] CPU usage reasonable: `htop`
- [ ] If GPU: Check usage with `nvidia-smi`

## Post-Deployment

### 17. Backup Setup
- [ ] Tested backup script: `./scripts/backup.sh`
- [ ] Backup created successfully
- [ ] Backup downloaded to local machine (optional)
- [ ] Cron job for automatic backups (optional):
  ```bash
  crontab -e
  # Add: 0 2 * * * /home/arden/ARDEN/scripts/backup.sh
  ```

### 18. Monitoring
- [ ] Can check status easily
- [ ] Know how to view logs
- [ ] Know how to restart service
- [ ] Set up monitoring alerts (optional)

### 19. Documentation
- [ ] Saved server IP address
- [ ] Documented any custom configuration
- [ ] Updated repository with deployment notes
- [ ] Shared access with team (if applicable)

## Optional Enhancements

### 20. GPU Acceleration (if available)
- [ ] NVIDIA drivers installed
- [ ] CUDA toolkit installed
- [ ] GPU detected: `nvidia-smi`
- [ ] PyTorch GPU version installed
- [ ] Ollama using GPU (check with `nvidia-smi` during inference)

### 21. Domain and HTTPS (if exposing API)
- [ ] Domain pointed to server IP
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] HTTPS working

### 22. Advanced Monitoring
- [ ] Prometheus + Grafana setup (optional)
- [ ] Uptime monitoring (optional)
- [ ] Log aggregation (optional)

## Maintenance Schedule

### Daily
- [ ] Check bot is responding
- [ ] Quick log review for errors

### Weekly
- [ ] Review system resources
- [ ] Check disk space
- [ ] Review backup status

### Monthly
- [ ] Update system packages
- [ ] Update ARDEN: `git pull && ./scripts/deploy-vps.sh`
- [ ] Review and rotate logs
- [ ] Test restore from backup

## Emergency Contacts

- Hetzner Support: https://docs.hetzner.com/
- ARDEN Docs: `docs/HETZNER_DEPLOYMENT.md`
- Your backup location: _________________

## Notes

Date deployed: _________________
Server IP: _________________
Server hostname: _________________
Bot username: _________________

Additional notes:
_________________________________
_________________________________
_________________________________

---

**Deployment Status:** ☐ Not Started  ☐ In Progress  ☐ Complete  ☐ Verified

**Last Updated:** _________________
