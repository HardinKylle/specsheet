# SpecSheet — Material Selection Schedules

Prototype of an interactive design/selection tool for a residential contractor:
fill out a project intake form, generate a print-ready **Finish & Fixture
Selection Schedule** (PDF), send the client a link to make their selections
online, and edit the material catalog without touching code.

Built with Vite + React 18 and plain CSS. Supabase is the storage layer:
the contractor's workspace (projects, catalog, branding) plus published client
links and submissions all live there, with localStorage acting as a cache. The
static bundle can be hosted on any URL, including a Squarespace-linked
subdomain.

## Features

- **Projects dashboard** — every job in one place with per-project progress
  (specified / chosen by client / open), duplicate-as-template, delete.
- **Your business** — company name, contact line, and logo, shown in the app
  header and printed on every schedule.
- **Product photos** — catalog options accept photo uploads (auto-compressed);
  photos show in the form, the client view, and the printed schedule.
- **Client round-trip** — the client confirms and their choices are stored as a
  submission; the contractor pulls them in from the sheet (or the dashboard
  auto-syncs on load) and they're marked ◆ client selected on the schedule.
- **Intake** — sections organized by CSI MasterFormat division (Div 01 project
  info, Div 22 bathrooms, Div 12 kitchen, Div 09 finishes). "Number of
  bathrooms" spawns a per-bathroom question set. Conditional questions (tub
  size/photo only appear when a tub is chosen) and photo upload for fixtures.
- **Selection sheet** — anything the contractor specifies prints as ● SPECIFIED;
  anything left blank prints all options with ○ checkboxes and a
  "client to select" flag. Print / Save PDF uses the browser's print engine
  with a dedicated print stylesheet. Signature + date lines included.
- **Client link** — "Send to client" publishes the project and copies a short
  link (`#/client?id=<uuid>`). The client sees only their open selections on
  any device, taps choices, and confirms.
- **First-run onboarding** — a sample project and a dismissible "General Notes —
  How This Works" panel are seeded on first visit.
- **Catalog** — rename questions, add/remove options and questions, edit
  swatches (any CSS color or gradient). Changes persist and apply to every
  future sheet.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle -> dist/
```

A sample generated PDF and screenshots are in `docs/`.

## Storage (Supabase)

The database schema lives in `supabase/schema.sql` (run it in the SQL editor
when setting up a new Supabase project). Tables are locked down (RLS, no
policies) — all access goes through `security definer` RPCs. Contractor
operations authenticate with per-resource secrets: a `write_key` per published
project, and a workspace `(id, key)` pair for the project store.

**Workspaces:** each browser creates (or connects to) a workspace row that
holds the contractor's full state — projects, catalog, settings. Changes
autosave (debounced) after edits. The sync code shown under Catalog → Your
business → Device sync loads the same workspace on another device or after
clearing the browser. Until real auth lands, that code is the account —
losing it means losing cloud access to those projects.

## Production notes

Remaining for a production build: contractor auth (the prototype trusts the
contractor's browser), emailing the client their link automatically, and
storing option photos in object storage instead of inline data URLs.
