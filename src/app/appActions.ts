import { createAction } from '@reduxjs/toolkit'

import type { PersistedState } from './persistence'

/**
 * Root-level action: replace every persisted slice wholesale. Handled in the
 * store's root reducer (not in any single slice) so importing a project file
 * swaps the entire state in one dispatch. Kept in its own module to avoid a
 * circular runtime import between the store and the slices.
 */
export const appStateImported = createAction<PersistedState>('app/stateImported')
