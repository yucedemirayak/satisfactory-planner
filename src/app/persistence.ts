import defaultProject from '@/data/defaultProject.json'

import type { RootState } from './store'

/**
 * Lightweight localStorage persistence for the Redux store — no extra deps.
 * The store is hydrated from `loadState()` (as `preloadedState`) and snapshots
 * are written back via `saveState()` on a throttle (see store.ts).
 *
 * Bump STORAGE_KEY's version suffix whenever a persisted slice's shape changes
 * so stale data is discarded instead of corrupting the new shape. Small, safe
 * upgrades can instead be handled in `migrate()` to preserve existing data.
 */
const STORAGE_KEY = 'satisfactory-planner:v1'

/** Bumped when the on-disk export shape changes (independent of STORAGE_KEY). */
export const EXPORT_VERSION = 1

/** Marker so we can recognise our own files on import. */
const PROJECT_FILE_APP = 'satisfactory-planner'

/** Slices that should survive reloads (UI-only slices can be left out later). */
export type PersistedState = Pick<
  RootState,
  | 'floors'
  | 'workbenches'
  | 'extractors'
  | 'spacers'
  | 'conveyors'
  | 'products'
  | 'materials'
  | 'recipes'
  | 'placements'
  | 'connections'
  | 'nodes'
  | 'nodeTypes'
  | 'production'
>

/** Keys of the persisted slices — single source of truth for validation. */
const PERSISTED_KEYS: ReadonlyArray<keyof PersistedState> = [
  'floors',
  'workbenches',
  'extractors',
  'spacers',
  'conveyors',
  'products',
  'materials',
  'recipes',
  'placements',
  'connections',
  'nodes',
  'nodeTypes',
  'production',
]

/** A downloadable project file: persisted state wrapped with metadata. */
export interface ProjectFile {
  app: typeof PROJECT_FILE_APP
  version: number
  exportedAt: string
  data: PersistedState
}

/** Narrow a full RootState down to just the persisted slices. */
function pickPersisted(state: RootState): PersistedState {
  return {
    floors: state.floors,
    workbenches: state.workbenches,
    extractors: state.extractors,
    spacers: state.spacers,
    conveyors: state.conveyors,
    products: state.products,
    materials: state.materials,
    recipes: state.recipes,
    placements: state.placements,
    connections: state.connections,
    nodes: state.nodes,
    nodeTypes: state.nodeTypes,
    production: state.production,
  }
}

/**
 * In-place upgrades for older persisted shapes so we don't wipe a user's data.
 * - Old placements were `{ id, workbenchId }`; now `{ id, kind, refId }`.
 * - Placements gained `quantity` (default 1), `recipeId` (null), `configs` ([]).
 * - Workbenches gained `sloopSlots` (default 1).
 * - Spacers/recipes slices didn't exist (fall back to initial).
 * - Conveyors slice added later — seed older saves with the default belts.
 */
