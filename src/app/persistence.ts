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
  for (const floorId of Object.keys(byFloor)) {
    byFloor[floorId] = byFloor[floorId].map((p) => {
      const next: Record<string, unknown> =
        'workbenchId' in p && !('kind' in p)
          ? { id: p.id, kind: 'workbench', refId: p.workbenchId }
          : { ...p }
      if (typeof next.quantity !== 'number') next.quantity = 1
      if (next.recipeId === undefined) next.recipeId = null
      if (!Array.isArray(next.configs)) next.configs = []
      if (next.materialId === undefined) next.materialId = null
      if (next.purity === undefined) next.purity = 'normal'
      if (typeof next.tier !== 'number') next.tier = 1
      return next
    })
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
