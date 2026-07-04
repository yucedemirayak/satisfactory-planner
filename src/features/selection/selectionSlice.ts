import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import {
  connectionAdded,
  connectionRemoved,
} from '@/features/connections/connectionsSlice'
import { floorAdded, floorRemoved } from '@/features/floors/floorsSlice'
import { nodeAdded, nodeRemoved } from '@/features/nodes/nodesSlice'
import {
  placementAdded,
  placementRemoved,
} from '@/features/placements/placementsSlice'

/** The kinds of floor-plan entities that can be selected. */
export type SelectionKind = 'placement' | 'floor' | 'node' | 'connection'

export interface Selection {
  kind: SelectionKind
  id: string
}

export interface SelectionState {
  /** The one selected item across all kinds, or null. */
  current: Selection | null
}

const initialState: SelectionState = { current: null }

/**
 * Single cross-kind selection: picking any item replaces the previous pick, so
 * exactly one inspector is active and Delete has an unambiguous target.
 * Transient UI state — not persisted.
 */
const selectionSlice = createSlice({
  name: 'selection',
  initialState,
  reducers: {
    itemSelected(state, action: PayloadAction<Selection>) {
      state.current = action.payload
    },
    selectionCleared(state) {
      state.current = null
    },
  },
  extraReducers: (builder) => {
    // A newly added item becomes the selection.
    builder.addCase(placementAdded, (state, action) => {
      state.current = { kind: 'placement', id: action.payload.placement.id }
    })
    builder.addCase(floorAdded, (state, action) => {
      state.current = { kind: 'floor', id: action.payload.floor.id }
    })
    builder.addCase(nodeAdded, (state, action) => {
      state.current = { kind: 'node', id: action.payload.id }
    })
    builder.addCase(connectionAdded, (state, action) => {
      state.current = { kind: 'connection', id: action.payload.id }
    })

    // Removing the selected item clears the selection. Cascade removals (e.g.
    // a floor taking its placements along) can leave a dangling id — harmless,
    // the selectSelected* resolvers return null for ids that no longer exist.
    const clearedBy =
      (kind: SelectionKind) =>
      (state: SelectionState, action: PayloadAction<string>) => {
        if (state.current?.kind === kind && state.current.id === action.payload) {
          state.current = null
        }
      }
    builder.addCase(placementRemoved, clearedBy('placement'))
    builder.addCase(floorRemoved, clearedBy('floor'))
    builder.addCase(nodeRemoved, clearedBy('node'))
    builder.addCase(connectionRemoved, clearedBy('connection'))
  },
})

export const { itemSelected, selectionCleared } = selectionSlice.actions

export default selectionSlice.reducer
