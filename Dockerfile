# ARDEN Production Dockerfile with NVIDIA GPU Support
# Enables GPU acceleration for local Whisper STT and optional ML workloads

# Use NVIDIA CUDA base image for GPU support
FROM nvidia/cuda:12.2.0-runtime-ubuntu22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    NODE_VERSION=20 \
    ARDEN_ROOT=/app \
    PATH="/app/venv/bin:$PATH"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # Core utilities
    curl \
    wget \
    git \
    gnupg \
    ca-certificates \
    # Python and build tools
    python3.10 \
    python3.10-venv \
    python3-pip \
    build-essential \
    # FFmpeg for audio processing
    ffmpeg \
    # Audio libraries for Whisper
    libsndfile1 \
    portaudio19-dev \
    # Cleanup
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20.x
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY api/package*.json ./api/

# Install Node.js dependencies
RUN cd api && npm ci --only=production

# Create Python virtual environment and install dependencies
RUN python3 -m venv venv

# Install Python dependencies for Whisper (with CUDA support)
RUN venv/bin/pip install --no-cache-dir \
    openai-whisper==20231117 \
    torch==2.1.0 \
    torchaudio==2.1.0 \
    # Additional STT/TTS tools
    edge-tts \
    # Ensure CUDA support
    && venv/bin/pip install --no-cache-dir --upgrade pip

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p \
    voice/recordings \
    voice/responses \
    history/sessions \
    api/logs \
    skills

# Set permissions
RUN chmod +x api/telegram-bot.js

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Expose port for health checks (optional)
EXPOSE 3000

# Run as non-root user for security
RUN useradd -m -u 1000 arden && \
    chown -R arden:arden /app
USER arden

# Default command
CMD ["node", "api/telegram-bot.js"]
