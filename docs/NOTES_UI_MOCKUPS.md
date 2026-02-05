# Notes Management - UI Mockups

## Dashboard with Notes Menu

```
┌─────────────────────────────────────────────────────────────────────┐
│  ARDEN - Your Second Brain Assistant                    [Hal ▼]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌─────────────────────────────────────────────┐ │
│  │              │  │                                              │ │
│  │  📱 Chat     │  │   Welcome back, Hal!                        │ │
│  │              │  │                                              │ │
│  │  📝 Notes ←  │  │   • 332 notes in your vault                 │ │
│  │              │  │   • 12 conversations this session           │ │
│  │  📊 Status   │  │   • AI: llama3.2 (running)                  │ │
│  │              │  │                                              │ │
│  │  ⚙️  Settings│  │   Quick Actions:                            │ │
│  │              │  │   [New Note]  [Search Notes]  [View TODOs]  │ │
│  │              │  │                                              │ │
│  └──────────────┘  └─────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Notes Browser - List View

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Dashboard          Notes                              [+ New Note]    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 🔍 Search your notes...                      Sort: Modified ▼       │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  Showing 332 notes  •  207 MB                                            │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ Filters:  [All]  [Recent]  [Favorites]  [By Folder ▼]               │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 📄  profile.md                                     Modified: Today   │ │
│  │     User profile and ARDEN context                                  │ │
│  │     234 words  •  1.2 KB  •  ~/Notes/                              │ │
│  │     [Open]  [Edit]  [⭐]                                            │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 📄  todo.md                                        Modified: Today   │ │
│  │     Consolidated TODO list from all notes                           │ │
│  │     1,234 words  •  12.4 KB  •  ~/Notes/                           │ │
│  │     [Open]  [Edit]  [⭐]                                            │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 📄  2026-01-02-testing-user-context.md            Modified: Today   │ │
│  │     Testing user context integration                                │ │
│  │     15 words  •  0.2 KB  •  ~/Notes/                               │ │
│  │     [Open]  [Edit]  [⭐]                                            │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 📄  Camera Compliance Plans.md                    Modified: Oct 30  │ │
│  │     Equinix data center camera setup and compliance                │ │
│  │     421 words  •  4.5 KB  •  ~/Notes/                              │ │
│  │     [Open]  [Edit]  [⭐]                                            │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  [Load More (50 of 332)]                                                 │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

## Note Viewer - Read-Only Mode

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Back to Notes                                   [Edit]  [Delete]  [⭐]│
├──────────────────────────────────────────────────────────────────────────┤
│  📄 profile.md                                                           │
│  ~/Notes/profile.md  •  Modified: 2 hours ago  •  Size: 4.2 KB          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                     │ │
│  │  User Profile - Hal Borland                                        │ │
│  │  ═══════════════════════════════════════                           │ │
│  │                                                                     │ │
│  │  Personal Information                                              │ │
│  │  ────────────────────────────────────────                          │ │
│  │  • Name: Hal Borland                                              │ │
│  │  • Role: Strategic Engineer of Infrastructure                     │ │
│  │  • Company: FedEx Freight                                         │ │
│  │  • Location: Based in Chicago area                                │ │
│  │                                                                     │ │
│  │  Professional Focus                                                │ │
│  │  ────────────────────────────────────────                          │ │
│  │  • Technical Architecture: Infrastructure design                  │ │
│  │  • Technologies:                                                   │ │
│  │    - Kubernetes (K3S clusters)                                    │ │
│  │    - VMware virtualization                                        │ │
│  │    - Azure cloud services                                         │ │
│  │    - Linux systems (Arch Linux user)                              │ │
│  │                                                                     │ │
│  │  (Markdown rendered with syntax highlighting)                     │ │
│  │                                                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  234 words  •  1,234 characters  •  45 lines                             │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

## Note Editor - Edit Mode

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Cancel                                           [Save]  [Save & Close]│
├──────────────────────────────────────────────────────────────────────────┤
│  Editing: profile.md                              Last saved: 2 min ago  │
│  ~/Notes/profile.md                                                      │
├──────────────────────────────────────────────────────────────────────────┤
│  View: [✓ Edit] [ Preview] [ Split]                                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌───────────────────────────────┬────────────────────────────────────┐ │
│  │                               │                                     │ │
│  │  # User Profile - Hal Borland │  User Profile - Hal Borland        │ │
│  │                               │  ═══════════════════════════════   │ │
│  │  ## Personal Information      │                                     │ │
│  │  - **Name**: Hal Borland      │  Personal Information              │ │
│  │  - **Role**: Strategic Eng... │  ───────────────────────────────   │ │
│  │  - **Company**: FedEx Freight │  • Name: Hal Borland              │ │
│  │  - **Location**: Chicago area │  • Role: Strategic Engineer...    │ │
│  │                               │  • Company: FedEx Freight          │ │
│  │  ## Professional Focus        │  • Location: Chicago area          │ │
│  │  - **Technical Architecture** │                                     │ │
│  │    Infrastructure design      │  Professional Focus                │ │
│  │  - **Technologies**:          │  ───────────────────────────────   │ │
│  │    - Kubernetes (K3S)         │  • Technical Architecture:         │ │
│  │    - VMware virtualization    │    Infrastructure design           │ │
│  │    - Azure cloud services     │  • Technologies:                   │ │
│  │    - Linux systems            │    - Kubernetes (K3S clusters)    │ │
│  │                               │    - VMware virtualization         │ │
│  │  (Markdown editor with        │  (Live preview)                    │ │
│  │   syntax highlighting)        │                                     │ │
│  │                               │                                     │ │
│  └───────────────────────────────┴────────────────────────────────────┘ │
│                                                                           │
│  Line 15, Column 23  •  234 words  •  1,234 characters  •  Unsaved *    │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

## Search Results View

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Back to Notes                                                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 🔍 kubernetes infrastructure                         [×] Clear       │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  Found 12 results in 0.08 seconds                                        │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 📄  profile.md                                     Modified: Today   │ │
│  │     ...Technologies: Kubernetes (K3S clusters), VMware              │ │
│  │     virtualization, Azure cloud services, Linux systems...          │ │
│  │     Matches: 2 in content, 0 in filename                            │ │
│  │     [Open]                                                           │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 📄  k8s-cluster-setup.md                          Modified: Dec 15  │ │
│  │     ...setting up a Kubernetes cluster for development and          │ │
│  │     testing infrastructure projects. Using K3S for lightweight...   │ │
│  │     Matches: 5 in content, 1 in filename                            │ │
│  │     [Open]                                                           │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 📄  infrastructure-notes.md                       Modified: Nov 20  │ │
│  │     ...our infrastructure architecture includes multiple            │ │
│  │     Kubernetes clusters running production workloads across...      │ │
│  │     Matches: 8 in content, 1 in filename                            │ │
│  │     [Open]                                                           │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  [Show more results...]                                                  │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

## Create New Note Dialog

```
┌─────────────────────────────────────────────────────────────┐
│  Create New Note                                     [×]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Note Title                                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ My New Note                                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Filename: 2026-01-02-my-new-note.md                        │
│                                                              │
│  Location                                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ~/Notes/                                         ▼     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Template (optional)                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ None                                             ▼     │ │
│  │   • None                                               │ │
│  │   • Quick Note                                         │ │
│  │   • Meeting Note                                       │ │
│  │   • Daily Note                                         │ │
│  │   • Project Note                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Initial Content                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ # My New Note                                          │ │
│  │                                                         │ │
│  │                                                         │ │
│  │                                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│               [Cancel]              [Create & Edit]         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Mobile Responsive View

