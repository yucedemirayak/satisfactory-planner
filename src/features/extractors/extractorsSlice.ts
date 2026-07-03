import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

import type { PortPos } from '@/features/ports'

import {
  MAX_EXTRACTOR_BASE_RATE,
  MAX_EXTRACTOR_DIM,
  MAX_EXTRACTOR_OUTPUTS,
  MIN_EXTRACTOR_BASE_RATE,
  MIN_EXTRACTOR_DIM,
  MIN_EXTRACTOR_OUTPUTS,
} from './constants'
import type { Extractor, ExtractorDraft } from './types'

export interface ExtractorsState {
  items: Extractor[]
}

const initialState: ExtractorsState = {
  items: [],
}

// Dimensions allow decimals (real footprints, e.g. Water Extractor 19.5 m).
const clampDim = (v: number): number =>
  Number.isFinite(v)
    ? Math.min(MAX_EXTRACTOR_DIM, Math.max(MIN_EXTRACTOR_DIM, v))
    : MIN_EXTRACTOR_DIM

const clampRate = (v: number): number =>
  Number.isFinite(v)
    ? Math.min(MAX_EXTRACTOR_BASE_RATE, Math.max(MIN_EXTRACTOR_BASE_RATE, v))
    : 0

const clampOutputs = (v: number): number =>
  Number.isFinite(v)
    ? Math.min(MAX_EXTRACTOR_OUTPUTS, Math.max(MIN_EXTRACTOR_OUTPUTS, Math.round(v)))
    : MIN_EXTRACTOR_OUTPUTS

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
          depth: clampDim(e.depth),
          height: clampDim(e.height),
          baseRate: clampRate(e.baseRate),
          outputs: clampOutputs(e.outputs),
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
      if (changes.depth !== undefined) e.depth = clampDim(changes.depth)
      if (changes.height !== undefined) e.height = clampDim(changes.height)
      if (changes.baseRate !== undefined) e.baseRate = clampRate(changes.baseRate)
      if (changes.outputs !== undefined) e.outputs = clampOutputs(changes.outputs)
    },
    extractorRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((x) => x.id !== action.payload)
    },
    /** Move one output port to a position on the box face. */
    extractorPortPosChanged(
      state,
      action: PayloadAction<{ id: string; index: number; pos: PortPos }>,
    ) {
      const e = state.items.find((x) => x.id === action.payload.id)
      if (!e) return
      const { index, pos } = action.payload
      if (index < 0 || index >= e.outputs) return
      // Build a full-length list (default centre column) so shorter arrays grow.
      const list = Array.from(
        { length: e.outputs },
        (_, i) =>
          e.outputPorts?.[i] ?? { fx: 0.5, fy: (i + 1) / (e.outputs + 1) },
      )
      list[index] = pos
      e.outputPorts = list
    },
  },
})

export const {
  extractorAdded,
  extractorUpdated,
  extractorRemoved,
  extractorPortPosChanged,
} = extractorsSlice.actions

export default extractorsSlice.reducer
