# NGINX Setup Instructions for ARDEN Web Dashboard
# Server: rocket.id10t.social

## Installation Steps

### 1. Install NGINX

```bash
sudo apt update
sudo apt install -y nginx
```

### 2. Copy Configuration

```bash
sudo cp ~/ARDEN/scripts/nginx-arden.conf /etc/nginx/sites-available/arden
sudo ln -s /etc/nginx/sites-available/arden /etc/nginx/sites-enabled/
```

### 3. Test Configuration

```bash
sudo nginx -t
```

### 4. Option A: HTTP Only (Quick Start)

Edit the config file to use HTTP only:

```bash
sudo nano /etc/nginx/sites-available/arden
```

Uncomment the HTTP-only server block at the bottom and comment out the HTTPS sections.

Then:

```bash
sudo systemctl reload nginx
sudo ufw allow 'Nginx HTTP'
```

Access at: http://rocket.id10t.social

### 4. Option B: HTTPS with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d rocket.id10t.social

# Allow HTTPS through firewall
sudo ufw allow 'Nginx Full'
```

Access at: https://rocket.id10t.social

### 5. Start/Reload NGINX

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl reload nginx
```

## Verify

1. Check NGINX is running: `sudo systemctl status nginx`
2. Visit http://rocket.id10t.social or https://rocket.id10t.social
3. You should see the ARDEN dashboard

## Troubleshooting

**NGINX won't start:**
```bash
sudo nginx -t  # Check for config errors
sudo tail -f /var/log/nginx/error.log
```

**Can't access from browser:**
```bash
# Check firewall
sudo ufw status

# Check NGINX is listening
sudo netstat -tlnp | grep nginx

# Check PM2 web server is running
pm2 status
```

**Port 3000 access from NGINX:**
Make sure arden-web is running:
```bash
pm2 list
pm2 logs arden-web
```

## Without NGINX (Direct Access for Testing)

If you want to test without nginx first:

```bash
# Allow port 3000 in firewall
sudo ufw allow 3000

# Access directly
http://rocket.id10t.social:3000
```

Then visit: http://rocket.id10t.social:3000

Note: This is not recommended for production - use NGINX instead.
