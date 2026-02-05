#!/bin/bash

echo "=== Discord Bot Setup Script ==="
echo ""

# Check if token already exists
if [ -n "$DISCORD_BOT_TOKEN" ]; then
    echo "✅ Discord bot token is already set"
    echo ""
    echo "Current token starts with: ${DISCORD_BOT_TOKEN:0:10}..."
else
    echo "❌ Discord bot token not found"
    echo ""
    echo "Please get your token from: https://discord.com/developers/applications"
    echo ""
    echo "Then run this command:"
    echo 'echo "DISCORD_BOT_TOKEN=your_token_here" >> ~/.env'
    echo ""
fi

echo ""
echo "=== Next Steps ==="
echo "1. Get Discord bot token from https://discord.com/developers/applications"
echo "2. Run: echo 'DISCORD_BOT_TOKEN=your_token' >> ~/.env"
echo "3. Find your Discord User ID:"
echo "   - Go to Discord settings"
echo "   - Enable Developer Mode" 
echo "   - Right-click your profile and 'Copy User ID'"
echo "4. Edit config/arden.json to enable Discord and add your user ID"
echo "5. Run: cd api && node discord-bot.js"
echo ""