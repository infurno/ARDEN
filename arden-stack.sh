#!/bin/bash

# ARDEN Stack Management Script
# Controls all services: telegram-bot, discord-bot, and web-server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_ROOT="${ARDEN_ROOT:-$(dirname "$(readlink -f "$0")")}"
ECOSYSTEM_FILE="$APP_ROOT/ecosystem.config.js"
# Try to find PM2 in various locations
if [[ -n "$PM2_BIN" ]]; then
    PM2_BIN="$PM2_BIN"
elif [[ -f "/home/hal/.npm-global/bin/pm2" ]]; then
    PM2_BIN="/home/hal/.npm-global/bin/pm2"
elif command -v pm2 &> /dev/null; then
    PM2_BIN="$(command -v pm2)"
else
    PM2_BIN="$(find /home/hal -name pm2 -type f 2>/dev/null | head -1)"
fi
LOG_DIR="$APP_ROOT/logs"

# Service names from ecosystem.config.js
SERVICES=("arden-bot" "arden-discord" "arden-web")

# Functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

check_pm2() {
    if [[ ! -f "$PM2_BIN" ]]; then
        error "PM2 binary not found at: $PM2_BIN"
        error "Please install PM2: npm install -g pm2"
        exit 1
    fi
    
    if ! "$PM2_BIN" --version &> /dev/null; then
        error "PM2 is not working properly"
        exit 1
    fi
}

check_ecosystem() {
    if [[ ! -f "$ECOSYSTEM_FILE" ]]; then
        error "Ecosystem config file not found: $ECOSYSTEM_FILE"
        exit 1
    fi
}

ensure_log_dir() {
    if [[ ! -d "$LOG_DIR" ]]; then
        warn "Log directory not found: $LOG_DIR"
        if [[ $EUID -eq 0 ]]; then
            mkdir -p "$LOG_DIR"
            chmod 755 "$LOG_DIR"
            log "Created log directory: $LOG_DIR"
        else
            warn "Run as root to create log directory: $LOG_DIR"
        fi
    fi
}

show_status() {
    info "PM2 Process Status:"
    $PM2_BIN status
    
    info ""
    info "Service Details:"
    for service in "${SERVICES[@]}"; do
        if $PM2_BIN describe "$service" &>/dev/null; then
            local status=$($PM2_BIN jlist | jq -r ".[] | select(.name==\"$service\") | .pm2_env.status" 2>/dev/null || echo "unknown")
            local uptime=$($PM2_BIN jlist | jq -r ".[] | select(.name==\"$service\") | .pm2_env.pm_uptime" 2>/dev/null || echo "N/A")
            local memory=$($PM2_BIN jlist | jq -r ".[] | select(.name==\"$service\") | .monit.memory" 2>/dev/null || echo "N/A")
            
            case $status in
                "online")
                    echo -e "  ${GREEN}✓${NC} $service: $status (Uptime: $uptime, Memory: $memory)"
                    ;;
                "stopped")
                    echo -e "  ${RED}✗${NC} $service: $status"
                    ;;
                "starting")
                    echo -e "  ${YELLOW}⏳${NC} $service: $status"
                    ;;
                "errored")
                    echo -e "  ${RED}⚠${NC} $service: $status"
                    ;;
                *)
                    echo -e "  ${YELLOW}?${NC} $service: $status"
                    ;;
            esac
        else
            echo -e "  ${RED}✗${NC} $service: not running"
        fi
    done
}

show_logs() {
    local lines=${1:-50}
    local service=${2:-"all"}
    
    if [[ "$service" == "all" ]]; then
        info "Showing last $lines lines for all services:"
        $PM2_BIN logs --lines "$lines" --nostream
    else
        if [[ " ${SERVICES[@]} " =~ " ${service} " ]]; then
            info "Showing last $lines lines for $service:"
            $PM2_BIN logs "$service" --lines "$lines" --nostream
        else
            error "Unknown service: $service"
            info "Available services: ${SERVICES[*]}"
            exit 1
        fi
    fi
}

start_stack() {
    local service=${1:-"all"}
    
    log "Starting ARDEN stack..."
    ensure_log_dir
    
    if [[ "$service" == "all" ]]; then
        info "Starting all services..."
        $PM2_BIN start "$ECOSYSTEM_FILE"
        log "All services started"
    else
        if [[ " ${SERVICES[@]} " =~ " ${service} " ]]; then
            info "Starting service: $service"
            $PM2_BIN start "$ECOSYSTEM_FILE" --only "$service"
            log "Service $service started"
        else
            error "Unknown service: $service"
            info "Available services: ${SERVICES[*]}"
            exit 1
        fi
    fi
    
    sleep 2
    show_status
}

