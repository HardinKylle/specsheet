# SpecSheet — Material Selection Schedules

Prototype of an interactive design/selection tool for a residential contractor:
fill out a project intake form, generate a print-ready **Finish & Fixture
Selection Schedule** (PDF), send the client a link to make their selections
online, and edit the material catalog without touching code.

Built with Vite + React 18 and plain CSS. No backend — everything runs in the
browser (localStorage + URL-encoded share links), so it can be hosted on any
static URL, including a Squarespace-linked subdomain.

## Features

- **Projects dashboard** — every job in one place with per-project progress
  (specified / chosen by client / open), duplicate-as-template, delete.
- **Your business** — company name, contact line, and logo, shown in the app
  header and printed on every schedule.
- **Product photos** — catalog options accept photo uploads (auto-compressed);
  photos show in the form, the client view, and the printed schedule.
- **Client round-trip** — the client's confirmation produces a link that, when
  the contractor opens it, merges their choices into the project — marked
  ◆ client selected on the schedule.
- **Intake** — sections organized by CSI MasterFormat division (Div 01 project
  info, Div 22 bathrooms, Div 12 kitchen, Div 09 finishes). "Number of
  bathrooms" spawns a per-bathroom question set. Conditional questions (tub
  size/photo only appear when a tub is chosen) and photo upload for fixtures.
- **Selection sheet** — anything the contractor specifies prints as ● SPECIFIED;
  anything left blank prints all options with ○ checkboxes and a
  "client to select" flag. Print / Save PDF uses the browser's print engine
  with a dedicated print stylesheet. Signature + date lines included.
- **Client link** — "Copy client link" encodes the whole project into a URL.
  The client sees only their open selections, taps choices, and confirms.
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

## Production notes

For the real build, the client link and "email selections" flow would move to a
small backend (store projects, email the client a link, record submissions) —
the UI and data model here carry over unchanged.
