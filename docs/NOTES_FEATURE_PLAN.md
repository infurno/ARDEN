# Notes Management Feature - Implementation Plan

## Overview

Add a comprehensive notes browser to the ARDEN web interface, allowing you to view, search, edit, and manage your 332+ markdown notes (207MB) from ~/Notes directly in the browser.

## Current State Analysis

**Notes Structure:**
- Location: `~/Notes` (Obsidian vault)
- Count: 332 markdown files (top-level)
- Size: 207 MB total
- Subdirectories: `.obsidian/`, `export/`, `Excalidraw/`, etc.
- File types: `.md`, `.pdf`, `.excalidraw.md`
- Naming patterns: Dates, UUIDs, descriptive names

## Feature Requirements

### Must Have (MVP)
1. **Browse notes** - List all markdown files with metadata
2. **Search notes** - Full-text search (filenames + content)
3. **View notes** - Render markdown with syntax highlighting
4. **Edit notes** - Live markdown editor with preview
5. **Create notes** - New note creation
6. **File info** - Show file size, modified date, word count

### Should Have (Phase 2)
1. **Folder navigation** - Browse subdirectories
2. **Delete notes** - Safe deletion with confirmation
3. **Rename notes** - Rename files
4. **Tags support** - View/filter by tags
5. **Recent files** - Quick access to recently modified
6. **Favorites** - Star important notes

### Nice to Have (Phase 3)
1. **Drag & drop upload** - Upload markdown/images
2. **Export notes** - Download as markdown/PDF
3. **Version history** - View file changes over time
4. **Collaborative editing** - Real-time sync (future)
5. **Mobile responsive** - Touch-friendly interface
6. **Keyboard shortcuts** - Power user features

## UI/UX Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  ARDEN Header                          [Search] [User]  │
├──────────────┬──────────────────────────────────────────┤
│              │                                           │
│  Sidebar     │  Main Content Area                       │
│              │                                           │
│  • Chat      │  ┌─────────────────────────────────┐    │
│  • Notes ←   │  │  Notes Browser / Editor         │    │
│  • Status    │  │                                 │    │
│              │  │  [List View / Edit View]        │    │
│              │  │                                 │    │
│              │  └─────────────────────────────────┘    │
│              │                                           │
└──────────────┴──────────────────────────────────────────┘
```

### Notes Browser View

```
┌─────────────────────────────────────────────────────────┐
│  Notes                                     [+ New Note]  │
├─────────────────────────────────────────────────────────┤
│  [Search notes...]              [Sort: Modified ▼]      │
│                                                          │
│  Filters: [All] [Recent] [Favorites] [Tags]             │
├─────────────────────────────────────────────────────────┤
│  📄 profile.md                          Modified: Today  │
│     Your user profile and ARDEN context     234 words   │
│                                                          │
│  📄 todo.md                          Modified: Today     │
│     Consolidated TODO list from all notes   1,234 words │
│                                                          │
│  📄 2026-01-02-project-notes.md     Modified: Today     │
│     Project planning and architecture       567 words   │
│                                                          │
│  📄 Camera Compliance Plans.md      Modified: Oct 30    │
│     Equinix data center camera setup        421 words   │
│                                                          │
│  [Load More...]                                          │
└─────────────────────────────────────────────────────────┘
```

### Note Editor View

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Notes                         [Save] [Delete]│
├─────────────────────────────────────────────────────────┤
│  profile.md                      Modified: 2 hours ago   │
│  Location: ~/Notes/profile.md          Size: 4.2 KB     │
├─────────────────────────────────────────────────────────┤
│  [Edit] [Preview] [Split View]                          │
│                                                          │
│  ┌────────────────────┬────────────────────────────┐   │
│  │  # User Profile    │  User Profile              │   │
│  │                    │                             │   │
│  │  ## Personal Info  │  Personal Information      │   │
│  │  - Name: Hal       │  • Name: Hal Borland       │   │
│  │  - Role: Engineer  │  • Role: Strategic Engineer│   │
│  │                    │                             │   │
│  │  (Markdown editor) │  (Live preview)            │   │
│  │                    │                             │   │
│  └────────────────────┴────────────────────────────┘   │
│                                                          │
│  Words: 234  Characters: 1,234  Lines: 45               │
└─────────────────────────────────────────────────────────┘
```

## Technical Architecture

### Backend API Routes

**File: `api/routes/notes.js`**

