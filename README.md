# Satisfactory Megafactory Planner

A web app for planning large factories from the game **Satisfactory** — lay out
buildings floor by floor, assign recipes, wire machines together with belts and
pipes, and watch the factory's production **and power** balance in real time.

**Live:** <https://satisfactory-planner.yucedemirayak.com/>

Everything runs in the browser and persists to `localStorage`; no backend, no
account. The full building/recipe catalogue ships bundled, so you can start
planning the moment the page loads — or load the bundled **example
mega-factory** and explore a finished plan.

## Features

### Floor plan (`/floors`)

A 2D side-elevation of the factory, floors stacked bottom→top:

- **Drag & drop** workbenches, extractors and **generators** from the palette
  onto any floor.
- **1D grid** — items are free-positioned along the floor by their `x` (metres)
  and snap to a configurable grid (0.1 m – 8 m, default 1 m). Overlapping items
  are flagged with a red warning; a snapped **drag ghost** previews exactly
  where (and on which floor) an item will land.
- **Transport wiring** — each placed machine renders input/output **ports**
  from its building definition; the assigned recipe (or material / fuel) fills
  the slots. Click an output then a matching input to connect them. Links are
  drawn as **orthogonal routes** with shared vertical trunks, and the transport
  is **phase-aware**: solid items ride conveyors, fluids ride pipelines.
- **Splitters & mergers** — free-positioned route nodes for fan-out/fan-in
  (one line per port everywhere). A flow graph propagates rates through the
  belt network: splitters divide evenly, mergers sum, and item mismatches or
  over-capacity lines are highlighted.
- **Inspectors** — one panel for whatever is selected: floor, machine, node or
  connection. Machines expose quantity, recipe/material/fuel, purity/tier and
  **overclock / somersloop** config groups (with shard/sloop tallies and live
  MW draw); connections expose their belt/pipe tier with flow vs. capacity.
- **Undo/redo** (`Ctrl+Z` / `Ctrl+Shift+Z`), `Del` removes the selected item,
  `Esc` deselects, `Alt`+wheel zooms around the cursor.
- **Defaults toolbar** — pick the belt/pipe tier and miner Mk used for newly
  created links and extractors.
- **Live totals** — floors, total width/depth/height (metres), adjustable
  view scale and port hit-size.

### Energy (`/energy`)

A factory-wide **power balance** in MW — generators vs. machines:

- Generators are real placements: pick a **fuel** per plant (e.g. a Nuclear
  Power Plant burning Uranium or Plutonium Fuel Rods), and its fuel/water
  intake and **waste output ride the same belt network** as everything else.
  Fuel-less generators (geothermal) scale with node purity instead.
- Consumption is **game-accurate**: machine draw scales with
  `clock^log₂(2.5)` (≈ 1.321928 — 250% clock ⇒ ~3.36× power) and somersloop
  amplification **squared**; generators over/underclock linearly. Extractors
  draw per Mk tier (Miner 5/15/45 MW), and variable-power machines (Particle
  Accelerator & co.) use **per-recipe MW overrides**.
- Production/consumption/net cards, a blackout warning when the grid falls
  short, producer/consumer breakdowns by building, and a per-floor table.
- Idle buildings (no recipe / material / fuel) draw nothing.

### Production analysis (`/production`)

A factory-wide **balance** of every item: total produced, total consumed and
the net surplus/deficit per minute, derived from all placed machines —
recipes, extraction, generator fuel burn and waste output included. Rows are
drag-to-reorder and colour-coded (surplus green, deficit red).

### Catalogue management (`/settings/…`, via the gear icon)

Dedicated editors for every part of the catalogue, all persisted with the plan:

