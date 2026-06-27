import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

import { MAX_SPACER_WIDTH, MIN_SPACER_WIDTH } from './constants'
import type { Spacer, SpacerDraft } from './types'

export interface SpacersState {
  items: Spacer[]
}

const initialState: SpacersState = {
  items: [],
}

const clampWidth = (value: number): number =>
  Math.min(MAX_SPACER_WIDTH, Math.max(MIN_SPACER_WIDTH, Math.round(value)))

const spacersSlice = createSlice({
  name: 'spacers',
  initialState,
  reducers: {
    spacerAdded: {
      reducer(state, action: PayloadAction<Spacer>) {
        state.items.push({
          ...action.payload,
          width: clampWidth(action.payload.width),
        })
      },
      prepare(draft: SpacerDraft) {
        return { payload: { id: nanoid(), ...draft } }
      },
    },
    spacerUpdated(
      state,
      action: PayloadAction<{ id: string; changes: Partial<SpacerDraft> }>,
    ) {
      const spacer = state.items.find((s) => s.id === action.payload.id)
      if (!spacer) return
      const { changes } = action.payload
      if (changes.name !== undefined) spacer.name = changes.name
      if (changes.width !== undefined) spacer.width = clampWidth(changes.width)
    },
    spacerRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((s) => s.id !== action.payload)
    },
  },
})

export const { spacerAdded, spacerUpdated, spacerRemoved } = spacersSlice.actions

export default spacersSlice.reducer
