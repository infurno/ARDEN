# ARDEN Ansible Deployment

Automated deployment of ARDEN to Ubuntu 24.04 VPS using Ansible.

## Prerequisites

### Local Machine
1. **Ansible installed** (version 2.9 or higher)
   ```bash
   # macOS
   brew install ansible
   
   # Ubuntu/Debian
   sudo apt update && sudo apt install ansible
   
   # Python pip
   pip3 install ansible
   ```

2. **SSH access to VPS** (password or key-based)

3. **.env file** in project root with your API keys

### VPS Requirements
- Ubuntu 24.04 LTS
- User account with sudo privileges (e.g., `arden`)
- SSH access enabled
- Ports 22, 80, 443 accessible

## Quick Start

### 1. Install Ansible Dependencies

```bash
cd ansible
ansible-galaxy install -r requirements.yml
```

### 2. Update Inventory (if needed)

Edit `inventory.yml` if you need to change:
- Domain name (default: rocket.id10t.social)
- SSL email (default: hal@borlandtech.com)
- VPS user (default: arden)
- Other configuration variables

### 3. Run Deployment

```bash
cd ansible
ansible-playbook deploy.yml
```

You will be prompted for:
- **SSH password** (if not using SSH keys)
- **Sudo password** (for privilege escalation on VPS)

### 4. Wait for Completion

