import {
  combineReducers,
  configureStore,
  type Action,
  type Reducer,
} from '@reduxjs/toolkit'

import connectionsReducer from '@/features/connections/connectionsSlice'
import conveyorsReducer from '@/features/conveyors/conveyorsSlice'
import defaultsReducer from '@/features/defaults/defaultsSlice'
import extractorsReducer from '@/features/extractors/extractorsSlice'
import floorsReducer from '@/features/floors/floorsSlice'
import generatorsReducer from '@/features/generators/generatorsSlice'
import {
  applyPlanSnapshot,
  historyGroupKey,
  historyReducer,
  isUndoableAction,
  MAX_HISTORY,
  planChanged,
  planSnapshotOf,
  redo,
  undo,
} from '@/features/history'
import materialsReducer from '@/features/materials/materialsSlice'
import nodesReducer from '@/features/nodes/nodesSlice'
import nodeTypesReducer from '@/features/nodes/nodeTypesSlice'
import pipelinesReducer from '@/features/pipelines/pipelinesSlice'
import placementsReducer from '@/features/placements/placementsSlice'
import portEditorReducer from '@/features/ports/portEditorSlice'
import productionReducer from '@/features/production/productionSlice'
import productsReducer from '@/features/products/productsSlice'
import recipesReducer from '@/features/recipes/recipesSlice'
import selectionReducer from '@/features/selection/selectionSlice'
import spacersReducer from '@/features/spacers/spacersSlice'
import workbenchesReducer from '@/features/workbenches/workbenchesSlice'

import { appStateImported } from './appActions'
import { loadState, saveState, type PersistedState } from './persistence'

const combinedReducer = combineReducers({
  floors: floorsReducer,
  workbenches: workbenchesReducer,
  extractors: extractorsReducer,
  generators: generatorsReducer,
  spacers: spacersReducer,
  conveyors: conveyorsReducer,
  pipelines: pipelinesReducer,
  connections: connectionsReducer,
  nodes: nodesReducer,
  nodeTypes: nodeTypesReducer,
  products: productsReducer,
  materials: materialsReducer,
  recipes: recipesReducer,
  placements: placementsReducer,
  production: productionReducer,
  portEditor: portEditorReducer,
  defaults: defaultsReducer,
  selection: selectionReducer,
  history: historyReducer,
})

// Derived from the reducer (not the store) so persistence can reference
// RootState without a circular type dependency through preloadedState.
export type RootState = ReturnType<typeof combinedReducer>

// Wrap the combined reducer for the cross-slice concerns no single slice can
// handle: `appStateImported` swaps the whole tree at once (project import),
// and undo/redo snapshot/restore the four plan slices together. PersistedState
// lacks the transient slices (selection, history); combineReducers resets
// those to their initial state when the key is absent — exactly what an
// import should do.
const rootReducer: Reducer<RootState, Action, RootState | PersistedState> = (
  state,
  action,
): RootState => {
  if (appStateImported.match(action)) {
    return combinedReducer(action.payload as RootState, action)
  }
  const s = state as RootState | undefined

  // Undo/redo: restore the top snapshot, moving the current plan to the
  // opposite stack. One entry per user action — cascades stay atomic.
  if (s && (undo.match(action) || redo.match(action))) {
    const isUndo = undo.match(action)
    const source = isUndo ? s.history.past : s.history.future
    const snap = source[source.length - 1]
    if (!snap) return s
    return {
      ...applyPlanSnapshot(s, snap),
      history: isUndo
        ? {
            past: s.history.past.slice(0, -1),
            future: [...s.history.future, planSnapshotOf(s)],
            lastGroup: null,
          }
        : {
            past: [...s.history.past, planSnapshotOf(s)],
            future: s.history.future.slice(0, -1),
            lastGroup: null,
          },
    }
  }

  const next = combinedReducer(s, action)
  if (s && isUndoableAction(action) && planChanged(s, next)) {
    const group = historyGroupKey(action)
    // A same-target input run (slider drag, typing) stays ONE entry — the
    // top of `past` already holds the state from before the run started.
    if (group !== null && group === s.history.lastGroup) return next
    return {
      ...next,
      history: {
        past: [...s.history.past, planSnapshotOf(s)].slice(-MAX_HISTORY),
        future: [],
        lastGroup: group,
      },
    }
  }
  return next
}

export const store = configureStore({
  reducer: rootReducer,
  // Hydrate from localStorage; undefined falls back to each slice's initial state.
  preloadedState: loadState(),
})

// Persist on change, throttled to at most once per interval so rapid edits
// (slider drags, typing) don't thrash localStorage.
const SAVE_THROTTLE_MS = 500
let saveTimer: ReturnType<typeof setTimeout> | null = null

store.subscribe(() => {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    saveState(store.getState())
  }, SAVE_THROTTLE_MS)
})

export type AppStore = typeof store
export type AppDispatch = typeof store.dispatch
