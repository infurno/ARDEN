---
name: pptx-generator
version: 0.1.0
enabled: false
triggers:
  - "create presentation"
  - "make slides"
  - "powerpoint"
patterns:
  - "(?:create|make|generate)\\s+(?:a\\s+)?(?:presentation|slides?|pptx?|deck)(?:\\s+(?:for|about|on))\\s+(.+)"
  - "(?:presentation|slides?)\\s+(?:for|about|on)\\s+(.+)"
entry: null
timeout: 60000
agents: [strategist, assistant]
---

# PowerPoint Generator Skill

## Purpose
Generate professional PowerPoint presentations from outlines, topics, or existing documents. Creates structured slides with titles, bullet points, and visual suggestions.

## Status
🚧 **PLANNED** - Not yet implemented

## Planned Capabilities
- Generate presentations from text outlines
- Convert documents to slide decks
- Create templates (pitch deck, status update, training)
- Auto-generate speaker notes
- Suggest visuals/charts for each slide
- Export to PPTX format
- Theme and color scheme selection
- Title slide generation
- Agenda/outline slides

## Tools (Planned)
- `generate-pptx.py` - Main presentation generator (python-pptx)
- `outline-parser.py` - Parse text outlines to slide structure
- `doc-to-slides.py` - Convert Word docs to presentations
- `template-manager.py` - Manage slide templates
- `suggest-visuals.py` - Recommend charts/images per slide
- `export-pdf.py` - Export to PDF

## Workflows (Planned)
- `pitch-deck.md` - Investor/customer pitch format
- `status-update.md` - Project status presentation
- `training-materials.md` - Educational content format
- `quarterly-review.md` - Business review format
- `one-pager.md` - Single-slide executive summary

## Templates (Planned)
- `minimal` - Clean, professional
- `corporate` - Branded, structured
- `creative` - Bold, visual
- `academic` - Research-focused

## Agent Preferences
- **Strategist** - Business presentations and messaging
- **Assistant** - General slide creation

## Output
- `.pptx` files in `~/Notes/presentations/`
- Speaker notes included
- Suggested visuals documented