```
┌──────────────────────┐
│  ☰  Notes      [🔍]  │
├──────────────────────┤
│                      │
│  [+ New Note]        │
│                      │
│  ┌──────────────────┐│
│  │ 📄 profile.md    ││
│  │ User profile...  ││
│  │ Modified: Today  ││
│  │ 234 words        ││
│  └──────────────────┘│
│                      │
│  ┌──────────────────┐│
│  │ 📄 todo.md       ││
│  │ TODO list...     ││
│  │ Modified: Today  ││
│  │ 1,234 words      ││
│  └──────────────────┘│
│                      │
│  ┌──────────────────┐│
│  │ 📄 Camera...     ││
│  │ Compliance...    ││
│  │ Modified: Oct 30 ││
│  │ 421 words        ││
│  └──────────────────┘│
│                      │
│  [Load More...]      │
│                      │
└──────────────────────┘
```

## Color Scheme

**Light Mode:**
- Background: #FFFFFF
- Sidebar: #F5F5F5
- Text: #333333
- Accent: #4A90E2 (blue)
- Success: #27AE60 (green)
- Warning: #F39C12 (orange)
- Danger: #E74C3C (red)

**Dark Mode (future):**
- Background: #1E1E1E
- Sidebar: #252526
- Text: #CCCCCC
- Accent: #569CD6
- Code: #D4D4D4

## Icons

- 📄 Note file
- 📁 Folder
- 🔍 Search
- ⭐ Favorite
- ✏️ Edit
- 💾 Save
- 🗑️ Delete
- ⚙️ Settings
- ← Back arrow
- × Close

## Keyboard Shortcuts

- `Ctrl/Cmd + S` - Save note
- `Ctrl/Cmd + F` - Search
- `Ctrl/Cmd + N` - New note
- `Ctrl/Cmd + K` - Quick search
- `Escape` - Close dialog/Cancel
- `Ctrl/Cmd + ,` - Settings

## Loading States

```
┌─────────────────────────────────┐
│  Loading notes...               │
│                                  │
│  ┌────────────────────────────┐ │
│  │ ▓▓▓▓▓▓▓▓▓░░░░░░░░░  45%   │ │
│  └────────────────────────────┘ │
│                                  │
└─────────────────────────────────┘
```

## Error States

```
┌─────────────────────────────────────┐
│  ⚠️  Unable to load notes            │
│                                      │
│  The notes directory is unavailable. │
│                                      │
│  [Retry]  [Report Issue]             │
│                                      │
└─────────────────────────────────────┘
```

---
*UI Mockups created: 2026-01-02*
*Ready for implementation approval*
