# Satisfactory Megafactory Planner

A web app for planning large factories from the game **Satisfactory** — lay out
buildings floor by floor, assign recipes, wire machines together with conveyor
belts, and watch the factory's production balance in real time.

Everything runs in the browser and persists to `localStorage`; no backend, no
account. The full building/recipe catalogue ships bundled, so you can start
planning the moment the page loads.

## Features

### Floor plan (`/floors`)

A 2D side-elevation of the factory, floors stacked bottom→top:

- **Drag & drop** workbenches and extractors from the palette onto any floor.
- **1D grid** — items are free-positioned along the floor by their `x` (metres)
  and snap to a configurable grid (0.25 m – 8 m, default 1 m). Overlapping items
  are flagged with a red warning.
- **Drag ghost** — a snapped silhouette previews exactly where (and on which
  floor) an item will land while you drag.
- **Conveyor wiring** — each placed machine renders input/output **ports** from
  its assigned recipe. Click an output then a matching input to connect them
  (the carried item must match). Belts are drawn as **orthogonal routes** with
  shared vertical trunks, so links leaving the same output read as clean
  T-junctions instead of crossing arcs.
- **Connection inspector** — pick a belt to set its tier (Mk1–Mk6) and see flow
  rate vs. belt capacity, with an over-capacity warning.
- **Live totals** — floors, total width, total depth and total height (in
  metres), plus an adjustable view scale.
- Each placement carries a **quantity** and **overclock / sloop** settings that
  scale its throughput.

### Catalogue management

Dedicated editors for every part of the catalogue, all persisted with the plan:

| Route | What it manages |
| --- | --- |
| `/workbenches` | Production buildings (real width × depth × height, colour, sloop slots) |
| `/extractors` | Miners / extractors (dimensions + base extraction rate) |
| `/conveyors` | Belt tiers Mk1–Mk6 (max items/min) |
| `/materials` | Raw resources |
| `/products` | Craftable items |
| `/recipes` | Standard **and** alternate recipes (inputs/outputs with rates, assigned workbench) |

### Production analysis (`/production`)

A factory-wide **balance** of every item: total produced, total consumed and the
net surplus/deficit per minute, derived from all placed machines, their recipes,
quantities and overclocks.

### Data (`/project`)

- **Export** the whole project (catalogue + floor plan) to a versioned JSON file.
- **Import** a project file to replace the current state.
- **Reset** back to the bundled default catalogue.

The bundled default ships with **11 workbenches, 3 extractors, 6 conveyors,
13 materials, 164 products and 257 recipes** (floor plan empty).

## Tech stack

- **Vite 8** + **React 19** + **TypeScript 6**
- **Redux Toolkit** + **react-redux** for state
- **React Router v7** for routing
- **Tailwind CSS v4** for styling
- **@dnd-kit** for drag & drop
- **oxlint** for linting, **pnpm** for package management

State is persisted to `localStorage` with no extra dependencies: the store is
hydrated from a saved snapshot (or the bundled default on first run), and a
lightweight `migrate()` step upgrades older saved shapes in place so existing
plans survive schema changes.

## Getting started

Requires **Node 20+** and **pnpm**.

```bash
pnpm install      # install dependencies
pnpm dev          # start the dev server (Vite, with HMR)
pnpm build        # type-check (tsc -b) and build for production
pnpm preview      # preview the production build
pnpm lint         # run oxlint
```

## Project structure

Feature-based architecture; `@/` resolves to `src/`. Each feature owns its slice,
selectors, types, helpers and components, and re-exports through a barrel
(`index.ts`).

```
src/
  app/          store, persistence, hooks, route paths, root actions
  data/         bundled default project (catalogue) JSON
  components/   cross-cutting UI
  features/
    floors/         floor stack, grid + scale controls, footprint
    placements/     placed items, drag & drop, ports, production calc
    connections/    conveyor links + orthogonal belt routing layer
    workbenches/    production-building catalogue
    extractors/     extractor catalogue
    conveyors/      belt-tier catalogue
    materials/      raw-resource catalogue
    products/       item catalogue
    recipes/        recipe catalogue (standard + alternate)
    production/     factory-wide product balance
    project/        import / export / reset
  pages/        FloorPlanPage, ProductionPage
```

## Notes

- The dimensions in the bundled catalogue are taken from the Satisfactory wiki
  (exact, decimal metres), with `width` being the longer footprint side.
- A personal project — not affiliated with Coffee Stain Studios.