```javascript
// Notes management routes
GET    /api/notes              // List all notes (paginated)
GET    /api/notes/search       // Search notes (query param)
GET    /api/notes/:filename    // Get single note content
POST   /api/notes              // Create new note
PUT    /api/notes/:filename    // Update note content
DELETE /api/notes/:filename    // Delete note
GET    /api/notes/stats        // Get statistics (count, size, etc.)
GET    /api/notes/recent       // Get recently modified notes
```

**Query Parameters:**
- `?limit=50` - Pagination limit
- `?offset=0` - Pagination offset
- `?sort=modified|name|size` - Sort order
- `?filter=recent|favorites|tag:xxx` - Filtering
- `?query=search+term` - Full-text search

### Frontend Components

**File: `web/notes.html`**
- New page for notes management
- Accessible from dashboard sidebar

**File: `web/assets/js/notes.js`**
- Notes browser logic
- Search functionality
- File operations (CRUD)
- Markdown rendering

### Data Flow

```
User Action → Frontend (notes.js)
    ↓
API Request → Backend (routes/notes.js)
    ↓
File System Operations → ~/Notes/*.md
    ↓
Response → Frontend
    ↓
UI Update → Rendered Content
```

### Search Strategy

**Two-tier search:**
1. **Fast search** - Filename matching (instant)
2. **Full-text search** - Content scanning (debounced)

**Implementation:**
```javascript
// Fast: grep for filenames
find ~/Notes -iname "*query*"

// Full-text: ripgrep for content
rg -i "query" ~/Notes --type md
```

### Markdown Rendering

**Libraries to use:**
- **marked.js** - Markdown to HTML conversion
- **highlight.js** - Code syntax highlighting
- **DOMPurify** - XSS protection

**Features:**
- GitHub-flavored markdown
- Syntax highlighting
- Task lists `- [ ]` support
- Tables
- Links (internal/external)

### Editor Implementation

**Options:**

**Option 1: Simple Textarea (MVP)**
- Pros: Simple, fast, no dependencies
- Cons: No syntax highlighting, basic features
- Good for: MVP/Phase 1

**Option 2: CodeMirror 6**
- Pros: Powerful, markdown mode, syntax highlighting
- Cons: Larger bundle size, more complex
- Good for: Phase 2

**Option 3: Monaco Editor**
- Pros: VSCode-like experience, excellent features
- Cons: Very large bundle size
- Good for: Future enhancement

**Recommendation:** Start with Option 1, upgrade to Option 2 in Phase 2

## File Structure

```
ARDEN/
├── api/
│   ├── routes/
│   │   └── notes.js              # NEW: Notes API routes
│   ├── services/
│   │   └── notes-service.js      # NEW: Notes business logic
│   └── utils/
│       └── markdown-utils.js     # NEW: Markdown helpers
│
├── web/
│   ├── notes.html                # NEW: Notes browser page
│   └── assets/
│       ├── js/
│       │   └── notes.js          # NEW: Notes frontend logic
│       └── css/
│           └── notes.css         # NEW: Notes styling
│
└── docs/
    └── NOTES_FEATURE.md          # This document
```

## Implementation Phases

### Phase 1: MVP (2-3 hours)
**Goal:** Basic view and edit functionality

**Tasks:**
1. Create `/api/notes` routes (list, get, update)
2. Build notes browser UI (list view)
3. Implement simple text editor
4. Add markdown preview (marked.js)
5. Basic search (filename only)

**Deliverables:**
- Browse all notes
- View note content
- Edit and save notes
- Simple search by filename

### Phase 2: Enhanced Features (2-3 hours)
**Goal:** Better UX and search

**Tasks:**
1. Full-text search with ripgrep
2. Create new notes
3. Delete notes (with confirmation)
4. Better markdown editor (CodeMirror)
5. File metadata (size, date, word count)
6. Folder navigation

**Deliverables:**
- Full-text search
- CRUD operations
- Better editor experience
- Navigate subdirectories

### Phase 3: Polish (1-2 hours)
**Goal:** Professional finish

**Tasks:**
1. Favorites/tags
2. Recent files
3. Keyboard shortcuts
4. Mobile responsive
5. Loading states
6. Error handling

**Deliverables:**
- Production-ready UI
- Mobile-friendly
- Power user features

## Security Considerations

1. **Path Traversal Prevention**
   - Validate filenames (no `../`)
   - Restrict to `~/Notes` directory
   - Sanitize user input

2. **XSS Protection**
   - Use DOMPurify for markdown rendering
   - Escape HTML in filenames
   - CSP headers

