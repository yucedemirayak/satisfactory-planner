import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

import {
  MAX_EXTRACTOR_BASE_RATE,
  MAX_EXTRACTOR_DIM,
  MIN_EXTRACTOR_BASE_RATE,
  MIN_EXTRACTOR_DIM,
} from './constants'
import type { Extractor, ExtractorDraft } from './types'

export interface ExtractorsState {
  items: Extractor[]
}

const initialState: ExtractorsState = {
  items: [],
}

const clampDim = (v: number): number =>
  Math.min(MAX_EXTRACTOR_DIM, Math.max(MIN_EXTRACTOR_DIM, Math.round(v)))

const clampRate = (v: number): number =>
  Number.isFinite(v)
    ? Math.min(MAX_EXTRACTOR_BASE_RATE, Math.max(MIN_EXTRACTOR_BASE_RATE, v))
    : 0

const extractorsSlice = createSlice({
  name: 'extractors',
  initialState,
  reducers: {
    extractorAdded: {
      reducer(state, action: PayloadAction<Extractor>) {
        const e = action.payload
        state.items.push({
          ...e,
          width: clampDim(e.width),
          height: clampDim(e.height),
          baseRate: clampRate(e.baseRate),
        })
      },
      prepare(draft: ExtractorDraft) {
        return { payload: { id: nanoid(), ...draft } }
      },
    },
    extractorUpdated(
      state,
      action: PayloadAction<{ id: string; changes: Partial<ExtractorDraft> }>,
    ) {
      const e = state.items.find((x) => x.id === action.payload.id)
      if (!e) return
      const { changes } = action.payload
      if (changes.name !== undefined) e.name = changes.name
      if (changes.color !== undefined) e.color = changes.color
      if (changes.width !== undefined) e.width = clampDim(changes.width)
      if (changes.height !== undefined) e.height = clampDim(changes.height)
      if (changes.baseRate !== undefined) e.baseRate = clampRate(changes.baseRate)
    },
    extractorRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((x) => x.id !== action.payload)
    },
  },
})

export const { extractorAdded, extractorUpdated, extractorRemoved } =
  extractorsSlice.actions

export default extractorsSlice.reducer
