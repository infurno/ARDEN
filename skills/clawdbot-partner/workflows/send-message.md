# Send Message via Clawdbot

## Overview
Workflow for sending cross-platform messages through Clawdbot partnership.

## Trigger Detection
ARDEN automatically detects messaging requests:
- "Send message to John via Clawdbot"
- "WhatsApp mom about dinner plans"
- "Tell the team on Slack about meeting"
- "Discord message: Game night at 8pm"
- "Telegram update to project group"

## Platform Support
- **WhatsApp** - Personal messaging
- **Telegram** - Group communications  
- **Discord** - Community and servers
- **Slack** - Work team channels
- **Email** - Professional communications

## Execution Flow

### 1. Parse Request
```
Input: "Send message to Sarah via WhatsApp: Can you pick up milk?"
Parsed:
- Action: message
- Platform: whatsapp
- Content: "Can you pick up milk?"
- Target: Sarah
- Metadata: {target: "Sarah", type: "communication"}
```

### 2. Validate Platform
Check if platform is supported:
```bash
# Check supported platforms from config
jq -r '.clawdbot_partnership.supported_platforms[]' ~/ARDEN/config/arden.json
```

### 3. Contact Verification
Auto-detect and validate contacts:
- Search local contacts
- Verify platform-specific contact format
- Suggest alternatives for unknown contacts

### 4. Message Enhancement
Smart message processing:
- Add context from recent conversations
- Include relevant attachments
- Apply formatting for target platform
- Respect platform character limits

### 5. Send via Clawdbot
Execute tool: `execute-clawdbot.sh`
```bash
./execute-clawdbot.sh message whatsapp "Can you pick up milk?" '{"target":"Sarah","type":"communication"}'
```

### 6. Response Handling
Process Clawdbot response:
- Confirm successful delivery
- Report delivery status
- Track message ID for follow-up
- Handle errors gracefully

## Smart Features

### Contact Intelligence
- **Auto-complete**: Suggest contacts as you type
- **Platform detection**: Know which contacts are on which platforms
- **Group recognition**: Identify groups vs individual contacts
- **Frequency learning**: Prioritize frequently contacted people

### Message Optimization
- **Platform formatting**: Adapt message style per platform
- **Media handling**: Include images, voice notes, files
- **Timing suggestions**: Best times to contact based on history
- **Language preferences**: Respect contact language settings

### Context Awareness
- **Conversation history**: Reference recent messages
- **Location sharing**: Include relevant location info
- **Event linking**: Connect to calendar events
- **Task integration**: Link to TODOs and notes

## Examples

### Personal Messaging
```
"WhatsApp mom: I'll be home at 7pm"
→ Sends via WhatsApp with delivery confirmation
```

### Team Communication
```
"Slack team: Standup meeting moved to 10am"
→ Posts to team channel with meeting link
```

### Group Coordination
```
"Discord gaming group: Tournament starts at 8pm EST"
→ Sends with timezone conversion and reminder
```

### Professional Messages
```
"Email client about project update"
→ Sends formatted email with relevant attachments
```

## Error Handling
- **Platform unavailable**: Suggest alternative platforms
- **Contact not found**: Offer contact creation or correction
- **Message failed**: Retry with alternative contact/method
- **Rate limiting**: Queue message for later delivery

## Privacy Controls
- **User consent**: Ask before accessing contacts
- **Message encryption**: Secure transmission to Clawdbot
- **Data retention**: Optional message history
- **Blocking**: Block specific contacts/platforms

## Related Workflows
- [delegate-task.md](delegate-task.md) - Complex task delegation
- [collaborate.md](collaborate.md) - Joint work sessions
- [sync-context.md](sync-context.md) - Context synchronization