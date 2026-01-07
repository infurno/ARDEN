# ARDEN Discord Bot Setup Guide

This guide will walk you through setting up the ARDEN Discord bot from scratch.

## Prerequisites

- A Discord account
- Access to your ARDEN VPS or local installation
- 5-10 minutes

## Part 1: Create Discord Application

### Step 1: Create Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** (top right)
3. Name it **"ARDEN"** (or whatever you prefer)
4. Click **"Create"**

### Step 2: Create Bot User

1. In the left sidebar, click **"Bot"**
2. Click **"Add Bot"**
3. Click **"Yes, do it!"** to confirm
4. Under "Privileged Gateway Intents", enable:
   - ✅ **MESSAGE CONTENT INTENT** (required!)
   - ✅ **SERVER MEMBERS INTENT** (optional)
   - ✅ **PRESENCE INTENT** (optional)

### Step 3: Get Bot Token

1. Under the bot's username, click **"Reset Token"**
2. Click **"Yes, do it!"**
3. **Copy the token** - you'll need this for your `.env` file
4. ⚠️ **Never share this token publicly!**

### Step 4: Configure Bot Settings

1. Scroll down to "Public Bot"
   - **Disable** if you want it private (recommended)
2. Scroll to "Requires OAuth2 Code Grant"
   - Leave **disabled**

## Part 2: Invite Bot to Your Server

### Step 1: Get Your Application ID

1. In the left sidebar, click **"General Information"**
2. Copy the **APPLICATION ID**

### Step 2: Generate Invite Link

Use this URL template (replace `YOUR_CLIENT_ID`):

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2147485696&scope=bot
```

**Permissions included:**
- Read Messages/View Channels
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Add Reactions

### Step 3: Invite Bot

1. Paste the customized URL in your browser
2. Select the server you want to add the bot to
3. Click **"Authorize"**
4. Complete the CAPTCHA

## Part 3: Configure ARDEN

### Local Installation

Edit your `.env` file:

```bash
cd /Users/hal/ARDEN
nano .env
```

Add/update:

```bash
# Discord Bot Token
DISCORD_BOT_TOKEN=your-token-here
```

### VPS Installation (rocket.id10t.social)

SSH into your VPS:

```bash
ssh arden@rocket.id10t.social
```

Edit the `.env` file:

```bash
cd ~/ARDEN
nano .env
```

Add/update:

```bash
# Discord Bot Token
DISCORD_BOT_TOKEN=your-token-here
```

Save and exit (Ctrl+X, Y, Enter)

## Part 4: Deploy

### Local Testing

```bash
cd /Users/hal/ARDEN/api
node discord-bot.js
```

You should see:
```
🤖 ARDEN Discord Bot started
📁 Working directory: /Users/hal/ARDEN
👤 Logged in as: ARDEN#1234
🌐 Servers: 1
AI Provider: openai
OpenAI model: gpt-4o-mini
```

### Production Deployment (VPS)

From your local machine:

```bash
cd /Users/hal/ARDEN/ansible
ansible-playbook deploy.yml
```

Or manually on VPS:

```bash
ssh arden@rocket.id10t.social
cd ~/ARDEN
git pull origin arden-prod
npm install
source ~/.nvm/nvm.sh
pm2 restart arden-discord
pm2 save
```

## Part 5: Test the Bot

### Send a DM (Direct Message)

1. Go to Discord
2. Find ARDEN in your server member list
3. Right-click → **Message**
4. Send: `Hello ARDEN!`

The bot should respond!

### Use in Server Channels

The bot only responds when mentioned:

```
@ARDEN what's the weather like?
```

### Try Commands

```
!help      - Show help
!status    - Bot status
!ping      - Check latency
!clear     - Clear conversation history
```

## Part 6: Security & Authorization

### Restrict to Specific Users (Optional)

Edit `config/arden.json`:

```json
{
  "discord": {
    "enabled": true,
    "bot_token_env": "DISCORD_BOT_TOKEN",
    "allowed_users": [
      "123456789012345678",  // Your Discord User ID
      "987654321098765432"   // Another user's ID
    ]
  }
}
```

**How to get Discord User ID:**
1. Enable Developer Mode: Settings → Advanced → Developer Mode
2. Right-click your username → Copy ID

### PM2 Management

```bash
# Check status
pm2 status

# View logs
pm2 logs arden-discord

# Restart
pm2 restart arden-discord

# Stop
pm2 stop arden-discord
```

## Troubleshooting

### Bot appears offline

1. Check if the process is running:
   ```bash
   pm2 status
   ```

2. Check logs for errors:
   ```bash
   pm2 logs arden-discord --lines 50
   ```

3. Verify token is correct:
   ```bash
   grep DISCORD_BOT_TOKEN ~/ARDEN/.env
   ```

### Bot doesn't respond

1. **Check MESSAGE CONTENT INTENT is enabled** (most common issue!)
2. Make sure you're:
   - In a DM with the bot, OR
   - Mentioning the bot with `@ARDEN` in a server
3. Check authorization in `config/arden.json`

### "Missing Access" error

The bot needs these permissions:
- Read Messages
- Send Messages
- View Channels

Re-invite the bot with the proper permissions URL.

### Rate limit errors

Default: 10 messages per minute per user

Edit `api/discord-bot.js` to adjust:
```javascript
const RATE_LIMIT_MAX_REQUESTS = 20;  // Increase to 20
```

## Advanced Configuration

### Custom Status

Edit `api/discord-bot.js`:

```javascript
client.user.setPresence({
  activities: [{ name: 'your custom status', type: 3 }],
  status: 'online',
});
```

Activity types:
- 0 = Playing
- 1 = Streaming
- 2 = Listening
- 3 = Watching

### Voice Support (Future)

Voice channels will be supported in a future update. Currently only text is supported.

## Comparison: Discord vs Telegram

| Feature | Discord | Telegram |
|---------|---------|----------|
| Spam Control | ✅ Excellent | ⚠️ Moderate |
| Setup Complexity | Medium | Easy |
| Server Control | ✅ Full control | ❌ Limited |
| Voice Support | 🔜 Coming soon | ✅ Yes |
| File Size Limit | 25MB (100MB Nitro) | 2GB |
| Message History | Unlimited | Unlimited |
| Mobile Apps | Excellent | Excellent |

## Next Steps

1. ✅ Set up Discord bot
2. Consider disabling Telegram if you prefer Discord
3. Configure allowed_users for security
4. Set up slash commands (coming soon)
5. Enable voice support when available

## Support

- Check logs: `pm2 logs arden-discord`
- Test locally before deploying
- Verify MESSAGE CONTENT INTENT is enabled

---

**Quick Reference:**

```bash
# Start bot
pm2 start api/discord-bot.js --name arden-discord

# Check status
pm2 status

# View logs
pm2 logs arden-discord

# Restart after config changes
pm2 restart arden-discord --update-env
```
