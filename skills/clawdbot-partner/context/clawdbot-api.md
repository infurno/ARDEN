# Clawdbot Partnership API Reference

## Overview
API specification for ARDEN-Clawdbot bidirectional partnership integration.

## Partnership Configuration

### Base Configuration
```json
{
  "clawdbot_partnership": {
    "enabled": true,
    "api_url": "http://localhost:3002/api",
    "api_key": "your-clawdbot-api-key",
    "timeout": 30000,
    "retry_attempts": 3,
    "webhook_secret": "your-webhook-secret",
    "supported_platforms": ["whatsapp", "telegram", "discord", "slack"],
    "automation_enabled": true,
    "collaboration_mode": "bidirectional"
  }
}
```

## Partnership API Endpoints

### 1. Send Partnership Request
```
POST /api/partnership/request
Authorization: Bearer {api_key}
X-ARDEN-Request: partnership
Content-Type: application/json

{
  "action": "message|delegate|collaborate|sync_context",
  "platform": "whatsapp|telegram|discord|slack|email|automation|general",
  "content": "Request content or instructions",
  "metadata": {
    "target": "contact_name_or_channel",
    "priority": "urgent|normal|low",
    "type": "communication|scheduling|automation|monitoring",
    "urgency": "immediate|within_hour|today|this_week"
  },
  "source": "arden",
  "timestamp": "2024-01-26T10:00:00Z"
}
```

**Response:**
```json
{
  "request_id": "req_abc123-def456",
  "status": "received|processing|completed|failed",
  "estimated_completion": "2024-01-26T10:05:00Z",
  "platform": "whatsapp",
  "action": "message",
  "created_at": "2024-01-26T10:00:00Z"
}
```

### 2. Get Request Status
```
GET /api/partnership/request/{request_id}/status
Authorization: Bearer {api_key}
X-ARDEN-Request: partnership
```

**Response:**
```json
{
  "request_id": "req_abc123-def456",
  "status": "completed",
  "result": {
    "platform": "whatsapp",
    "message_id": "msg_789xyz",
    "delivered_at": "2024-01-26T10:02:30Z",
    "delivery_status": "delivered"
  },
  "metadata": {
    "processing_time": "2.3s",
    "platform_response": "success"
  },
  "updated_at": "2024-01-26T10:02:30Z"
}
```

### 3. Get Partnership Capabilities
```
GET /api/partnership/capabilities
Authorization: Bearer {api_key}
X-ARDEN-Request: partnership
```

**Response:**
```json
{
  "supported_platforms": ["whatsapp", "telegram", "discord", "slack"],
  "automation_enabled": true,
  "collaboration_mode": "bidirectional",
  "features": {
    "messaging": true,
    "automation": true,
    "calendar": true,
    "smart_home": true,
    "context_sync": true
  },
  "limits": {
    "requests_per_hour": 100,
    "message_length_max": 4000,
    "file_size_max_mb": 100,
    "concurrent_requests": 5
  },
  "platform_status": {
    "whatsapp": "connected",
    "telegram": "connected", 
    "discord": "connected",
    "slack": "connected"
  }
}
```

### 4. Sync Context to Partner
```
POST /api/partnership/context/sync
Authorization: Bearer {api_key}
X-ARDEN-Request: partnership
Content-Type: application/json

{
  "context": {
    "user_profile": {
      "name": "User Name",
      "preferences": {...},
      "relationships": {...}
    },
    "current_session": {
      "start_time": "2024-01-26T10:00:00Z",
      "topics_discussed": ["project_planning"],
      "mood": "focused"
    },
    "active_projects": {...},
    "recent_activities": [...]
  },
  "sync_type": "full|delta|initial|hourly",
  "source": "arden",
  "timestamp": "2024-01-26T10:00:00Z"
}
```

**Response:**
```json
{
  "sync_id": "sync_abc123-def456",
  "status": "received|processing|completed",
  "context_items_processed": 25,
  "conflicts_resolved": 2,
  "processing_time": "1.2s",
  "next_sync_recommended": "2024-01-26T11:00:00Z"
}
```

### 5. Receive Context from Partner
```
GET /api/partnership/context/receive?platform={platform}&since={timestamp}
Authorization: Bearer {api_key}
X-ARDEN-Request: partnership
```

**Response:**
```json
{
  "context": {
    "messaging_history": [...],
    "calendar_events": [...],
    "automation_results": [...],
    "user_interactions": [...]
  },
  "platform": "all",
  "since": "2024-01-26T09:00:00Z",
  "items_count": 15,
  "last_updated": "2024-01-26T10:00:00Z"
}
```

