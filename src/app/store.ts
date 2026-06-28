import { combineReducers, configureStore, type Action } from '@reduxjs/toolkit'

import conveyorsReducer from '@/features/conveyors/conveyorsSlice'
import extractorsReducer from '@/features/extractors/extractorsSlice'
import floorsReducer from '@/features/floors/floorsSlice'
import materialsReducer from '@/features/materials/materialsSlice'
import placementsReducer from '@/features/placements/placementsSlice'
import productionReducer from '@/features/production/productionSlice'
import productsReducer from '@/features/products/productsSlice'
import recipesReducer from '@/features/recipes/recipesSlice'
import spacersReducer from '@/features/spacers/spacersSlice'
import workbenchesReducer from '@/features/workbenches/workbenchesSlice'

import { appStateImported } from './appActions'
import { loadState, saveState } from './persistence'

const combinedReducer = combineReducers({
  floors: floorsReducer,
  workbenches: workbenchesReducer,
  extractors: extractorsReducer,
  spacers: spacersReducer,
  conveyors: conveyorsReducer,
  products: productsReducer,
  materials: materialsReducer,
  recipes: recipesReducer,
  placements: placementsReducer,
  production: productionReducer,
})

// Derived from the reducer (not the store) so persistence can reference
// RootState without a circular type dependency through preloadedState.
export type RootState = ReturnType<typeof combinedReducer>

// Wrap the combined reducer so `appStateImported` can swap the whole tree at
// once (project import). Slices don't know about this action, so on import they
// each just receive—and return—their replacement slice.
const rootReducer = (state: RootState | undefined, action: Action): RootState =>
  appStateImported.match(action)
    ? combinedReducer(action.payload, action)
    : combinedReducer(state, action)

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
