# Architecture Notes

## Overview

Dinner Party Architect is a single-page application with all state kept on the client.

The main layers are:

- `PlannerApp.tsx`: state ownership and orchestration
- `components/*`: UI panels for rooms, guests, and relationships
- `planUtils.ts`: scoring, hydration, cloning, and auto-assignment logic
- `plannerHelpers.ts`: UI-oriented helper utilities
- `samplePlan.ts`: starter data used for onboarding and testing

## Core data model

### Guest

Each guest stores:

- `name`
- `importId`
- `age`
- `circle`
- `partnerId`
- `lockedTableId`
- `tags`
- `notes`

This keeps the model simple while still flexible enough for most real seating decisions.

### Room

Each room stores:

- `name`
- `notes`

Rooms group tables and help with multi-space events.

### Table

Each table stores:

- `roomId`
- `name`
- `shape`
- `seatCount`
- `notes`

Seat assignments are stored separately inside the `seating` record so resizing a table is easier to manage.

### Affinity

An affinity links two guests with:

- `guestAId`
- `guestBId`
- `score`
- `note`

Scores are symmetric. The UI treats `Alice + Bob` the same as `Bob + Alice`.

Scores at `+100` are treated as hard "must sit together" rules during evaluation and smart assignment. Strong negative scores are treated as hard avoid rules, especially in strict assignment mode.

## Seating representation

Seating is stored as:

```ts
Record<tableId, Array<guestId | null>>
```

That choice makes several operations straightforward:

- assign a guest to a precise seat
- clear a seat
- resize table capacity
- compute adjacency
- export and import without ambiguity

## Auto-seating approach

The app uses a heuristic rather than an exact optimization solver.

### Why

For a small local wedding planner, the tradeoff is good:

- faster implementation
- very responsive in the browser
- easy to explain
- easy to refine over time

### What it does

The engine:

1. ranks guests by difficulty
2. optionally clears all seating or only fills unseated guests
3. filters table choices when a guest has a fixed-table lock
4. evaluates each resulting plan
5. tries multiple randomized greedy placement passes
6. keeps the highest scoring result

The UI exposes three assignment strategies:

- `balanced`: default weighting
- `social`: heavier social matching for circles, tags, and affinities
- `strict`: lower tolerance for hard avoid scores and more weight for fixed rules

### Signals used in scoring

- explicit affinity score
- fixed-table lock
- partner bonus
- same circle bonus
- shared tag bonus
- age-band nudges
- adjacency bonus
- hard penalties for severe negative matches
- hard penalties for separated `+100` relationships
- penalties for separated partners
- penalties for unseated guests

## Guest import

Guest list import is handled by `guestImport.ts`.

The parser supports:

- one name per line
- CSV-style rows with commas, semicolons, or tabs
- quoted CSV cells
- stable import IDs through headers such as `id`, `guestId`, or `importId`
- partner linking by import ID through headers such as `partner`, `partnerId`, or `conjointId`
- common English and French-ish headers such as `name`, `invite`, `prénom`, `age`, `groupe`, `notes`, and `table`

Imported guests are merged into the current plan. If import IDs are present, existing import IDs are skipped while duplicate names are allowed. Without import IDs, existing guest names are skipped to prevent accidental duplicates.

This keeps the engine understandable and good enough for iterative planning.

## Hydration and safety

Imported JSON is normalized before use:

- bad shapes are corrected
- seat counts are clamped
- invalid guest references are dropped
- duplicate seated guests are deduplicated
- broken partner references are removed

This is important because local-first tools often live a long time and exported files can drift.

## UI philosophy

The UI aims for:

- immediate visibility of the plan
- no hidden admin screens
- minimal jargon
- strong defaults with manual override

The app has two primary views:

- `Editor`: structured forms for rooms, guests, tables, and relationships
- `Visual plan`: spatial table cards where guests can be moved, swapped, or unseated with drag and drop

Guest names are rendered through `GuestInfoPopover`, which makes duplicate names easier to inspect by showing import ID, partner, fixed table, seat, tags, and notes on click.

The current layout favors form clarity over dense spreadsheets because wedding planning is usually done by non-technical users.

## Good next technical steps

If the project continues, these improvements would bring the biggest payoff:

- add CSV export
- split long state handlers into dedicated hooks
- add unit tests around scoring and hydration
- add Playwright coverage for the core flows