### 6. Partnership Health Check
```
GET /api/partnership/health
Authorization: Bearer {api_key}
X-ARDEN-Request: partnership
```

**Response:**
```json
{
  "status": "healthy|degraded|unavailable",
  "uptime": "99.9%",
  "response_time_ms": 150,
  "platform_connectivity": {
    "whatsapp": "connected",
    "telegram": "connected",
    "discord": "maintenance",
    "slack": "connected"
  },
  "rate_limits": {
    "current_usage": 45,
    "limit": 100,
    "reset_time": "2024-01-26T11:00:00Z"
  },
  "last_sync": "2024-01-26T09:45:00Z"
}
```

## Partnership Actions

### Message Actions
```json
{
  "action": "message",
  "platform": "whatsapp",
  "content": "Hey Mom, I'll be home at 7pm",
  "metadata": {
    "target": "Mom",
    "type": "communication",
    "priority": "normal"
  }
}
```

### Delegation Actions
```json
{
  "action": "delegate",
  "platform": "email",
  "content": "Handle routine customer support inquiries",
  "metadata": {
    "scope": "customer_support",
    "authority_level": "managed_autonomy",
    "approval_required": ["refunds", "complaints"],
    "templates": ["greeting", "common_questions", "escalation"]
  }
}
```

### Collaboration Actions
```json
{
  "action": "collaborate",
  "platform": "general",
  "content": "Analyze Q3 sales data and create insights",
  "metadata": {
    "collaboration_mode": "research",
    "expected_output": "data_insights",
    "deadline": "2024-01-27T17:00:00Z",
    "shared_resources": ["sales_data_q3.csv", "market_trends.pdf"]
  }
}
```

### Context Sync Actions
```json
{
  "action": "sync_context",
  "platform": "shared",
  "content": "Full context synchronization",
  "metadata": {
    "sync_type": "hourly",
    "scope": "user_profile,active_projects,recent_activities",
    "priority": "normal"
  }
}
```

## Webhook Events

### Request Status Updates
```json
{
  "event": "request.updated",
  "request_id": "req_abc123-def456",
  "status": "completed",
  "result": {...},
  "timestamp": "2024-01-26T10:02:30Z"
}
```

### Context Updates
```json
{
  "event": "context.updated",
  "sync_id": "sync_abc123-def456",
  "platform": "whatsapp",
  "context_changes": {...},
  "timestamp": "2024-01-26T10:00:00Z"
}
```

### Partnership Events
```json
{
  "event": "partnership.status_changed",
  "status": "degraded",
  "reason": "platform_maintenance",
  "affected_platforms": ["discord"],
  "estimated_recovery": "2024-01-26T12:00:00Z"
}
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PLATFORM",
    "message": "Platform 'snapchat' is not supported",
    "details": {
      "supported_platforms": ["whatsapp", "telegram", "discord", "slack"]
    },
    "request_id": "req_abc123-def456",
    "timestamp": "2024-01-26T10:00:00Z"
  }
}
```

### Common Error Codes
| Code | Description | Resolution |
|------|-------------|------------|
| INVALID_PLATFORM | Platform not supported | Use supported platform |
| RATE_LIMITED | Too many requests | Wait and retry |
| INVALID_AUTH | Authentication failed | Check API key |
| MISSING_TARGET | Contact/target not found | Verify contact info |
| INSUFFICIENT_PERMISSIONS | Action not authorized | Check delegation scope |
| PLATFORM_UNAVAILABLE | Platform offline | Wait or use alternative |

## Rate Limits

### Request Limits
- **Per hour**: 100 requests
- **Per minute**: 10 requests
- **Concurrent**: 5 simultaneous requests
- **Burst**: Up to 20 requests with backoff

### Size Limits
- **Message content**: 4,000 characters
- **File attachments**: 100MB
- **Context payload**: 1MB
- **Webhook payload**: 500KB

## Security

### Authentication
- **Bearer tokens** in Authorization header
- **API key rotation** every 90 days
- **Request signing** with HMAC for webhooks
- **IP whitelisting** for added security

### Data Protection
- **TLS 1.3** encryption for all API calls
- **Context encryption** before storage
- **Automatic data deletion** after retention period
- **Audit logging** for all partnership activities

## Best Practices

### Performance Optimization
- **Batch operations** for multiple requests
- **Context delta syncing** to reduce bandwidth
- **Compression** for large payloads
- **Connection pooling** for frequent requests

### Error Recovery
- **Exponential backoff** for rate limits
- **Fallback platforms** for unavailability
- **Context caching** for offline scenarios
- **Graceful degradation** for degraded service

### Privacy Compliance
- **Minimal data sharing** principle
- **User consent** for context sharing
- **Data retention** policies
- **Right to deletion** implementation