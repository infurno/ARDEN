#!/bin/bash

# Clawdbot Partnership Status Checker
# Checks the health and status of the ARDEN-Clawdbot partnership

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARDEN_DIR="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"
CONFIG_FILE="$ARDEN_DIR/config/arden.json"

# Load configuration
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "Error: Configuration file not found at $CONFIG_FILE" >&2
    exit 1
fi

CLAWDBOT_URL=$(jq -r '.clawdbot_partnership.api_url // empty' "$CONFIG_FILE")
CLAWDBOT_API_KEY=$(jq -r '.clawdbot_partnership.api_key // empty' "$CONFIG_FILE")
TIMEOUT=$(jq -r '.clawdbot_partnership.timeout // 30000' "$CONFIG_FILE")

if [[ -z "$CLAWDBOT_URL" || -z "$CLAWDBOT_API_KEY" ]]; then
    echo "Error: Clawdbot partnership configuration missing in $CONFIG_FILE" >&2
    exit 1
fi

echo "🤝 Checking ARDEN-Clawdbot Partnership Status"
echo "============================================="

# Check 1: Connectivity
echo "1. Testing connectivity to Clawdbot..."
if curl -s --connect-timeout 5 --max-time 10 "$CLAWDBOT_URL/partnership/health" >/dev/null 2>&1; then
    echo "   ✅ Connection successful"
else
    echo "   ❌ Connection failed"
    echo "   URL: $CLAWDBOT_URL"
    exit 1
fi

# Check 2: API Authentication
echo "2. Testing API authentication..."
response=$(curl -s -w "%{http_code}" \
    -H "Authorization: Bearer $CLAWDBOT_API_KEY" \
    -H "X-ARDEN-Request: partnership" \
    "$CLAWDBOT_URL/partnership/health" 2>/dev/null)

http_code="${response: -3}"
response_body="${response%???}"

if [[ "$http_code" -eq 200 ]]; then
    echo "   ✅ Authentication successful"
else
    echo "   ❌ Authentication failed (HTTP $http_code)"
    echo "   Response: $response_body"
    exit 1
fi

# Check 3: Capabilities
echo "3. Checking partnership capabilities..."
capabilities=$(curl -s \
    -H "Authorization: Bearer $CLAWDBOT_API_KEY" \
    -H "X-ARDEN-Request: partnership" \
    "$CLAWDBOT_URL/partnership/capabilities" 2>/dev/null || echo '{}')

if echo "$capabilities" | jq . >/dev/null 2>&1; then
    supported_platforms=$(echo "$capabilities" | jq -r '.supported_platforms[]? // empty' | tr '\n' ', ' | sed 's/,$//')
    automation_enabled=$(echo "$capabilities" | jq -r '.automation_enabled // false')
    collaboration_mode=$(echo "$capabilities" | jq -r '.collaboration_mode // "unknown"')
    
    echo "   ✅ Capabilities retrieved:"
    echo "      Platforms: $supported_platforms"
    echo "      Automation: $automation_enabled"
    echo "      Mode: $collaboration_mode"
else
    echo "   ⚠️  Could not retrieve capabilities"
fi

# Check 4: Recent Activity
echo "4. Checking recent partnership activity..."
if [[ -d "$ARDEN_DIR/tmp" ]]; then
    recent_requests=$(find "$ARDEN_DIR/tmp" -name "clawdbot_request_*.json" -mmin -60 2>/dev/null | wc -l)
    echo "   📊 Recent requests (last hour): $recent_requests"
    
    if [[ $recent_requests -gt 0 ]]; then
        echo "   📝 Latest requests:"
        for request_file in $(find "$ARDEN_DIR/tmp" -name "clawdbot_request_*.json" -mmin -60 2>/dev/null | head -3); do
            request_id=$(basename "$request_file" .json | sed 's/clawdbot_request_//')
            status=$(jq -r '.status // unknown' "$request_file" 2>/dev/null)
            echo "      $request_id: $status"
        done
    fi
else
    echo "   ℹ️  No request history directory found"
fi

# Check 5: Configuration Summary
echo "5. Configuration summary:"
echo "   API URL: $CLAWDBOT_URL"
echo "   Timeout: ${TIMEOUT}ms"
echo "   Collaboration mode: $(jq -r '.clawdbot_partnership.collaboration_mode // "bidirectional"' "$CONFIG_FILE")"
echo "   Automation enabled: $(jq -r '.clawdbot_partnership.automation_enabled // true' "$CONFIG_FILE")"

echo ""
echo "🎉 Partnership Status: HEALTHY"
echo "ARDEN and Clawdbot are ready for collaborative assistance!"
echo ""
echo "Usage examples:"
echo "  \"Send message to John via Clawdbot\""
echo "  \"Ask Clawdbot to schedule team meeting\""
echo "  \"Delegate email replies to Clawdbot\""