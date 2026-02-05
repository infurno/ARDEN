# ARDEN Notes Editor - Advanced Features

**Last Updated:** January 3, 2026

## Overview

The ARDEN notes editor has been upgraded with CodeMirror, providing a professional code-editor experience with Vim mode support and advanced editing features.

---

## ✨ New Features

### 🎯 Vim Mode

Full Vim keybindings support with visual mode indicator:

**Enable Vim Mode:**
1. Click the ⚙️ settings icon in the editor toolbar
2. Check "Vim Mode"
3. Start using Vim keybindings immediately!

**Vim Mode Indicator:**
- Visual indicator in bottom-right corner shows current mode
- **NORMAL** mode (blue) - Command mode
- **INSERT** mode (green) - Insert text
- **VISUAL** mode (purple) - Visual selection

**Supported Vim Commands:**
- Navigation: `h`, `j`, `k`, `l`
- Modes: `i`, `a`, `o`, `O`, `v`, `Esc`
- Deletion: `dd`, `dw`, `d$`, `x`
- Yanking: `yy`, `yw`, `y$`
- Pasting: `p`, `P`
- Undo/Redo: `u`, `Ctrl-r`
- Search: `/`, `n`, `N`
- And many more standard Vim commands!

### 📝 Enhanced Editor Features

**Line Numbers**
- Toggle line numbers on/off
- Default: Enabled

**Line Wrapping**
- Wrap long lines or use horizontal scrolling
- Default: Enabled

**Highlight Active Line**
- Visual indicator of current cursor line
- Default: Enabled

**Auto-close Brackets**
- Automatically close brackets and quotes
- Default: Disabled

### ⚙️ Editor Settings

Access editor settings via the ⚙️ icon in the toolbar:

- **Vim Mode** - Enable/disable Vim keybindings
- **Line Numbers** - Show/hide line numbers
- **Line Wrapping** - Wrap long lines
- **Highlight Active Line** - Highlight cursor line
- **Auto-close Brackets** - Auto-close brackets and quotes

All settings are automatically saved to browser localStorage and persist across sessions.

---

## 🎨 Tokyo Night Theme Integration

The editor now uses custom Tokyo Night styling to match the rest of the ARDEN interface:

**Dark Mode (Default):**
- Background: `#1a1b26` (Tokyo Night Storm)
- Text: `#c0caf5` (Light blue-gray)
- Gutters: `#16161e` (Darker background)
- Line numbers: `#565f89` (Muted blue)
- Active line: `#1f2335` (Subtle highlight)
- Selection: `#283457` (Blue highlight)

**Light Mode:**
- Background: White
- Text: Dark blue-gray
- Clean, readable light theme

---

## ⌨️ Keyboard Shortcuts

### Standard Mode

- **Ctrl/Cmd + S** - Save note
- **Ctrl + F** - Search in document
- **Ctrl + H** - Find and replace
- **Tab** - Indent selection
- **Shift + Tab** - Unindent selection

### Vim Mode

When Vim mode is enabled, all standard Vim shortcuts work:

- **Normal Mode:**
  - `gg` - Go to start of document
  - `G` - Go to end of document
  - `0` - Go to start of line
  - `$` - Go to end of line
  - `w` - Next word
  - `b` - Previous word
  - `:%s/find/replace/g` - Find and replace

- **Insert Mode:**
  - `Esc` - Return to normal mode
  - Standard typing and editing

- **Visual Mode:**
  - `v` - Character-wise visual
  - `V` - Line-wise visual
  - `Ctrl-v` - Block-wise visual

---

## 🔧 Technical Details

### CodeMirror Version

- **Version:** 5.65.16
- **Mode:** Markdown
- **Addons:**
  - Vim keymap
  - Continue list (auto-continue markdown lists)
  - Active line highlighting
  - Placeholder text
  - Search and dialog

### Markdown Features

- **Syntax highlighting** for Markdown
- **Auto-continue lists** - Press Enter in a list and it continues
- **Smart indentation** - Maintains indentation levels
- **Wiki-style links** - `[[Link]]` support
- **Code blocks** - Syntax highlighting in preview

### Performance

- Efficient rendering for large documents
- Smooth scrolling and editing
- Minimal lag on typing
- Auto-save after 2 seconds of inactivity

---

## 📖 Usage Examples

### Example 1: Enable Vim Mode

1. Open any note
2. Click ⚙️ in toolbar
3. Check "Vim Mode"
4. Press `Esc` to enter Normal mode
5. Use `h`, `j`, `k`, `l` to navigate
6. Press `i` to enter Insert mode and start typing

### Example 2: Search and Replace (Vim)

1. Press `Esc` to enter Normal mode
2. Type `:%s/old text/new text/g`
3. Press Enter to replace all occurrences

### Example 3: Quick Navigation (Vim)

- `gg` - Jump to top of document
- `G` - Jump to bottom
- `/search term` - Search forward
- `n` - Next match
- `N` - Previous match

### Example 4: Delete Lines (Vim)

- `dd` - Delete current line
- `3dd` - Delete 3 lines
- `d$` - Delete from cursor to end of line
- `dw` - Delete word

---

## 🐛 Known Limitations

1. **Vim Mode Complexity** - Some advanced Vim features may not be available
2. **Mobile Support** - Vim mode works best on desktop with physical keyboard
3. **Theme Switching** - Light/dark mode requires page reload to apply to CodeMirror

---

## 🔮 Future Enhancements

Potential improvements:

- [ ] Custom Vim command mappings
- [ ] Emacs keybinding support
- [ ] Multiple cursor support
- [ ] Advanced autocomplete for markdown
- [ ] Spell checking integration
- [ ] Grammar checking
- [ ] Markdown table editor
- [ ] Diagram support (Mermaid, PlantUML)
- [ ] LaTeX math support
- [ ] Export to PDF with syntax highlighting

---

## 📚 Resources

### Vim Cheat Sheet

- [Vim Cheat Sheet](https://vim.rtorr.com/)
- [Interactive Vim Tutorial](https://www.openvim.com/)

### CodeMirror Documentation

- [CodeMirror Manual](https://codemirror.net/5/doc/manual.html)
- [Vim Mode Documentation](https://codemirror.net/5/demo/vim.html)

---

## 🎯 Quick Start Guide

### For Vim Users:

1. ⚙️ → Enable "Vim Mode"
2. Start editing with familiar Vim commands
3. Mode indicator shows current state
4. `Ctrl-S` works in any mode to save

### For Standard Editor Users:

1. Just start typing!
2. Use mouse and keyboard as normal
3. Ctrl/Cmd + S to save
4. Enjoy syntax highlighting and auto-save

---

**Maintained by:** ARDEN Development Team  
**Version:** 2.0.0  
**License:** MIT
