#!/bin/bash

# ARDEN Free TTS Setup Script
# Helps you choose and install a free TTS alternative to ElevenLabs

set -e

ARDEN_HOME="$HOME/ARDEN"
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BOLD}🎙️  ARDEN Free TTS Setup${NC}\n"

echo "Choose a FREE text-to-speech provider:"
echo ""
echo -e "${BLUE}1. Edge TTS${NC} (Recommended - Microsoft's free API)"
echo "   ✅ 100% FREE, no API key needed"
echo "   ✅ Good quality (Azure Neural voices)"
echo "   ✅ 400+ voices, 100+ languages"
echo "   ✅ Super easy setup"
echo "   ⚠️  Requires internet connection"
echo ""
echo -e "${BLUE}2. Piper TTS${NC} (Self-hosted)"
echo "   ✅ 100% FREE"
echo "   ✅ Works offline"
echo "   ✅ Good quality"
echo "   ✅ 50+ voices"
echo "   ⚠️  Requires model download (~50MB)"
echo ""
echo -e "${BLUE}3. OpenAI TTS${NC} (Affordable - ~\$1/month)"
echo "   ✅ Very affordable (\$15 per 1M characters)"
echo "   ✅ Good quality"
echo "   ✅ Uses same API key as Whisper"
echo "   ✅ 6 built-in voices"
echo "   💰 Not free, but very cheap"
echo ""
echo -e "${BLUE}4. No TTS${NC} (Text-only responses)"
echo "   ✅ 100% FREE"
echo "   ✅ No setup needed"
echo "   ⚠️  No voice responses"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
  1)
    echo ""
    echo -e "${BOLD}Setting up Edge TTS...${NC}\n"

    # Check if Python/pip is installed
    if ! command -v pip3 &> /dev/null && ! command -v pip &> /dev/null; then
      echo -e "${YELLOW}⚠️  pip not found. Installing python3...${NC}"
      if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install python3
      else
        echo "Please install Python 3 and pip manually"
        exit 1
      fi
    fi

    # Install edge-tts
    echo "Installing edge-tts..."
    pip3 install edge-tts || pip install edge-tts

    echo -e "${GREEN}✓${NC} Edge TTS installed\n"

    # List available voices
    echo "Popular voices:"
    edge-tts --list-voices | grep "Name" | grep "en-US" | head -5

    echo ""
    read -p "Enter voice name (or press Enter for en-US-AriaNeural): " voice
    voice=${voice:-en-US-AriaNeural}

    # Test it
    echo ""
    echo "Testing voice..."
    edge-tts --voice "$voice" --text "Hello! I'm ARDEN with Edge TTS. This is completely free!" --write-media /tmp/arden_test.mp3

    echo "Playing test audio..."
    if command -v afplay &> /dev/null; then
      afplay /tmp/arden_test.mp3
    elif command -v aplay &> /dev/null; then
      aplay /tmp/arden_test.mp3
    else
      echo "Test audio saved to /tmp/arden_test.mp3"
    fi
    rm -f /tmp/arden_test.mp3

    # Update config
    echo ""
    echo "Updating ARDEN configuration..."
    cp "$ARDEN_HOME/config/arden-edge-tts.json" "$ARDEN_HOME/config/arden.json"

    # Set the voice
    if command -v jq &> /dev/null; then
      jq ".voice.tts_config.voice = \"$voice\"" "$ARDEN_HOME/config/arden.json" > /tmp/arden_config.json
      mv /tmp/arden_config.json "$ARDEN_HOME/config/arden.json"
    else
      echo -e "${YELLOW}⚠️  jq not installed. Manually set voice to: $voice${NC}"
    fi

    echo -e "${GREEN}✓${NC} Edge TTS configured!\n"
    echo "Cost: $0/month"
    ;;

  2)
    echo ""
    echo -e "${BOLD}Setting up Piper TTS...${NC}\n"

    # Install Piper
    if [[ "$OSTYPE" == "darwin"* ]]; then
      echo "Installing Piper via Homebrew..."
      brew install piper-tts
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
      echo "Installing Piper via pip..."
      pip3 install piper-tts || pip install piper-tts
    else
      echo "Visit https://github.com/rhasspy/piper for installation instructions"
      exit 1
    fi

    echo -e "${GREEN}✓${NC} Piper installed\n"

    # Create models directory
    MODELS_DIR="$HOME/.local/share/piper/models"
    mkdir -p "$MODELS_DIR"

    # Download voice model
    echo "Downloading voice model (en_US-amy-medium)..."
    cd "$MODELS_DIR"

    wget -q --show-progress https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx
    wget -q --show-progress https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json

    echo -e "${GREEN}✓${NC} Voice model downloaded\n"

    # Test it
    echo "Testing voice..."
    echo "Hello! I'm ARDEN with Piper TTS. This runs entirely on your computer!" | piper \
      --model "$MODELS_DIR/en_US-amy-medium.onnx" \
      --output_file /tmp/arden_test.wav

    echo "Playing test audio..."
    if command -v afplay &> /dev/null; then
      afplay /tmp/arden_test.wav
    elif command -v aplay &> /dev/null; then
      aplay /tmp/arden_test.wav
    else
      echo "Test audio saved to /tmp/arden_test.wav"
    fi
    rm -f /tmp/arden_test.wav

    # Update config
    echo ""
    echo "Updating ARDEN configuration..."
    cp "$ARDEN_HOME/config/arden-piper.json" "$ARDEN_HOME/config/arden.json"

    echo -e "${GREEN}✓${NC} Piper TTS configured!\n"
    echo "Cost: $0/month (runs locally)"
    echo ""
    echo "More voices at: https://rhasspy.github.io/piper-samples/"
    ;;

  3)
    echo ""
    echo -e "${BOLD}Setting up OpenAI TTS...${NC}\n"

    # Check if OpenAI API key is set
    if [ -z "$OPENAI_API_KEY" ]; then
      echo -e "${YELLOW}⚠️  OPENAI_API_KEY not found in environment${NC}"
      echo "Make sure it's set in ~/ARDEN/.env"
    else
      echo -e "${GREEN}✓${NC} OpenAI API key found"
    fi

    # Test it
    echo ""
    echo "Testing OpenAI TTS..."
    curl -s https://api.openai.com/v1/audio/speech \
      -H "Authorization: Bearer $OPENAI_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "model": "tts-1",
        "input": "Hello! I am ARDEN with OpenAI TTS. This costs about one dollar per month.",
        "voice": "nova"
      }' \
      --output /tmp/arden_test.mp3

    if [ -f /tmp/arden_test.mp3 ]; then
      echo "Playing test audio..."
      if command -v afplay &> /dev/null; then
        afplay /tmp/arden_test.mp3
      elif command -v aplay &> /dev/null; then
        aplay /tmp/arden_test.mp3
      else
        echo "Test audio saved to /tmp/arden_test.mp3"
      fi
      rm -f /tmp/arden_test.mp3

      # Update config
      echo ""
      echo "Updating ARDEN configuration..."

      # Update the tts_provider in arden.json
      if command -v jq &> /dev/null; then
        jq '.voice.tts_provider = "openai-tts" | .voice.tts_config = {"api_key_env": "OPENAI_API_KEY", "model": "tts-1", "voice": "nova"}' \
          "$ARDEN_HOME/config/arden.json" > /tmp/arden_config.json
        mv /tmp/arden_config.json "$ARDEN_HOME/config/arden.json"
      else
        echo -e "${YELLOW}⚠️  jq not installed. Update config manually${NC}"
      fi

      echo -e "${GREEN}✓${NC} OpenAI TTS configured!\n"
      echo "Cost: ~\$0.50-1.50/month (typical usage)"
    else
      echo -e "${YELLOW}⚠️  Test failed. Check your OPENAI_API_KEY${NC}"
    fi
    ;;

  4)
    echo ""
    echo -e "${BOLD}Disabling TTS...${NC}\n"

    # Update config
    if command -v jq &> /dev/null; then
      jq '.voice.enabled = false' "$ARDEN_HOME/config/arden.json" > /tmp/arden_config.json
      mv /tmp/arden_config.json "$ARDEN_HOME/config/arden.json"
    else
      echo -e "${YELLOW}⚠️  jq not installed. Manually set voice.enabled = false${NC}"
    fi

    echo -e "${GREEN}✓${NC} TTS disabled\n"
    echo "ARDEN will respond with text only (no voice)"
    echo "Cost: $0/month"
    ;;

  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BOLD}${GREEN}✨ Setup Complete!${NC}\n"

echo "Next steps:"
echo "1. Restart your bot:"
echo "   cd ~/ARDEN/api"
echo "   pm2 restart arden-bot"
echo ""
echo "2. Test with Telegram:"
echo "   Send a voice message to your bot"
echo ""
echo "Documentation:"
echo "   cat ~/ARDEN/docs/voice-alternatives.md"
echo ""
