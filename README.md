# seating plant

Event floorplan and guest-list editor: arrange round/long tables, a stage and doors on a canvas, assign guests to seats, and export a `data.json` that the companion [seating-display](https://github.com/supat0417/seating-display) app renders for guests.

React + TypeScript + Vite, organized as:

- `src/domain/` — pure business logic (floorplan/guest models, theme color math, CSV parsing, JSON import/export schema, i18n dictionaries). No React/DOM dependency; covered by Vitest.
- `src/state/` — the app's reducer (undo/redo, selection, persistence-worthy state).
- `src/infrastructure/` — localStorage persistence.
- `src/ui/` — React components, organized by feature (`edit/`, `guests/`, `view/`, `topbar/`).

## Development

```bash
npm install
npm run dev      # dev server
npm test         # domain-layer unit tests
npm run build    # production build to dist/
```

Deploys automatically to GitHub Pages on push to `main` (see `.github/workflows/deploy.yml`).
