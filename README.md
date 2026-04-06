# Snippets

A clean, minimal, local-first markdown note editor built with Electron and Vue 3. Notes are stored as plain `.md` files in a folder you choose — no accounts, no sync, no cloud.

## Features

- **Tabbed editing** — open multiple notes at once, Chrome-style tabs
- **Slash commands** — type `/` anywhere in a note to insert headings, lists, code blocks, task lists, images, and more
- **Auto-save** — saves 600ms after you stop typing; filenames update automatically from the first `# H1` heading
- **Task lists** — interactive checkboxes with animated strikethrough
- **Image support** — drag-and-drop or insert via `/Image`
- **Local only** — all data stays on your machine in plain Markdown files

> **Note:** Snippets is developed and tested on macOS only. Windows and Linux builds are provided as-is and have not been tested.

## Requirements

- Node.js 18+
- npm

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build:mac
npm run build:win
npm run build:linux
```

## Other scripts

```bash
npm run typecheck   # TypeScript check (main + renderer)
npm run lint        # ESLint
npm run format      # Prettier
```

## Storage

- **Notes** — plain `.md` files in the folder you select during onboarding
- **Config** — `config.json` in the OS user data directory:
  - macOS: `~/Library/Application Support/<app-name>/config.json`
  - Windows: `%APPDATA%\<app-name>\config.json`
  - Linux: `~/.config/<app-name>/config.json`

You can change the notes folder or re-run onboarding at any time from the sidebar footer.

## Tech stack

- [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/)
- [Vue 3](https://vuejs.org/) + TypeScript
- [Tiptap](https://tiptap.dev/) (ProseMirror-based rich text editor)
- [tiptap-markdown](https://github.com/aguingand/tiptap-markdown) — serializes editor content to Markdown
- [Lucide](https://lucide.dev/) icons