The deployment takes approximately **12-16 minutes** and will:
1. ✅ Install system dependencies (build tools, Python, FFmpeg, etc.)
2. ✅ Install Node.js 20 LTS via NVM
3. ✅ Install PM2 globally
4. ✅ Clone/update repository from GitHub
5. ✅ Transfer .env file securely
6. ✅ Install npm dependencies (including better-sqlite3)
7. ✅ Configure Nginx with SSL (Let's Encrypt)
8. ✅ Configure UFW firewall
9. ✅ Start PM2 services (arden-bot, arden-web)
10. ✅ Setup automated daily backups

## Deployment Modes

### Full Deployment (All Roles)
```bash
ansible-playbook deploy.yml
```

### Partial Deployment (Specific Roles)

Update application code only:
```bash
ansible-playbook deploy.yml --tags application,pm2
```

Update Nginx configuration only:
```bash
ansible-playbook deploy.yml --tags nginx
```

Update system packages only:
```bash
ansible-playbook deploy.yml --tags system
```

Reinstall Node.js:
```bash
ansible-playbook deploy.yml --tags nodejs
```

## Configuration

### Inventory Variables

Edit `inventory.yml` to customize:

```yaml
vars:
  # Application settings
  app_name: arden
  app_user: arden
  app_dir: /home/arden/ARDEN
  deploy_branch: arden-prod
  
  # GitHub repository
  git_repo: git@github.com:infurno/ARDEN.git
  
  # Domain and SSL
  domain_name: rocket.id10t.social
  ssl_email: hal@borlandtech.com
  
  # Node.js version
  nodejs_version: "20"
  
  # PM2 apps
  pm2_apps:
    - name: arden-bot
      script: api/telegram.js
    - name: arden-web
      script: api/server.js
```

## Roles

### 1. System Role
- Installs system packages (build-essential, Python 3, FFmpeg, etc.)
- Configures UFW firewall (ports 22, 80, 443)
- Creates application directories

**Location**: `roles/system/`

### 2. Node.js Role
- Installs NVM (Node Version Manager)
- Installs Node.js 20 LTS
- Installs PM2 globally
- Sets up PM2 startup script

**Location**: `roles/nodejs/`

### 3. Application Role
- Clones/updates Git repository
- Transfers .env file securely (chmod 600)
- Runs npm install (builds better-sqlite3)
- Creates required directories (data, uploads)

**Location**: `roles/application/`

### 4. Nginx Role
- Obtains SSL certificate from Let's Encrypt
- Configures Nginx reverse proxy
- Sets up automatic SSL renewal (cron)
- Configures security headers

**Location**: `roles/nginx/`

### 5. PM2 Role
- Stops old PM2 processes
- Starts PM2 applications (bot + web)
- Saves PM2 process list
- Verifies applications are responding

**Location**: `roles/pm2/`

### 6. Backup Role
- Creates backup directory
- Installs backup script
- Configures daily backups (2 AM)
- Sets 7-day retention policy

**Location**: `roles/backup/`

## Post-Deployment

### Verify Deployment

```bash
# Check PM2 status
ssh arden@rocket.id10t.social 'source ~/.nvm/nvm.sh && pm2 status'

# View PM2 logs
ssh arden@rocket.id10t.social 'source ~/.nvm/nvm.sh && pm2 logs'

# Check Nginx status
ssh arden@rocket.id10t.social 'sudo systemctl status nginx'

# Check firewall
ssh arden@rocket.id10t.social 'sudo ufw status'
```

### Test Application

1. **Web Interface**: https://rocket.id10t.social
2. **Telegram Bot**: Send `/start` to your bot

### Configure Telegram User Restrictions (Optional)

```bash
ssh arden@rocket.id10t.social
nano ~/ARDEN/config/arden.production.json
# Add allowed Telegram user IDs
source ~/.nvm/nvm.sh && pm2 restart arden-bot
```

## Backups

### Automatic Backups
- **Schedule**: Daily at 2:00 AM
- **Retention**: 7 days
- **Location**: `/home/arden/backups/`
- **Contents**: .env, SQLite databases, PM2 config

### Manual Backup
```bash
ssh arden@rocket.id10t.social '/home/arden/backup.sh'
```

### Restore from Backup
```bash
ssh arden@rocket.id10t.social
cd /home/arden/backups
tar -xzf arden_backup_YYYYMMDD_HHMMSS.tar.gz -C /home/arden/
source ~/.nvm/nvm.sh && pm2 restart all
```

## Troubleshooting

### Ansible Connection Issues

**Problem**: SSH connection fails
```bash
# Test SSH connectivity
ssh arden@rocket.id10t.social

# Use verbose mode
ansible-playbook deploy.yml -vvv
```

**Problem**: Sudo password incorrect
```bash
# Test sudo access
ssh arden@rocket.id10t.social 'sudo -v'
```

### Deployment Failures

**Problem**: Git clone fails
- Ensure GitHub SSH keys are set up on VPS
- Or use HTTPS: Change `git_repo` in `inventory.yml` to HTTPS URL

**Problem**: npm install fails
- Check Node.js version: `ssh arden@rocket.id10t.social 'source ~/.nvm/nvm.sh && node --version'`
- Should be v20.x.x

**Problem**: SSL certificate fails
- Ensure port 80 is accessible (needed for Let's Encrypt verification)
- Check DNS: `dig rocket.id10t.social`

### Application Issues

**Problem**: PM2 processes not running
```bash
ssh arden@rocket.id10t.social
source ~/.nvm/nvm.sh
pm2 logs
```

**Problem**: Web interface not accessible
```bash
# Check if app is listening on port 3000
ssh arden@rocket.id10t.social 'ss -tlnp | grep 3000'

# Check Nginx error logs
ssh arden@rocket.id10t.social 'sudo tail -f /var/log/nginx/rocket.id10t.social.error.log'
```

## Re-running Deployment

Ansible is **idempotent** - you can safely re-run the playbook multiple times:

```bash
# Full re-deployment
ansible-playbook deploy.yml

# Update code only (faster)
ansible-playbook deploy.yml --tags application,pm2
```

## SSH Key Setup (Optional)

For passwordless deployment:

```bash
# Generate SSH key (if needed)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy to VPS
ssh-copy-id arden@rocket.id10t.social

# Test
ssh arden@rocket.id10t.social
```

Then remove `become_ask_pass: True` from `ansible.cfg`.

## Monitoring

### PM2 Monitoring
```bash
ssh arden@rocket.id10t.social 'source ~/.nvm/nvm.sh && pm2 monit'
```

### System Resources
```bash
ssh arden@rocket.id10t.social 'htop'
```

### Logs
```bash
# PM2 logs
ssh arden@rocket.id10t.social 'source ~/.nvm/nvm.sh && pm2 logs --lines 100'

# Nginx access logs
ssh arden@rocket.id10t.social 'sudo tail -f /var/log/nginx/rocket.id10t.social.access.log'

# Backup logs
ssh arden@rocket.id10t.social 'tail -f /home/arden/backups/backup.log'
```

## Updating ARDEN

When you push new code to GitHub:

```bash
cd ansible
ansible-playbook deploy.yml --tags application,pm2
```

This will:
1. Pull latest code from GitHub
2. Update .env if changed
3. Run npm install (if package.json changed)
4. Restart PM2 processes

## Uninstall

To completely remove ARDEN:

```bash
ssh arden@rocket.id10t.social
source ~/.nvm/nvm.sh
pm2 delete all
pm2 save
sudo systemctl stop nginx
sudo systemctl disable nginx
sudo rm /etc/nginx/sites-enabled/rocket.id10t.social
sudo rm /etc/nginx/sites-available/rocket.id10t.social
rm -rf ~/ARDEN
rm -rf ~/backups
```

## Support

For issues or questions:
- Check `docs/UBUNTU_24_04_NOTES.md`
- Check `DEPLOYMENT_ROCKET.md`
- Review Ansible logs (use `-vvv` flag for verbose output)

## License

Same as ARDEN project license.
