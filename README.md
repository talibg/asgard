TypeSnip (asgard)
=================

TypeSnip is a private, local TypeScript snippet manager that runs entirely in your browser. No accounts, no servers, no tracking — your snippets live in your device’s IndexedDB.

- Website: https://typesnip.com
- App name: TypeSnip
- Repo name: asgard

Why TypeSnip
- Offline‑first: works with no internet.
- Private by design: nothing is uploaded or shared.
- Instant: quick search, edit, and copy.
- Persistent: stored in the browser until you delete them.
- Installable: PWA for desktop/home screen.

Features
- Snippet CRUD with title, tags, and TS/TSX code
- Fast search and sort (date/name)
- CodeMirror editor with One Dark in dark mode
- Keyboard shortcuts: search (Cmd/Ctrl+K), new (Cmd/Ctrl+Alt+N), save (Cmd/Ctrl+S)
- Export/Import JSON; delete database from Settings
- Light/Dark themes via next-themes
- Shadcn UI components, Tailwind v4 (zero-config)

Local‑only Architecture
- Data store: IndexedDB (via `idb`) under a single object store (`snippets`).
- No servers or accounts; removing site data or uninstalling the PWA erases snippets.

Tech Stack
- Next.js App Router (Next 16), React, TypeScript (strict)
- Tailwind CSS v4, shadcn/ui
- next-themes, sonner, CodeMirror 6
- Biome for formatting/linting

Conventions
- Filenames: all `.ts`/`.tsx` files use kebab-case (e.g., `snippet-editor.tsx`).
- Imports: always use the alias form `@/path/to/file` (no relative imports).

Project Structure
- `app/` — routes, root layout, pages
- `components/` — app components (kebab-case), UI primitives in `components/ui/`
- `lib/` — data access (`lib/idb.ts`)
- `public/` — PWA assets (`manifest.webmanifest`, `sw.js`)

Development
1) Install deps
- `pnpm install`

2) Run dev server
- `pnpm dev` → http://localhost:3000

3) Build & start
- `pnpm build`
- `pnpm start`

4) Type checks & lint
- TypeScript: `pnpm exec tsc --noEmit`
- Lint (Biome): `pnpm lint`
  - In some environments, Biome’s wrapper can fail. As a workaround, call the platform binary directly:
    `node_modules/.pnpm/@biomejs+cli-linux-x64@*/node_modules/@biomejs/cli-linux-x64/biome check --write`

PWA Notes
- Service worker: `public/sw.js` (registered in the client provider). Enabled in production builds.
- Manifest: `public/manifest.webmanifest` (installable on desktop/mobile).

Contributing
- Issues and discussions welcome. Please follow the filename/import conventions above.

Security & Privacy
- TypeSnip never transmits your snippets. Everything stays on your device unless you export JSON yourself.

Links
- Website: https://typesnip.com
- Terms: https://typesnip.com/terms
- About: https://typesnip.com/about
