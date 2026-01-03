# TODO Location

TODOs are stored in the Notes directory using markdown files.

## Default Location
`~/Notes/todo.md`

This is the primary TODO file where all TODOs are consolidated.

## Directory Structure
```
~/Notes/
├── todo.md              # Master TODO list (consolidated)
├── project-todos.md     # Project-specific TODOs
├── meeting-notes.md     # Meeting TODOs
└── daily/               # Daily TODO lists
    ├── 2026-01-03.md
    └── 2026-01-04.md
```

## File Format
All TODO files use markdown checkbox syntax:
```markdown
# TODOs

- [ ] Unchecked TODO item
- [x] Completed TODO item
```

## Consolidation
All TODO files in the Notes directory are automatically scanned and consolidated into `todo.md` by the consolidation script.

The consolidation happens:
- When a TODO is added via the skill
- When the web interface updates a TODO
- When manually triggered via the API
- Periodically (if configured)

## Custom TODO Files
Users can organize TODOs in separate files:
- `deployment-checklist.md` - Deployment tasks
- `weekly-planning.md` - Weekly planning TODOs
- `project-name.md` - Project-specific tasks

All custom files are included in the consolidation.