stop_stack() {
    local service=${1:-"all"}
    
    if [[ "$service" == "all" ]]; then
        log "Stopping all ARDEN services..."
        $PM2_BRAW stop "$ECOSYSTEM_FILE"
        log "All services stopped"
    else
        if [[ " ${SERVICES[@]} " =~ " ${service} " ]]; then
            log "Stopping service: $service"
            $PM2_BIN stop "$service"
            log "Service $service stopped"
        else
            error "Unknown service: $service"
            info "Available services: ${SERVICES[*]}"
            exit 1
        fi
    fi
    
    sleep 2
    show_status
}

restart_stack() {
    local service=${1:-"all"}
    
    log "Restarting ARDEN stack..."
    
    if [[ "$service" == "all" ]]; then
        info "Restarting all services..."
        $PM2_BIN restart "$ECOSYSTEM_FILE"
        log "All services restarted"
    else
        if [[ " ${SERVICES[@]} " =~ " ${service} " ]]; then
            info "Restarting service: $service"
            $PM2_BIN restart "$service"
            log "Service $service restarted"
        else
            error "Unknown service: $service"
            info "Available services: ${SERVICES[*]}"
            exit 1
        fi
    fi
    
    sleep 2
    show_status
}

reload_stack() {
    local service=${1:-"all"}
    
    log "Reloading ARDEN stack (zero-downtime)..."
    
    if [[ "$service" == "all" ]]; then
        info "Reloading all services..."
        $PM2_BIN reload "$ECOSYSTEM_FILE"
        log "All services reloaded"
    else
        if [[ " ${SERVICES[@]} " =~ " ${service} " ]]; then
            info "Reloading service: $service"
            $PM2_BIN reload "$service"
            log "Service $service reloaded"
        else
            error "Unknown service: $service"
            info "Available services: ${SERVICES[*]}"
            exit 1
        fi
    fi
    
    sleep 2
    show_status
}

delete_stack() {
    local service=${1:-"all"}
    
    warn "This will delete the process from PM2 (not the files)"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ "$service" == "all" ]]; then
            log "Deleting all ARDEN services from PM2..."
            $PM2_BIN delete "$ECOSYSTEM_FILE"
        else
            if [[ " ${SERVICES[@]} " =~ " ${service} " ]]; then
                log "Deleting service from PM2: $service"
                $PM2_BIN delete "$service"
            else
                error "Unknown service: $service"
                info "Available services: ${SERVICES[*]}"
                exit 1
            fi
        fi
        log "Service(s) deleted from PM2"
    else
        info "Operation cancelled"
    fi
}

monitor_stack() {
    info "Starting PM2 monitor for ARDEN services..."
    $PM2_BIN monit
}

save_pm2_config() {
    info "Saving PM2 configuration..."
    $PM2_BIN save
    log "PM2 configuration saved"
}

generate_startup_script() {
    info "Generating startup script for system boot..."
    $PM2_BIN startup
    log "Startup script generated. Run the suggested command as root to enable."
}

show_help() {
    cat << EOF
ARDEN Stack Management Script

USAGE:
    $0 <command> [service] [options]

COMMANDS:
    start [service]     Start all services or specific service
    stop [service]      Stop all services or specific service
    restart [service]   Restart all services or specific service
    reload [service]    Reload all services or specific service (zero-downtime)
    status              Show status of all services
    logs [lines] [service]  Show logs (default 50 lines, all services)
    delete [service]    Delete service(s) from PM2
    monitor             Start PM2 monitor
    save                Save PM2 configuration
    startup             Generate system startup script
    help                Show this help message

SERVICES:
    all (default)       All services
    arden-bot           Telegram Bot Service
    arden-discord       Discord Bot Service
    arden-web           Web Server Service

EXAMPLES:
    $0 start                    # Start all services
    $0 start arden-bot         # Start only telegram bot
    $0 restart                  # Restart all services
    $0 logs 100 arden-web      # Show last 100 lines of web server logs
    $0 status                   # Show detailed status

ENVIRONMENT VARIABLES:
    ARDEN_ROOT                  Root directory of ARDEN application
    PM2_BIN                     Path to PM2 binary

EOF
}

# Main script logic
main() {
    # Check prerequisites
    check_pm2
    check_ecosystem
    
    # Change to app directory
    cd "$APP_ROOT"
    
    # Parse command
    case "${1:-help}" in
        "start")
            start_stack "${2:-all}"
            ;;
        "stop")
            stop_stack "${2:-all}"
            ;;
        "restart")
            restart_stack "${2:-all}"
            ;;
        "reload")
            reload_stack "${2:-all}"
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "${2:-50}" "${3:-all}"
            ;;
        "delete")
            delete_stack "${2:-all}"
            ;;
        "monitor")
            monitor_stack
            ;;
        "save")
            save_pm2_config
            ;;
        "startup")
            generate_startup_script
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Trap signals for cleanup
trap 'warn "Script interrupted"' INT TERM

# Run main function with all arguments
main "$@"