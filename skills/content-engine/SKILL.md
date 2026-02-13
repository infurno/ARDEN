---
name: content-engine
version: 0.1.0
enabled: false
triggers:
  - "summarize"
  - "extract insights"
  - "analyze content"
patterns:
  - "(?:summarize|summarise)\\s+(.+)"
  - "(?:extract|pull)\\s+insights\\s+from\\s+(.+)"
  - "(?:analyze|process)\\s+content\\s+(.+)"
entry: null
timeout: 30000
agents: [analyst, researcher]
---

# Content Engine Skill

## Purpose
Process, analyze, and extract insights from documents, articles, URLs, and raw text. Generates summaries, key takeaways, sentiment analysis, and structured data extraction.

## Status
🚧 **PLANNED** - Not yet implemented

## Planned Capabilities
- URL content fetching and parsing
- Document ingestion (PDF, DOCX, TXT)
- Summarization (TL;DR, bullet points, detailed)
- Key insight extraction
- Sentiment analysis
- Named entity recognition
- Question answering from documents
- Cross-document comparison

## Tools (Planned)
- `fetch-url.sh` - Fetch and extract content from URLs
- `summarize.py` - Generate summaries at various lengths
- `extract-entities.py` - Extract people, places, organizations
- `analyze-sentiment.py` - Sentiment scoring
- `compare-docs.py` - Compare multiple documents

## Workflows (Planned)
- `quick-summary.md` - One-paragraph summary
- `deep-analysis.md` - Comprehensive document analysis
- `research-synthesis.md` - Combine multiple sources

## Agent Preferences
- **Analyst** - Data extraction and pattern recognition
- **Researcher** - Deep investigation across sources

## Future Integration
- Integrate with MEMORY.md for long-term storage of insights
- Connect to daily-planning for morning briefings
- Feed into todo-management for action items
