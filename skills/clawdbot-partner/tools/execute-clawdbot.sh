#!/bin/bash

# Clawdbot Partnership Execution Tool
# Sends requests to Clawdbot for collaborative AI assistance

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARDEN_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
CONFIG_FILE="$ARDEN_DIR/config/arden.json"

# Load configuration
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "Error: Configuration file not found at $CONFIG_FILE" >&2
    exit 1
fi

# Parse Clawdbot config
CLAWDBOT_URL=$(jq -r '.clawdbot_partnership.api_url // empty' "$CONFIG_FILE")
CLAWDBOT_API_KEY=$(jq -r '.clawdbot_partnership.api_key // empty' "$CONFIG_FILE")
TIMEOUT=$(jq -r '.clawdbot_partnership.timeout // 30000' "$CONFIG_FILE")
RETRY_ATTEMPTS=$(jq -r '.clawdbot_partnership.retry_attempts // 3' "$CONFIG_FILE")

if [[ -z "$CLAWDBOT_URL" || -z "$CLAWDBOT_API_KEY" ]]; then
    echo "Error: Clawdbot partnership configuration missing in $CONFIG_FILE" >&2
    echo "Please set clawdbot_partnership.api_url and api_key" >&2
    exit 1
fi

# Parse arguments
ACTION="${1:-}"
PLATFORM="${2:-}"
CONTENT="${3:-}"
METADATA="${4:-{}}"

if [[ -z "$ACTION" || -z "$PLATFORM" || -z "$CONTENT" ]]; then
    echo "Usage: $0 <action> <platform> <content> [metadata_json]" >&2
    echo "Example: $0 message whatsapp \"Tell mom I'll be home at 7\" '{\"target\":\"mom\"}'" >&2
    exit 1
fi

# Validate metadata is valid JSON
if ! echo "$METADATA" | jq . >/dev/null 2>&1; then
    echo "Error: metadata must be valid JSON" >&2
    exit 1
fi

echo "Sending request to Clawdbot..."
echo "Action: $ACTION"
echo "Platform: $PLATFORM"
echo "Content: $CONTENT"
echo "Metadata: $METADATA"

# Prepare request payload
REQUEST_PAYLOAD=$(jq -n \
    --arg action "$ACTION" \
    --arg platform "$PLATFORM" \
    --arg content "$CONTENT" \
    --argjson metadata "$METADATA" \
    --arg source "arden" \
    '{
        "action": $action,
        "platform": $platform,
        "content": $content,
        "metadata": $metadata,
        "source": $source,
        "timestamp": now | strftime("%Y-%m-%dT%H:%M:%SZ")
    }')

# Submit request with retry logic
attempt=1
while (( attempt <= RETRY_ATTEMPTS )); do
    echo "Attempt $attempt of $RETRY_ATTEMPTS..."
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CLAWDBOT_API_KEY" \
        -H "X-ARDEN-Request: partnership" \
        -d "$REQUEST_PAYLOAD" \
        "$CLAWDBOT_URL/partnership/request" \
        --connect-timeout $((TIMEOUT / 1000)) \
        --max-time $((TIMEOUT / 1000)) || true)
    
    # Split response and status code
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    if [[ "$http_code" -eq 200 ]] || [[ "$http_code" -eq 201 ]]; then
        request_id=$(echo "$response_body" | jq -r '.request_id // empty')
        status=$(echo "$response_body" | jq -r '.status // empty')
        
        if [[ -n "$request_id" ]]; then
            echo "✓ Request sent to Clawdbot successfully!"
            echo "Request ID: $request_id"
            echo "Status: $status"
            echo "Response: $response_body"
            
            # Store request info for tracking
            echo "$response_body" > "$ARDEN_DIR/tmp/clawdbot_request_$request_id.json"
            exit 0
        fi
    fi
    
    echo "Error: HTTP $http_code - $response_body"
    
    if (( attempt < RETRY_ATTEMPTS )); then
        echo "Retrying in 5 seconds..."
        sleep 5
    fi
    
    ((attempt++))
done

echo "Failed to send request to Clawdbot after $RETRY_ATTEMPTS attempts" >&2
exit 1