# Makefile for ARDEN Docker Deployment

.PHONY: help build up down logs restart clean test-build validate

# Default target
help:
	@echo "ARDEN Docker Deployment Commands:"
	@echo ""
	@echo "  make build         - Build Docker images"
	@echo "  make up            - Start services"
	@echo "  make up-ollama     - Start services with Ollama"
	@echo "  make down          - Stop services"
	@echo "  make restart       - Restart services"
	@echo "  make logs          - View logs"
	@echo "  make logs-f        - Follow logs"
	@echo "  make clean         - Stop and remove all containers and volumes"
	@echo "  make test-build    - Test build without starting"
	@echo "  make validate      - Validate configuration"
	@echo "  make gpu-test      - Test GPU access"
	@echo "  make backup        - Backup persistent data"
	@echo "  make shell         - Open shell in container"
	@echo ""

# Build Docker images
build:
	@echo "Building ARDEN Docker images..."
	docker compose build

# Start services (ARDEN only)
up:
	@echo "Starting ARDEN services..."
	docker compose up -d
	@echo "Services started. Use 'make logs' to view logs."

# Start services with Ollama
up-ollama:
	@echo "Starting ARDEN with Ollama..."
	docker compose --profile ollama up -d
	@echo "Services started. Use 'make logs' to view logs."

# Stop services
down:
	@echo "Stopping ARDEN services..."
	docker compose down

# Restart services
restart:
	@echo "Restarting ARDEN services..."
	docker compose restart

# View logs (last 100 lines)
logs:
	docker compose logs --tail=100

# Follow logs
logs-f:
	docker compose logs -f

# Clean up everything (WARNING: removes volumes)
clean:
	@echo "WARNING: This will remove all containers and volumes!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v; \
		echo "Cleanup complete."; \
	fi

# Test build without starting
test-build:
	@echo "Testing Docker build..."
	docker compose build --no-cache

# Validate configuration
validate:
	@echo "Validating configuration..."
	@if [ ! -f .env ]; then \
		echo "ERROR: .env file not found!"; \
		echo "Copy .env.production to .env and configure it."; \
		exit 1; \
	fi
	@echo "Checking required environment variables..."
	@grep -q "TELEGRAM_BOT_TOKEN=" .env || (echo "ERROR: TELEGRAM_BOT_TOKEN not set in .env" && exit 1)
	@echo "Configuration validation passed!"

# Test GPU access
gpu-test:
	@echo "Testing NVIDIA GPU access..."
	docker run --rm --gpus all nvidia/cuda:12.2.0-base-ubuntu22.04 nvidia-smi || \
		(echo "ERROR: GPU not accessible. Install NVIDIA Container Toolkit."; exit 1)
	@echo "GPU test passed!"

# Backup persistent data
backup:
	@echo "Creating backup..."
	@mkdir -p backups
	docker run --rm \
		-v arden_arden-history:/data/history \
		-v arden_arden-logs:/data/logs \
		-v $$(pwd)/backups:/backup \
		alpine tar czf /backup/arden-backup-$$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
	@echo "Backup complete in backups/ directory"

# Open shell in container
shell:
	docker exec -it arden-bot /bin/bash

# Check status
status:
	@echo "Container Status:"
	@docker compose ps
	@echo ""
	@echo "Resource Usage:"
	@docker stats --no-stream arden-bot 2>/dev/null || echo "Container not running"

# Pull latest code and rebuild
update:
	@echo "Pulling latest code..."
	git pull
	@echo "Rebuilding containers..."
	docker compose build
	@echo "Restarting services..."
	docker compose up -d
	@echo "Update complete!"

# Install prerequisites
install-prereqs:
	@echo "This will install Docker and NVIDIA Container Toolkit"
	@echo "Please review DEPLOYMENT.md for manual installation steps"
	@echo "This script assumes Ubuntu/Debian"
	@read -p "Continue? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		curl -fsSL https://get.docker.com -o get-docker.sh; \
		sudo sh get-docker.sh; \
		sudo usermod -aG docker $$USER; \
		echo "Docker installed. Log out and back in for group changes to take effect."; \
	fi
