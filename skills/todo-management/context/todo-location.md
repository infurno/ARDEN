# TODO Location

TODOs are stored in categorized files within the Notes/todos directory using markdown format.

## Category Structure

TODOs are organized into three categories:

### Work TODOs
`~/Notes/todos/work.md`
- Professional tasks, meetings, projects
- Code reviews, deployments, documentation
- Client communications, reports

### Personal TODOs
`~/Notes/todos/personal.md`
- Household tasks, errands, appointments
- Family, friends, health, fitness
- Personal finances, shopping

### Side Projects TODOs
`~/Notes/todos/side-projects.md`
- ARDEN improvements and features
- Learning new technologies, tutorials
- Personal coding projects, experiments

## Directory Structure
```
~/Notes/
├── todo.md              # Master TODO list (auto-generated, consolidated)
└── todos/               # Source TODO files (ONLY directory scanned)
    ├── work.md         # Work TODOs
    ├── personal.md     # Personal TODOs
    └── side-projects.md # Side project TODOs
```

## File Format
All TODO files use markdown checkbox syntax:
```markdown
# Work TODOs

- [ ] Unchecked TODO item
- [x] Completed TODO item
```

## Consolidation
Only files in `~/Notes/todos/` directory are scanned for TODOs. Regular notes in `~/Notes/` are NOT included.

The consolidation happens:
- When a TODO is added via the skill
- When the web interface updates a TODO
- When manually triggered via the API
- When the consolidation script is run

The consolidated file `~/Notes/todo.md` is auto-generated and includes all TODOs from the three category files.

## Important Notes
- **Source files:** `~/Notes/todos/*.md` (work, personal, side-projects)
- **Consolidated output:** `~/Notes/todo.md` (auto-generated)
- **Regular notes:** Files in `~/Notes/` (excluding todos/) are NOT scanned for TODOs
- This separation keeps TODO management clean and organized