function migrate(raw: Record<string, unknown>): void {
  if (!raw.conveyors) {
    const seed = (defaultProject as { data?: { conveyors?: unknown } }).data
      ?.conveyors
    raw.conveyors = seed ? structuredClone(seed) : { items: [] }
  }

  // Connections slice added later; always reset transient UI (pendingFrom /
  // selectedId) on load, keeping any saved links. Endpoints used to be flat
  // ({ fromPlacementId, fromPort, ... }); upgrade them to the tagged
  // { from: { ref, id, port }, to: {...} } shape (ref defaults to 'placement').
  const conn = raw.connections as { items?: unknown } | undefined
  const connItems = (
    Array.isArray(conn?.items) ? conn.items : []
  ) as Array<Record<string, unknown>>
  for (const c of connItems) {
    if (!c.from && 'fromPlacementId' in c) {
      c.from = { ref: 'placement', id: c.fromPlacementId, port: c.fromPort ?? 0 }
      c.to = { ref: 'placement', id: c.toPlacementId, port: c.toPort ?? 0 }
      delete c.fromPlacementId
      delete c.fromPort
      delete c.toPlacementId
      delete c.toPort
    }
  }
  raw.connections = {
    // Keep only well-formed links (a valid tagged from/to); drop anything an old
    // or interrupted save left half-shaped so selectors never hit a missing end.
    items: connItems.filter(
      (c) =>
        c.from &&
        typeof c.from === 'object' &&
        c.to &&
        typeof c.to === 'object',
    ),
    pendingFrom: null,
    selectedId: null,
  }

  // Route nodes (splitters / mergers) added later — seed empty.
  if (!raw.nodes) raw.nodes = { items: [], selectedId: null }

  // Editable splitter/merger footprints added later — seed/backfill each kind.
  const nt = raw.nodeTypes as
    | { splitter?: unknown; merger?: unknown }
    | undefined
  raw.nodeTypes = {
    splitter: nt?.splitter ?? { width: 2, height: 2 },
    merger: nt?.merger ?? { width: 2, height: 2 },
  }

  // Floor-plan grid added later — default the snap size.
  const floors = raw.floors as { gridSize?: unknown } | undefined
  if (floors && typeof floors.gridSize !== 'number') floors.gridSize = 1

  const workbenches = raw.workbenches as
    | { items?: Array<Record<string, unknown>> }
    | undefined
  if (workbenches?.items) {
    for (const wb of workbenches.items) {
      if (typeof wb.sloopSlots !== 'number') wb.sloopSlots = 1
      if (typeof wb.depth !== 'number') wb.depth = 8
    }
  }

  // Early seed exported extractors with { w, h } instead of { width, height }.
  const extractors = raw.extractors as
    | { items?: Array<Record<string, unknown>> }
    | undefined
  if (extractors?.items) {
    for (const e of extractors.items) {
      if (e.width === undefined && typeof e.w === 'number') {
        e.width = e.w
        delete e.w
      }
      if (e.height === undefined && typeof e.h === 'number') {
        e.height = e.h
        delete e.h
      }
      if (typeof e.depth !== 'number') e.depth = 8
    }
  }

  const recipes = raw.recipes as
    | {
        items?: Array<{
          workbenchId?: unknown
          inputs?: Array<Record<string, unknown>>
          outputs?: Array<Record<string, unknown>>
        }>
      }
    | undefined
  if (recipes?.items) {
    for (const r of recipes.items) {
      if (r.workbenchId === undefined) r.workbenchId = null
      // RecipeItem.productId → refId
      for (const line of [...(r.inputs ?? []), ...(r.outputs ?? [])]) {
        if (line.refId === undefined && 'productId' in line) {
          line.refId = line.productId
          delete line.productId
        }
      }
    }
  }

  const placements = raw.placements as
    | { byFloor?: Record<string, Array<Record<string, unknown>>> }
    | undefined
  const byFloor = placements?.byFloor
  if (!byFloor) return

  // Width lookups (metres) to convert the old ordered sequence into grid x's.
  const widthMap = (items?: Array<Record<string, unknown>>): Map<string, number> =>
    new Map(
      (items ?? [])
        .filter((it) => typeof it.id === 'string')
        .map((it) => [it.id as string, typeof it.width === 'number' ? it.width : 0]),
    )
  const wbWidth = widthMap(workbenches?.items)
  const exWidth = widthMap(extractors?.items)
  const spWidth = widthMap(
    (raw.spacers as { items?: Array<Record<string, unknown>> } | undefined)?.items,
  )
  const widthOf = (p: Record<string, unknown>): number => {
    const refId = p.refId as string
    if (p.kind === 'workbench') return wbWidth.get(refId) ?? 0
    if (p.kind === 'extractor') return exWidth.get(refId) ?? 0
    return spWidth.get(refId) ?? 0
  }

  // Grid migration: walk the old left→right order, assigning each item an `x`
  // (metres) from the running cursor. Spacers are dropped but their width still
  // advances the cursor, so the gaps they created are preserved as empty grid.
  for (const floorId of Object.keys(byFloor)) {
    let cursor = 0
    const next: Array<Record<string, unknown>> = []
    for (const p of byFloor[floorId]) {
      const norm: Record<string, unknown> =
        'workbenchId' in p && !('kind' in p)
          ? { id: p.id, kind: 'workbench', refId: p.workbenchId }
          : { ...p }
      if (typeof norm.quantity !== 'number') norm.quantity = 1
      if (norm.recipeId === undefined) norm.recipeId = null
      if (!Array.isArray(norm.configs)) norm.configs = []
      if (norm.materialId === undefined) norm.materialId = null
      if (norm.purity === undefined) norm.purity = 'normal'
      if (typeof norm.tier !== 'number') norm.tier = 1

      const w = widthOf(norm)
      if (norm.kind === 'spacer') {
        cursor += w // drop the spacer, keep the gap it made
        continue
      }
      if (typeof norm.x !== 'number') norm.x = cursor
      cursor = (norm.x as number) + w
      next.push(norm)
    }
    byFloor[floorId] = next
  }
}

export function loadState(): PersistedState | undefined {
  if (typeof localStorage === 'undefined') return getDefaultProject()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    // First run (nothing saved yet) → seed from the bundled default project.
    if (!raw) return getDefaultProject()
    const parsed = JSON.parse(raw) as Record<string, unknown>
    migrate(parsed)
    return parsed as unknown as PersistedState
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Failed to load persisted state', error)
    return undefined
  }
}

/**
 * The bundled Satisfactory catalogue (workbenches, extractors, materials,
 * products, recipes — no floor plan). Used both as the first-run seed and by
 * the "Reset to default" action. Cloned before migrating so the imported module
 * object stays pristine. Returns undefined (→ empty state) on failure.
 */
export function getDefaultProject(): PersistedState | undefined {
  try {
    return coerceProject(structuredClone(defaultProject as unknown))
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Failed to load default project', error)
    return undefined
  }
}

export function saveState(state: RootState): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pickPersisted(state)))
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Failed to save state', error)
  }
}

/** Wrap the current persisted state in a versioned, dated export envelope. */
export function serializeProject(state: RootState): ProjectFile {
  return {
    app: PROJECT_FILE_APP,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data: pickPersisted(state),
  }
}

/**
 * Parse + validate + migrate an exported project file's text into a state ready
 * to hydrate the store. Accepts both the metadata envelope and a bare state
 * object (e.g. hand-edited). Throws a user-facing Error on anything unusable.
 */
export function parseProjectFile(text: string): PersistedState {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("This file isn't valid JSON.")
  }
  return coerceProject(parsed)
}

/**
 * Validate + migrate an already-parsed project object into hydratable state.
 * Accepts both the metadata envelope and a bare state object (e.g. hand-edited
 * or the bundled default). Throws a user-facing Error on anything unusable.
 */
function coerceProject(parsed: unknown): PersistedState {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Unrecognised project file.')
  }

  // Unwrap the { app, version, data } envelope when present.
  const record = parsed as Record<string, unknown>
  const data = (
    'data' in record && record.data && typeof record.data === 'object'
      ? record.data
      : record
  ) as Record<string, unknown>

  // Must look like our state: every persisted slice present as an object.
  const missing = PERSISTED_KEYS.filter(
    (key) => !data[key] || typeof data[key] !== 'object',
  )
  if (missing.length === PERSISTED_KEYS.length) {
    throw new Error("This doesn't look like a Satisfactory Planner export.")
  }

  migrate(data)
  return data as unknown as PersistedState
}
