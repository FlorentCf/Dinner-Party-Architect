# Dinner Party Architect

Dinner Party Architect is a local-first seating planner built for weddings, dinners, and any event where table placement matters.

It is designed to stay easy to use for a real couple planning a wedding, while still supporting the practical constraints that make seating hard:

- multiple rooms
- different table sizes and shapes
- manual seat assignment
- guest age, social circle, tags, and notes
- couples and partner links
- pairwise affinity scores from `+100` to `-100`
- fixed-table guest locks for people who must stay at a specific table
- CSV/TXT or pasted guest list import
- automatic seating suggestions that try to keep good matches together and avoid painful ones
- a visual seating tab with drag-and-drop moves and swaps
- JSON import/export for backups

## Why this exists

Most seating tools are either too simple or too rigid. The goal of this project is to sit in the middle:

- simple enough to open and use immediately
- structured enough to model real wedding constraints
- local enough that your guest list stays in your browser
- flexible enough that you can override the automation at any time

## Stack

- React 19
- TypeScript
- Vite
- plain CSS

There is no backend and no database. The app persists to `localStorage` in the browser and can export the full plan as JSON.

## Getting started

### Requirements

- Node.js 24+

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Sharing the app

If the other person is comfortable with developer tools, they can clone the GitHub repository and run:

```bash
npm install
npm run dev
```

If you want a normal link that anyone can open, the best next step is to deploy the Vite build to a static host such as GitHub Pages, Netlify, or Vercel. The app has no backend, so it is a good fit for that. Keep in mind that each person's plan is saved in their own browser, so use `Export JSON` / `Import JSON` when you want to share the actual seating data.

## How to use the planner

### 1. Create your space

Start by defining:

- rooms
- tables inside each room
- seat counts per table
- table shapes
- room or table notes

This gives the planner the physical capacity and layout constraints it needs.

### 2. Add guests

For each guest, you can store:

- name
- age
- circle
- tags
- notes
- partner
- fixed table

Suggested uses:

- `circle`: bride side, groom side, family, work, college friends, kids
- `tags`: calm, dancefloor, family, travel, kids, vegan, shy
- `notes`: wants a quiet table, okay near speakers, should not be with ex, can help lead conversation

You can also bulk import guests by pasting a list or importing a CSV/TXT file.

Supported examples:

```csv
id,name,age,circle,tags,notes,partner,table
1,Alice Dupont,37,Bride side,"family, calm","Near parents",2,Family table
2,Alice Dupont,39,Bride side,family,,1,Family table
```

When an `id` column is present, the importer stores it as the guest's import ID. In that mode, duplicate names are allowed and `partner` is treated as the partner's import ID.

Or a very simple list:

```text
Alice Dupont
Noah Martin
Emma Laurent
```

Existing guests with the same import ID are skipped so you do not accidentally duplicate the whole list. If you import a simple list without IDs, existing guests with the same name are skipped instead.

### 3. Add relationship scores

Relationship scores are the main signal for the auto-seating engine.

- `+100`: must sit together
- `+50`: strong positive match
- `0`: neutral
- `-50`: avoid when practical
- `-100`: avoid at all cost

Examples:

- best friends: `+80`
- couple already linked as partner but also very close: `+95`
- same energy and social style: `+40`
- mild mismatch: `-25`
- serious conflict: `-100`

### 4. Seat manually or ask for a proposal

The planner supports two modes:

- `Seat remaining guests`: keeps your existing placements and fills the gaps
- `Rebuild all seating`: reshuffles the entire plan from scratch, but respects fixed-table locks and hard `+100` together rules

You can always override any seat manually afterward. If somebody must stay at a table, set their `Fixed table` field in the guest editor before rebuilding.

For couples, setting a fixed table on one partner automatically mirrors the same fixed table onto the other partner. When you manually move a seated guest, the app also tries to place their partner at the same table if there is an empty seat.

There are also multiple smart-assign styles:

- `Balanced`: general-purpose default
- `Keep social groups together`: gives more weight to circles, tags, and affinities
- `Strict rules first`: treats strong negative and hard together rules more aggressively

### 5. Use the visual plan

Switch from `Editor` to `Visual plan` when you want a more spatial view of the room.

In the visual plan:

- drag an unseated guest chip onto a seat
- drag a seated guest onto another empty seat to move them
- drag a seated guest onto an occupied seat to swap them
- drop a seated guest into the unseat drop zone to remove them from the table
- click a guest name to open a small detail card with ID, partner, age, circle, notes, fixed table, and current seat

This view is meant for the "does this feel right?" phase after the guest and relationship data is mostly entered.

### 6. Save your work

The app saves automatically in the browser. You can also:

- export a JSON backup
- import a previous JSON backup
- load the sample wedding
- start from a fresh blank plan

## How scoring works

The planner uses a lightweight heuristic rather than a mathematically exact solver.

It combines:

- explicit affinity scores
- partner relationships
- shared circles
- shared tags
- a few age-based nudges
- extra weight for adjacent seats
- heavy penalties for hard conflicts
- penalties for leaving people unseated

This makes the suggestions practical and fast for real-world interactive use.

Important: it is a helper, not an authority. It is intentionally built so manual judgment stays in control.

## Project structure

```text
src/
  App.tsx
  PlannerApp.tsx
  components/
    GuestsPanel.tsx
    RelationshipsPanel.tsx
    RoomsPanel.tsx
    StatCard.tsx
    VisualPlanPanel.tsx
  guestImport.ts
  planUtils.ts
  plannerHelpers.ts
  samplePlan.ts
  types.ts
  viewModels.ts
```

## Key design choices

### Local-first

The app has no backend so it is fast to run, cheap to host, and private by default.

### Soft constraints plus hard conflict penalties

Wedding seating is rarely binary. Most real decisions are "prefer this" or "avoid if possible", not strict yes/no rules. The planner reflects that.

### Manual control stays visible

Automatic suggestions are useful, but wedding seating often needs human nuance. Manual seat editing is always available directly in the table UI.

## Future improvements

Good next steps if you keep building this:

- guest groups larger than couples
- printable floor plan views
- per-table themes like kids, family, party, quiet
- better optimization with multiple passes or simulated annealing
- shareable hosted version

## Documentation

Additional technical notes live in [docs/architecture.md](./docs/architecture.md).

## Validation

The current project has been validated with:

```bash
npm run build
```