3. **File Size Limits**
   - Max file size: 10MB per note
   - Warn on large files
   - Pagination for large lists

4. **Authentication**
   - Require login (existing auth)
   - Session validation
   - CSRF protection

## Performance Considerations

1. **Pagination**
   - Load 50 notes at a time
   - Infinite scroll or "Load More"
   - Cache results

2. **Search Optimization**
   - Debounce search input (300ms)
   - Cancel previous searches
   - Index frequently searched terms

3. **File Loading**
   - Lazy load note content
   - Stream large files
   - Cache rendered markdown

4. **Frontend Optimization**
   - Virtual scrolling for long lists
   - Code splitting
   - Lazy load editor libraries

## Database Integration

**Optional Enhancement:** Store metadata in SQLite

**Table: `note_metadata`**
```sql
CREATE TABLE note_metadata (
  filename TEXT PRIMARY KEY,
  title TEXT,
  word_count INTEGER,
  character_count INTEGER,
  last_indexed INTEGER,
  tags TEXT,
  favorite INTEGER DEFAULT 0,
  last_opened INTEGER
);
```

**Benefits:**
- Fast search without scanning files
- Track favorites and recent files
- Analytics and statistics

**Implementation:** Phase 3 optional

## Testing Strategy

**Manual Testing:**
1. Browse notes - verify all files load
2. Search - test various queries
3. Edit - make changes and save
4. Create - new note creation
5. Delete - remove notes safely
6. Large files - test with big markdown files
7. Special characters - filenames with spaces, etc.

**Edge Cases:**
- Empty notes
- Very large notes (>1MB)
- Binary files (PDFs, images)
- Corrupted markdown
- Concurrent edits
- Network failures

## Error Handling

**User-Friendly Messages:**
- "Note not found" - 404 errors
- "Failed to save" - Write errors
- "Search timeout" - Long searches
- "File too large" - Size limits

**Graceful Degradation:**
- Offline mode (future)
- Auto-save drafts
- Conflict resolution
- Backup on delete

## Accessibility

**ARIA Labels:**
- Screen reader support
- Keyboard navigation
- Focus management
- Skip links

**Standards:**
- WCAG 2.1 AA compliance
- Semantic HTML
- Alt text for icons

## Success Metrics

**Phase 1 Success:**
- ✅ Can browse all 332 notes
- ✅ Can edit and save any note
- ✅ Can search by filename
- ✅ Markdown renders correctly

**Phase 2 Success:**
- ✅ Full-text search works
- ✅ Can create/delete notes
- ✅ Editor has syntax highlighting
- ✅ Folders navigable

**Phase 3 Success:**
- ✅ Mobile responsive
- ✅ Fast performance (<500ms loads)
- ✅ Zero data loss
- ✅ User loves it!

## Dependencies

**Backend:**
- `marked` - Markdown parser (already installed)
- No new dependencies needed

**Frontend:**
- `marked.js` - Markdown to HTML (~50KB)
- `highlight.js` - Syntax highlighting (~100KB)
- `DOMPurify` - XSS protection (~45KB)
- Optional: `codemirror` - Better editor (~200KB)

**Total Size:** ~200KB (MVP), ~400KB (Full)

## Timeline Estimate

**MVP (Phase 1):** 2-3 hours
- Backend routes: 1 hour
- Frontend UI: 1 hour
- Integration/testing: 30 minutes

**Enhanced (Phase 2):** 2-3 hours
- Search: 1 hour
- CRUD: 1 hour
- Polish: 30 minutes

**Production Ready (Phase 3):** 1-2 hours
- Responsive design: 45 minutes
- Error handling: 30 minutes
- Final testing: 30 minutes

**Total:** 5-8 hours for complete implementation

## Next Steps

**Immediate:**
1. Review and approve this plan
2. Decide on MVP vs full implementation
3. Choose editor approach (simple vs CodeMirror)
4. Start with Phase 1 backend routes

**Questions to Answer:**
1. Do you want folder/subdirectory support in MVP?
2. Should we exclude `.obsidian/` and other hidden folders?
3. Do you want to edit PDFs/Excalidraw files, or markdown only?
4. Preferred sort order (modified date, name, size)?
5. Should deleted files go to trash or permanent delete?

**Ready to start implementation when you give the go-ahead!**

---
*Plan created: 2026-01-02*
*Estimated completion: MVP in 2-3 hours, Full feature in 5-8 hours*
