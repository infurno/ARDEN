---
name: excalidraw-diagram
version: 0.1.0
enabled: false
triggers:
  - "create diagram"
  - "draw diagram"
  - "excalidraw"
patterns:
  - "(?:create|make|draw|generate)\\s+(?:a\\s+)?(?:diagram|chart|flowchart|mind\\s*map)(?:\\s+(?:for|of|about))\\s+(.+)"
  - "(?:excalidraw)\\s+(.+)"
entry: null
timeout: 30000
agents: [engineer, strategist, analyst]
---

# Excalidraw Diagram Skill

## Purpose
Generate Excalidraw-compatible diagram files from descriptions or structured data. Creates flowcharts, architecture diagrams, mind maps, and system diagrams.

## Status
🚧 **PLANNED** - Not yet implemented

## Planned Capabilities
- Generate diagrams from text descriptions
- Create architecture diagrams
- Build flowcharts from process descriptions
- Generate mind maps from outlines
- Create ER diagrams from schemas
- Build system topology diagrams
- Export to Excalidraw JSON format
- Theme-aware styling (light/dark)
- Hand-drawn aesthetic matching

## Tools (Planned)
- `generate-diagram.py` - Main diagram generator
- `flowchart-builder.py` - Create flowcharts
- `arch-diagram.py` - Architecture diagrams
- `mindmap-generator.py` - Mind maps from outlines
- `er-diagram.py` - Entity-relationship diagrams
- `topology-map.py` - Network/system topology
- `excalidraw-exporter.py` - Export to .excalidraw format

## Workflows (Planned)
- `system-architecture.md` - Software architecture diagrams
- `process-flow.md` - Business process flowcharts
- `decision-tree.md` - Decision flow diagrams
- `mind-map.md` - Brainstorming mind maps
- `network-topology.md` - Infrastructure diagrams
- `user-flow.md` - UX/user journey diagrams

## Diagram Types
- **Flowchart** - Process flows, decision trees
- **Architecture** - System components, data flow
- **Mind Map** - Hierarchical brainstorming
- **ER Diagram** - Database relationships
- **Network** - Infrastructure, topology
- **Timeline** - Sequential events
- **Gantt** - Project schedules

## Agent Preferences
- **Engineer** - Technical architecture diagrams
- **Strategist** - Process flows and decision trees
- **Analyst** - Data flow and relationship diagrams

## Output
- `.excalidraw` files in `~/Notes/diagrams/`
- PNG/SVG export option
- Shareable links (if Excalidraw+ integration)
- Embeddable in notes and documentation

## Integration
- Link diagrams in MEMORY.md
- Reference in todo items
- Embed in daily planning briefings
- Include in pptx-generator presentations
