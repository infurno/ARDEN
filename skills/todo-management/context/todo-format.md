# TODO Format Specification

## Markdown Checkbox Format

ARDEN uses standard markdown checkbox syntax for TODOs.

### Unchecked TODO
```markdown
- [ ] TODO item text
```

### Checked/Completed TODO
```markdown
- [x] TODO item text
```

## Format Rules

1. **Checkbox Marker**: Space between brackets for unchecked `[ ]`, 'x' for checked `[x]`
2. **List Marker**: Dash `-` followed by space
3. **One TODO Per Line**: Each TODO is a separate line
4. **Plain Text**: TODO text is plain markdown (can include formatting)

## Valid Examples

```markdown
- [ ] Review pull request #42
- [ ] Deploy to production environment
- [x] Update API documentation
- [ ] Call Sarah about Q1 planning
- [ ] Fix authentication bug in login flow
```

## TODO Text Best Practices

### Good TODO Text
- ✅ Actionable: Starts with verb
- ✅ Specific: Clear what needs to be done
- ✅ Concise: One clear action
- ✅ Contextual: Includes relevant details

**Examples:**
```markdown
- [ ] Review PR #42 for authentication changes
- [ ] Deploy v2.1.0 to staging environment
- [ ] Send Q1 report to team by Friday
- [ ] Update API docs with new endpoints
```

### Poor TODO Text
- ❌ Vague: "Do stuff"
- ❌ Multiple actions: "Review code, test, and deploy"
- ❌ Too long: Full paragraphs
- ❌ Non-actionable: "The deployment issue"

## Metadata (Optional)

TODOs can include inline metadata:

### Priority
```markdown
- [ ] [HIGH] Critical bug fix for production
- [ ] [MEDIUM] Update documentation
- [ ] [LOW] Refactor legacy code
```

### Due Date
```markdown
- [ ] Send report (due: 2026-01-10)
- [ ] Review code (by Friday)
```

### Context/Project
```markdown
- [ ] Deploy new features [Project: API v2]
- [ ] Update dependencies [Tech Debt]
```

### Tags
```markdown
- [ ] Fix login bug #bug #critical
- [ ] Add feature request #enhancement
```

## Source Tracking

When consolidated, TODOs include source information:

```markdown
- [ ] Review pull request
  *Source: project-todos.md:15*
```

This helps track where the TODO originated.

## Consolidation Format

The consolidated `todo.md` includes:

### Header
```markdown
# 📋 Consolidated TODOs

*Last updated: 2026-01-03 15:30:00*

## 📊 Summary
- **Total TODO items found**: 42
- **Unchecked items**: 28
- **Checked items**: 14
- **Files with TODOs**: 8
```

### Grouped by File
```markdown
## 📄 project-todos.md

- [ ] Review architecture design
  *Source: project-todos.md:10*
  
- [ ] Update deployment scripts
  *Source: project-todos.md:15*

## 📄 weekly-planning.md

- [ ] Prepare Q1 presentation
  *Source: weekly-planning.md:5*
```

## Compatibility

The format is compatible with:
- ✅ GitHub markdown rendering
- ✅ Obsidian checkbox plugin
- ✅ VSCode markdown preview
- ✅ Most markdown editors
- ✅ Standard markdown parsers

## Special Characters

Avoid using in TODO text:
- Line breaks (use separate TODOs)
- Unclosed brackets `[` or `]`
- Markdown headers `#` at start
- List markers `-` `*` `+` at start

These can break parsing.
