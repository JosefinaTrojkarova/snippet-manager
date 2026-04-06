# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (Electron + Vite HMR)
npm run build        # Typecheck + production build
npm run lint         # ESLint with cache
npm run format       # Prettier formatting
npm run typecheck    # TypeScript check (both main and renderer)

# Platform builds
npm run build:mac
npm run build:win
npm run build:linux
```

There are no tests configured.

## Architecture

Electron app with three processes:

**Main process** (`src/main/index.ts`) — handles all file system operations and window lifecycle. Persists user config (selected notes folder) to `app.getPath('userData')/config.json`. All note I/O goes through IPC handlers here.

**Preload** (`src/preload/index.ts`) — context bridge exposing typed IPC APIs to the renderer: `getConfig/saveConfig`, `selectFolder`, `getNotes/saveNote/renameNote/deleteNote`.

**Renderer** (`src/renderer/`) — Vue 3 + TypeScript SPA. Path alias `@renderer/*` maps to `src/renderer/src/*`.

### Key renderer components

- `App.vue` — routes between `OnboardingSetup` (first run, folder selection) and `MainWindow`
- `MainWindow.vue` — the entire editor UI: sidebar note list, tabbed interface, Tiptap editor, auto-save (600ms debounce), auto-rename based on first `# H1` heading
- `extensions/slashCommand/` — custom Tiptap extension implementing `/` command palette (headings, lists, code blocks, task lists) with Tippy.js popup

### IPC channels

| Channel | Direction | Purpose |
|---|---|---|
| `get-config` / `save-config` | renderer → main | Read/write app config |
| `select-folder` | renderer → main | Open folder picker dialog |
| `get-notes` | renderer → main | List all `.md` files in notes folder |
| `save-note` / `rename-note` / `delete-note` | renderer → main | File operations |

Notes are stored as plain `.md` files in the user-selected folder.
