# Dinner Party Architect

Dinner Party Architect is a local-first seating planner built for weddings, dinners, and any event where table placement matters.

It is designed to stay easy to use for a real couple planning a wedding, while still supporting the practical constraints that make seating hard:

- multiple rooms
- different table sizes and shapes
- manual seat assignment
- guest age, social circle, tags, and notes
- couples and partner links
- pairwise affinity scores from `+100` to `-100`
- automatic seating suggestions that try to keep good matches together and avoid painful ones
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

Suggested uses:

- `circle`: bride side, groom side, family, work, college friends, kids
- `tags`: calm, dancefloor, family, travel, kids, vegan, shy
- `notes`: wants a quiet table, okay near speakers, should not be with ex, can help lead conversation

### 3. Add relationship scores

Relationship scores are the main signal for the auto-seating engine.

- `+100`: seat together if possible
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
- `Rebuild all seating`: reshuffles the entire plan from scratch

You can always override any seat manually afterward.

### 5. Save your work

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

- drag and drop seating
- guest groups larger than couples
- import from CSV
- printable floor plan views
- per-table themes like kids, family, party, quiet
- locking specific guests or tables before re-running auto-seat
- better optimization with multiple passes or simulated annealing
- shareable hosted version

## Documentation

Additional technical notes live in [docs/architecture.md](./docs/architecture.md).

## Validation

The current project has been validated with:

```bash
npm run build
```
