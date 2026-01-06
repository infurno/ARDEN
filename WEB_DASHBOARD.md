# ARDEN Web Dashboard Setup

ARDEN now includes a web dashboard alongside the Telegram bot!

## What's Included

**Two Services:**
1. **Telegram Bot** - Voice and text interaction via Telegram
2. **Web Dashboard** - Browser-based monitoring and statistics

**Web Dashboard Features:**
- Real-time bot status monitoring
- Usage statistics (total messages, sessions)
- Recent conversation history
- Configuration overview
- Auto-refreshes every 30 seconds

## Quick Start

### On Your Server (rocket.id10t.social)

```bash
cd ~/ARDEN/api

# Install dependencies (includes express for web server)
npm install

# Start both services with PM2
cd ~/ARDEN
pm2 delete all  # Clear any old instances
pm2 start ecosystem.config.js
pm2 save
pm2 logs
```

This starts:
- `arden-bot` - Telegram bot (port internal)
- `arden-web` - Web dashboard (port 3000)

## Accessing the Dashboard

### Option 1: Direct Access (Quick Test)

```bash
# Allow port 3000 through firewall
sudo ufw allow 3000
```

Visit: **http://rocket.id10t.social:3000**

### Option 2: NGINX Reverse Proxy (Recommended)

Set up nginx to serve on standard HTTP/HTTPS ports:

```bash
# Install nginx
sudo apt install -y nginx

# Copy and enable config
sudo cp ~/ARDEN/scripts/nginx-arden.conf /etc/nginx/sites-available/arden
sudo ln -s /etc/nginx/sites-available/arden /etc/nginx/sites-enabled/

# For HTTP-only (quick start):
# Edit the config to use HTTP-only server block
sudo nano /etc/nginx/sites-available/arden

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
sudo ufw allow 'Nginx HTTP'
```

Visit: **http://rocket.id10t.social**

### Option 3: HTTPS with Let's Encrypt (Production)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d rocket.id10t.social
sudo ufw allow 'Nginx Full'
```

Visit: **https://rocket.id10t.social**

## PM2 Management Commands

```bash
# View status of both services
pm2 status

# View logs
pm2 logs                # All services
pm2 logs arden-bot      # Bot only
pm2 logs arden-web      # Web only

# Restart services
pm2 restart all
pm2 restart arden-bot
pm2 restart arden-web

# Stop services
pm2 stop all
pm2 stop arden-bot
pm2 stop arden-web
```

## Web Dashboard API Endpoints

The web server provides these API endpoints:

- `GET /` - Dashboard HTML interface
- `GET /api/health` - Health check
- `GET /api/status` - Bot and server status
- `GET /api/stats` - Usage statistics
- `GET /api/config` - Current configuration (safe, no API keys)
- `GET /api/sessions/recent` - Recent conversation sessions

## Configuration

### Port Configuration

Edit `.env` to change web server port:

```bash
WEB_PORT=3000        # Default port
WEB_HOST=0.0.0.0     # Listen on all interfaces
```

### Security

**Without NGINX:**
- Web server accessible on port 3000
- No authentication (use firewall or VPN)

**With NGINX:**
- Can add HTTP basic auth
- SSL/TLS encryption with Let's Encrypt
- Standard ports 80/443

## Troubleshooting

**Web dashboard not accessible:**
```bash
# Check if web server is running
pm2 status
pm2 logs arden-web

# Check if port 3000 is listening
sudo netstat -tlnp | grep 3000

# Check firewall
sudo ufw status
```

**Dashboard shows errors:**
```bash
# Check bot is running
pm2 logs arden-bot

# Verify .env configuration
cat ~/.env | grep -v API_KEY
```

**NGINX errors:**
```bash
# Check NGINX config
sudo nginx -t

# Check NGINX logs
sudo tail -f /var/log/nginx/error.log

# Verify port 3000 is not firewalled internally
curl http://localhost:3000/api/health
```

## Architecture

```
┌─────────────────────────────────────────┐
│  User's Browser                         │
│  → http://rocket.id10t.social           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  NGINX (Optional)                       │
│  Port 80/443 → Port 3000                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  ARDEN Web Server (PM2)                 │
│  - Express.js on port 3000              │
│  - Serves dashboard HTML/API            │
│  - Reads session files                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ARDEN Telegram Bot (PM2)               │
│  - Connects to Telegram API             │
│  - Processes voice/text messages        │
│  - Calls OpenAI APIs                    │
│  - Saves to session files               │
└─────────────────────────────────────────┘
```

Both services run independently via PM2 and auto-restart on failure.

## Next Steps

1. Start services: `pm2 start ecosystem.config.js`
2. Test web dashboard access
3. Set up NGINX for production (optional)
4. Configure SSL with Let's Encrypt (optional)
5. Test Telegram bot functionality

Full NGINX setup: See `docs/NGINX_SETUP.md`
