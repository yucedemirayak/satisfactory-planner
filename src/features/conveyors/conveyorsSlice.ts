import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

import { MAX_CONVEYOR_RATE, MIN_CONVEYOR_RATE } from './constants'
import type { Conveyor, ConveyorDraft } from './types'

export interface ConveyorsState {
  items: Conveyor[]
}

const initialState: ConveyorsState = {
  items: [],
}

const clampRate = (v: number): number =>
  Number.isFinite(v)
    ? Math.min(MAX_CONVEYOR_RATE, Math.max(MIN_CONVEYOR_RATE, v))
    : 0

const conveyorsSlice = createSlice({
  name: 'conveyors',
  initialState,
  reducers: {
    conveyorAdded: {
      reducer(state, action: PayloadAction<Conveyor>) {
        const c = action.payload
        state.items.push({ ...c, maxRate: clampRate(c.maxRate) })
      },
      prepare(draft: ConveyorDraft) {
        return { payload: { id: nanoid(), ...draft } }
      },
    },
    conveyorUpdated(
      state,
      action: PayloadAction<{ id: string; changes: Partial<ConveyorDraft> }>,
    ) {
      const c = state.items.find((x) => x.id === action.payload.id)
      if (!c) return
      const { changes } = action.payload
      if (changes.name !== undefined) c.name = changes.name
      if (changes.maxRate !== undefined) c.maxRate = clampRate(changes.maxRate)
    },
    conveyorRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((x) => x.id !== action.payload)
    },
  },
})

export const { conveyorAdded, conveyorUpdated, conveyorRemoved } =
  conveyorsSlice.actions

export default conveyorsSlice.reducer