| Route | What it manages |
| --- | --- |
| `/settings/workbenches` | Production buildings (real W×D×H, colour, sloop slots, **MW draw**, port counts + draggable port layout) |
| `/settings/extractors` | Miners / extractors (dimensions, base rate, **MW per Mk tier**, output ports) |
| `/settings/generators` | Power generators (MW output, water intake, **fuels with burn rates & waste byproducts**, port layout) |
| `/settings/conveyors` | Belt tiers Mk1–Mk6 (max items/min) |
| `/settings/pipelines` | Pipeline tiers (max m³/min) |
| `/settings/routing` | Splitter/merger footprints and port layouts |
| `/settings/materials` | Raw resources (phase, which extractor mines them) |
| `/settings/products` | Craftable items (solid/fluid phase) |
| `/settings/recipes` | Standard **and** alternate recipes (inputs/outputs with rates, assigned workbench, optional **MW override**) |

### Data (`/settings/project`)

- **Export** the whole project (catalogue + floor plan) to a versioned JSON file.
- **Import** a project file — with a summary preview and explicit confirm.
- **Load example** — one click imports the bundled example mega-factory.
- **Reset** back to the bundled default catalogue.

The bundled default ships with **11 workbenches, 4 extractors, 5 generators,
6 conveyors, 2 pipelines, 13 materials, 163 products and 257 recipes** (floor
plan empty). Older saves are upgraded in place by a `migrate()` step, so
existing plans survive schema changes.

### Example mega-factory

A generated "produce everything" plan (`src/data/exampleProject.json`): every
automatable product at ≥ 1/min across **16 floors**, ~1,800 machines all at
exactly 100% clock, best-alternate recipes, fully wired (385 lines, 105
splitters) — powered by **45 Nuclear Power Plants** (112,500 MW vs. ~80,163 MW
draw), whose fuel rods come from the plan and whose waste feeds the plutonium
chain. Regenerate/verify it with:

```bash
node scripts/generate-example-project.cjs   # rebuild from the default catalogue
node scripts/verify-example-project.cjs     # independent balance/wiring/power check
```

## Tech stack

- **Vite 8** + **React 19** + **TypeScript 6**
- **Redux Toolkit** + **react-redux** for state
- **React Router v7** for routing
- **Tailwind CSS v4** for styling
- **@dnd-kit** for drag & drop
- **oxlint** for linting, **pnpm** for package management
- **Playwright** (dev dependency) for ad-hoc end-to-end checks

State is persisted to `localStorage` with no extra dependencies: the store is
hydrated from a saved snapshot (or the bundled default on first run), and a
lightweight `migrate()` step upgrades older saved shapes in place.

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

Feature-based architecture; `@/` resolves to `src/`. Each feature owns its
slice, selectors, types, helpers and components, and re-exports through a
barrel (`index.ts`).

```
src/
  app/          store, persistence + migrations, hooks, route paths, root actions
  data/         bundled default catalogue + example mega-factory JSON
  components/   cross-cutting UI
  features/
    floors/         floor stack, grid + scale controls
    placements/     placed items, drag & drop, production/power calc & balances
    connections/    belt & pipe links, flow graph, orthogonal routing layer
    nodes/          splitter / merger route nodes
    ports/          shared port-position primitives + grid layout editor
    workbenches/    production-building catalogue
    extractors/     extractor catalogue
    generators/     power-generator catalogue
    conveyors/      belt-tier catalogue
    pipelines/      pipeline-tier catalogue
    materials/      raw-resource catalogue
    products/       item catalogue
    recipes/        recipe catalogue (standard + alternate)
    production/     production-page row order
    history/        floor-plan undo/redo (snapshot-based)
    defaults/       default belt/pipe/miner tier for new plan items
    selection/      one cross-kind selection for the floor plan
    project/        import / export / load example / reset
  pages/        FloorPlanPage, ProductionPage, EnergyPage, SettingsPage
scripts/        example-project generator + verifier (plain Node)
```

## Notes

- Building dimensions, power values and fuel rates in the bundled catalogue
  are taken from the Satisfactory wiki (game 1.0/1.1; exact, decimal metres),
  with `width` being the longer footprint side.
- A personal project — not affiliated with Coffee Stain Studios.
