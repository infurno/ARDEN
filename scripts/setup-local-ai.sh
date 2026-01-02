#!/bin/bash

# ARDEN Local AI Setup Script
# Installs Ollama and configures ARDEN to use local models

set -e

echo "🤖 ARDEN Local AI Setup"
echo "======================="
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Install from https://brew.sh"
    exit 1
fi

# Install Ollama
echo "📦 Installing Ollama..."
if command -v ollama &> /dev/null; then
    echo "✅ Ollama already installed"
else
    brew install ollama
    echo "✅ Ollama installed"
fi

# Start Ollama service
echo ""
echo "🚀 Starting Ollama service..."
if pgrep -x "ollama" > /dev/null; then
    echo "✅ Ollama is already running"
else
    # Start Ollama in background
    brew services start ollama
    sleep 2
    echo "✅ Ollama service started"
fi

# Pull recommended model
echo ""
echo "📥 Downloading AI model (this may take a few minutes)..."
echo "   Recommended: llama3.2 (2GB - fast and capable)"
echo ""

read -p "Which model? (1) llama3.2 [default], (2) phi3 (fast), (3) llama3.1:8b (best): " choice

case $choice in
    2)
        MODEL="phi3"
        ;;
    3)
        MODEL="llama3.1:8b"
        ;;
    *)
        MODEL="llama3.2"
        ;;
esac

ollama pull $MODEL
echo "✅ Model $MODEL downloaded"

# Update .env file
echo ""
echo "⚙️  Updating configuration..."

ENV_FILE="$HOME/ARDEN/.env"

# Remove old AI_PROVIDER lines if they exist
sed -i.bak '/^AI_PROVIDER=/d' "$ENV_FILE" 2>/dev/null || true
sed -i.bak '/^OLLAMA_MODEL=/d' "$ENV_FILE" 2>/dev/null || true
sed -i.bak '/^OLLAMA_URL=/d' "$ENV_FILE" 2>/dev/null || true

# Add new configuration
cat >> "$ENV_FILE" << EOF

# AI Provider Configuration
AI_PROVIDER=ollama
OLLAMA_MODEL=$MODEL
OLLAMA_URL=http://localhost:11434
EOF

echo "✅ Configuration updated"

# Test Ollama
echo ""
echo "🧪 Testing Ollama..."
TEST_RESPONSE=$(ollama run $MODEL "Say 'ARDEN is ready!' in one sentence" 2>&1 | head -1)
echo "   Response: $TEST_RESPONSE"

# Summary
echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "Your ARDEN bot now uses:"
echo "  🤖 AI: Ollama ($MODEL)"
echo "  🎤 STT: Local Whisper"
echo "  🔊 TTS: Edge TTS"
echo "  💰 Cost: \$0/month"
echo ""
echo "Next steps:"
echo "  1. cd ~/ARDEN/api"
echo "  2. npm start"
echo "  3. Send a message to your Telegram bot!"
echo ""
echo "To test Ollama directly:"
echo "  ollama run $MODEL 'Hello!'"
echo ""
