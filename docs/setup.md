# ARDEN Setup Guide

Complete setup instructions for your AI Routine Daily Engagement Nexus.

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org)
- **Claude Code CLI** - [Installation guide](https://github.com/anthropics/claude-code)
- **OpenAI API Key** - For Whisper speech-to-text
- **ElevenLabs API Key** (optional) - For high-quality text-to-speech
- **Telegram Account** (recommended) - For voice messaging on any device

## Installation

### 1. Run the Installation Script

```bash
cd ~/ARDEN
./scripts/install.sh
```

This will:
- Verify prerequisites
- Create directory structure
- Install Node.js dependencies
- Set up executable scripts
- Create `.env` template
- Configure ARDEN CLI

### 2. Configure Environment Variables

Edit `~/ARDEN/.env`:

```bash
nano ~/ARDEN/.env
```

**Required:**
```bash
OPENAI_API_KEY=sk-...your_key_here
```

**Optional (but recommended for voice):**
```bash
ELEVENLABS_API_KEY=...your_key_here
TELEGRAM_BOT_TOKEN=...your_bot_token
```

### 3. Add ARDEN to PATH

Add to your shell configuration (`~/.zshrc` or `~/.bashrc`):

```bash
export PATH="$HOME/ARDEN/bin:$PATH"
```

Then reload:
```bash
source ~/.zshrc  # or ~/.bashrc
```

## Voice Setup Options

### Option 1: Telegram Bot (Recommended)

**Best for:** Voice on phone, iPad, tablet, desktop

**Setup:**

1. **Create a Telegram Bot**
   - Open Telegram and message [@BotFather](https://t.me/botfather)
   - Send `/newbot`
   - Follow prompts to name your bot
   - Copy the bot token

2. **Configure ARDEN**
   ```bash
   nano ~/ARDEN/.env
   ```

   Add:
   ```bash
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

3. **Update Config**
   ```bash
   nano ~/ARDEN/config/arden.json
   ```

   Set:
   ```json
   "telegram": {
     "enabled": true,
     "bot_token_env": "TELEGRAM_BOT_TOKEN",
     "allowed_users": [123456789]  // Your Telegram user ID
   }
   ```

4. **Start the Bot**
   ```bash
   cd ~/ARDEN/api
   npm start
   ```

5. **Use It**
   - Open Telegram
   - Search for your bot
   - Send `/start`
   - Send voice messages or text!

**Keeping it Running:**

Use `pm2` to run the bot 24/7:

```bash
npm install -g pm2
cd ~/ARDEN/api
pm2 start telegram-bot.js --name arden-bot
pm2 save
pm2 startup  # Follow instructions
```

### Option 2: iOS Shortcuts

**Best for:** Siri integration, Apple ecosystem

1. Create a new Shortcut
2. Add "Dictate Text" action
3. Add "Get Contents of URL" action
   - URL: `http://your-server:3000/voice`
   - Method: POST
   - Headers: `Authorization: Bearer YOUR_TOKEN`
   - Body: Dictation result
4. Add "Speak Text" action with the response
5. Trigger with "Hey Siri, ask ARDEN..."

### Option 3: REST API + PWA

**Best for:** Custom web interface, browser-based access

Coming soon - see `api/voice-server.js` for implementation.

## Getting Your Telegram User ID

1. Message [@userinfobot](https://t.me/userinfobot) on Telegram
2. Copy your User ID
3. Add to `allowed_users` in `config/arden.json`

## Testing Your Setup

### Test 1: CLI
```bash
arden "Hello, are you working?"
```

### Test 2: Telegram Bot
1. Send text message to your bot
2. Should respond within a few seconds

### Test 3: Voice Message
1. Record voice message in Telegram
2. Bot should transcribe and respond

## Troubleshooting

### "Command not found: arden"

Make sure ARDEN is in your PATH:
```bash
echo $PATH | grep ARDEN
```

If not there, add to your shell config and reload.

### "OPENAI_API_KEY not set"

Check your `.env` file:
```bash
cat ~/ARDEN/.env | grep OPENAI
```

Make sure the bot is loading it:
```bash
cd ~/ARDEN/api
node -e "require('dotenv').config({path:'../.env'}); console.log(process.env.OPENAI_API_KEY)"
```

### Telegram bot not responding

1. Check bot is running:
   ```bash
   pm2 list
   # or
   ps aux | grep telegram-bot
   ```

2. Check logs:
   ```bash
   pm2 logs arden-bot
   ```

3. Verify bot token:
   ```bash
   curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe"
   ```

### Voice transcription failing

1. Verify OpenAI API key is valid
2. Check voice file format is supported
3. Review logs for specific errors

### No voice responses

1. Check if `ELEVENLABS_API_KEY` is set
2. Verify API key is valid
3. Bot will still respond with text if TTS fails

## Next Steps

1. [Create your first skill](skills.md)
2. [Configure agents](agents.md)
3. [Set up automated routines](routines.md)
4. [Customize voice settings](voice.md)

## Security Notes

- Never commit `.env` to version control
- Restrict Telegram bot to your user ID only
- Use strong API tokens
- Review `history/security/` logs regularly
- Keep API keys rotated

## Getting Help

- Check [API logs](../history/sessions/)
- Review [security logs](../history/security/)
- Read [troubleshooting guide](troubleshooting.md)
