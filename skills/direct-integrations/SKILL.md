---
name: direct-integrations
version: 0.1.0
enabled: false
triggers:
  - "connect to"
  - "integrate with"
  - "sync with"
patterns:
  - "(?:connect|integrate|sync)\\s+(?:to|with)\\s+(.+)"
  - "(?:setup|configure)\\s+(.+?)\\s+integration"
entry: null
timeout: 60000
agents: [engineer, strategist]
---

# Direct Integrations Skill

## Purpose
Manage third-party service integrations and API connections. Handles authentication, data sync, webhooks, and bidirectional communication with external platforms.

## Status
🚧 **PLANNED** - Not yet implemented

## Planned Integrations
- **GitHub** - Issues, PRs, repos, actions
- **Jira** - Tickets, sprints, projects
- **Notion** - Pages, databases, workspaces
- **Linear** - Issues, cycles, projects
- **Asana** - Tasks, projects, portfolios
- **Trello** - Boards, cards, lists
- **Airtable** - Bases, tables, records

## Tools (Planned)
- `github-client.js` - GitHub API wrapper
- `jira-client.js` - Jira REST API client
- `notion-client.js` - Notion API integration
- `linear-client.js` - Linear GraphQL API
- `webhook-handler.js` - Receive and process webhooks
- `oauth-manager.py` - Handle OAuth flows

## Workflows (Planned)
- `setup-integration.md` - Configure new service connection
- `sync-data.md` - Bidirectional data synchronization
- `webhook-processing.md` - Handle incoming events
- `disconnect-cleanup.md` - Safe disconnection and cleanup

## Agent Preferences
- **Engineer** - Technical implementation and API work
- **Strategist** - Integration architecture decisions

## Security Notes
- OAuth tokens stored in `~/.arden/integrations/`
- Credentials never committed to git
- Webhook signatures verified
- Rate limiting respected
