# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is the single source of truth for working in this repo. `AGENTS.md` points here.

## Commands

```bash
npm run dev      # Vite dev server (restart after changing .env.local — env is read at boot)
npm run build    # Production bundle -> dist/
npm run preview  # Serve the built bundle
npm test         # Node test runner (passing tests plus executable TODO regressions)
```

There is no linter. Tests use Node's built-in test runner and live under `test/`.
Run `npm test` and `npm run build` before reporting work complete, and visually
verify UI changes in a browser (Playwright screenshots work well — the app is
fully drivable headless).

## What this is

A material-selection tool for a residential contractor: fill out a project
intake, generate a print-ready "Finish & Fixture Selection Schedule" (PDF via
the browser print engine), send the client a link to make their selections
online, and edit the material catalog without code. Built as a job-application
prototype — polish and demo-readiness matter.

## Architecture

Vite + React 18, plain JS/JSX, one global stylesheet (`src/styles.css`) — no
TypeScript, no CSS framework, no router library. Routing is hash-based
(`#/projects`, `#/intake`, `#/sheet`, `#/catalog`, `#/client?id=…|?d=…`,
`#/apply?d=…`), parsed in `src/App.jsx`, which owns all app state (catalog,
projects map, active project id, settings) and passes it to the views in
`src/views/`.

**Data model** (`src/lib/model.js`): a `catalog` describes sections/questions/
options (sections carry CSI MasterFormat division numbers — this drives the
whole visual identity); a `project` holds `answers` (keyed
`answers[sectionId][questionId]`, or an array of room objects for repeatable
sections like bathrooms) plus `clientPicks` (keyed
`"sectionId.roomIndex.questionId"`). `resolveAnswer()` gives contractor answers
precedence over client picks; `openSelections()`/`progress()` derive everything
else. Questions support `showIf` conditional visibility and stable
division-based numbering (hidden questions keep their number).

**Storage** (`src/lib/store.js`): localStorage is a cache + credential store,
schema-versioned — bump `SCHEMA_VERSION` on incompatible shape changes and
stale data is wiped on load. First run seeds a sample project
(`src/data/sampleProject.js`) exactly once. Secrets kept here: per-project
`share.write_key` and the workspace `(id, key)` creds.

**Cloud** (`src/lib/cloud.js` + `supabase/schema.sql`): Supabase is the source
of truth. Tables are locked (RLS enabled, zero policies, direct grants
revoked) — ALL access goes through `security definer` RPCs: `share_project` /
`get_project` / `submit_selections` / `get_submissions` for the client-link
flow (write_key-gated on the contractor side; **never include `share` in any
client-readable payload**), and `create_workspace` / `load_workspace` /
`save_workspace` for the contractor's project store. `App.jsx` hydrates from
the workspace on boot, autosaves (debounced 800ms) on project/catalog/settings
changes, and exposes a sync code (Catalog → Your business) to connect other
devices. Schema changes must be applied to the live project AND kept in
`supabase/schema.sql`. Config via `VITE_SUPABASE_URL` /
`VITE_SUPABASE_ANON_KEY` in `.env.local` (untracked). **Without config the app
must keep working fully offline** via URL-encoded share links (`src/lib/link.js`
base64url-encodes the whole payload; images are stripped/size-capped). Check
`cloudEnabled` before any cloud path and always keep the offline fallback.

**Printing**: the PDF is the browser's print output of the sheet view —
`@media print` in `styles.css` hides app chrome and formats the schedule. Any
sheet change must be checked in print media too (Playwright:
`page.emulateMedia({media: "print"})` / `page.pdf()`).

**Images**: all uploads go through `compressImage()` (`src/lib/images.js`)
before storage — never store raw data URLs.

## Design language

The app is styled as a construction document: drawing-style title block header,
CSI division numbering, mono eyebrow labels, finish-schedule tables. Tokens in
`:root` — paper `#fbfbf9`, ink `#22262b`, blueprint `#28497c`, safety orange
`#e8541a` (accents/client-selected only). Type: Barlow Condensed (display,
uppercase), Public Sans (body), IBM Plex Mono (codes/labels). Markers are
semantic: ● contractor-specified, ◆ client-selected (orange), ○ open. Stay
inside this system; don't introduce new colors or fonts casually.

## Conventions

- Function components with hooks, one PascalCase file per view/component.
- Pure logic in `src/lib/`, static data in `src/data/`, views in `src/views/`.
- Explicit `.js`/`.jsx` extensions on relative imports.
- Conventional Commits (`feat:`, `fix:`, `style:`, `docs:`), granular commits,
  no Co-Authored-By trailers. Do not commit or push unless asked.
- Never commit `.env.local` or any Supabase keys/tokens.
