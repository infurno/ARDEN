# Discord Bot Setup Guide

## 1. Create Discord Application
1. Go to: https://discord.com/developers/applications
2. Click "New Application" 
3. Give it a name (e.g., "ARDEN Bot")
4. Click "Create"

## 2. Create Bot
1. Go to "Bot" tab
2. Click "Add Bot"
3. Enable these Intents:
   - ✅ MESSAGE CONTENT INTENT
   - ✅ SERVER MEMBERS INTENT  
   - ✅ GUILD MESSAGES INTENT
4. Under "Privileged Gateway Intents", enable:
   - ✅ MESSAGE CONTENT INTENT

## 3. Get Token
1. Click "Reset Token" (if exists) or "View Token"
2. Copy the token (it looks like: `MTI5NjE5...`)

## 4. Invite Bot to Server
1. Go to "OAuth2" -> "URL Generator"
2. Select these scopes:
   - ✅ bot
3. Select these bot permissions:
   - ✅ Send Messages
   - ✅ Read Message History
   - ✅ Use External Emojis
   - ✅ Embed Links
   - ✅ Attach Files
4. Copy the generated URL and paste in your browser
5. Select your server and authorize

## 5. Configure ARDEN
1. Add token to .env file:
   ```bash
   echo "DISCORD_BOT_TOKEN=your_token_here" >> /home/hal/ARDEN/.env
   ```

2. Enable Discord in config:
   Edit /home/hal/ARDEN/config/arden.json:
   ```json
   "discord": {
     "enabled": true,
     "bot_token_env": "DISCORD_BOT_TOKEN",
     "allowed_users": ["your_discord_user_id"]
   }
   ```

3. Find your Discord User ID:
   - Go to Discord, right-click your profile
   - Select "Copy User ID"

## 6. Start Bot
```bash
cd /home/hal/ARDEN/api
node discord-bot.js
```