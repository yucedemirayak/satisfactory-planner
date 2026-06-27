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

/** Slices that should survive reloads (UI-only slices can be left out later). */
type PersistedState = Pick<
  RootState,
  | 'floors'
  | 'workbenches'
  | 'extractors'
  | 'spacers'
  | 'products'
  | 'materials'
  | 'recipes'
  | 'placements'
  | 'production'
>

/**
 * In-place upgrades for older persisted shapes so we don't wipe a user's data.
 * - Old placements were `{ id, workbenchId }`; now `{ id, kind, refId }`.
 * - Placements gained `quantity` (default 1), `recipeId` (null), `configs` ([]).
 * - Workbenches gained `sloopSlots` (default 1).
 * - Spacers/recipes slices didn't exist (fall back to initial).
 */
function migrate(raw: Record<string, unknown>): void {
  const workbenches = raw.workbenches as
    | { items?: Array<Record<string, unknown>> }
    | undefined
  if (workbenches?.items) {
    for (const wb of workbenches.items) {
      if (typeof wb.sloopSlots !== 'number') wb.sloopSlots = 1
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
  if (typeof localStorage === 'undefined') return undefined
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Record<string, unknown>
    migrate(parsed)
    return parsed as unknown as PersistedState
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Failed to load persisted state', error)
    return undefined
  }
}

export function saveState(state: RootState): void {
  if (typeof localStorage === 'undefined') return
  try {
    const persisted: PersistedState = {
      floors: state.floors,
      workbenches: state.workbenches,
      extractors: state.extractors,
      spacers: state.spacers,
      products: state.products,
      materials: state.materials,
      recipes: state.recipes,
      placements: state.placements,
      production: state.production,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Failed to save state', error)
  }
}
