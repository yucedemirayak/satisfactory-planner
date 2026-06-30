import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

import { MAX_PIPELINE_RATE, MIN_PIPELINE_RATE } from './constants'
import type { Pipeline, PipelineDraft } from './types'

export interface PipelinesState {
  items: Pipeline[]
}

const initialState: PipelinesState = {
  items: [],
}

const clampRate = (v: number): number =>
  Number.isFinite(v)
    ? Math.min(MAX_PIPELINE_RATE, Math.max(MIN_PIPELINE_RATE, v))
    : 0

const pipelinesSlice = createSlice({
  name: 'pipelines',
  initialState,
  reducers: {
    pipelineAdded: {
      reducer(state, action: PayloadAction<Pipeline>) {
        const p = action.payload
        state.items.push({ ...p, maxRate: clampRate(p.maxRate) })
      },
      prepare(draft: PipelineDraft) {
        return { payload: { id: nanoid(), ...draft } }
      },
    },
    pipelineUpdated(
      state,
      action: PayloadAction<{ id: string; changes: Partial<PipelineDraft> }>,
    ) {
      const p = state.items.find((x) => x.id === action.payload.id)
      if (!p) return
      const { changes } = action.payload
      if (changes.name !== undefined) p.name = changes.name
      if (changes.maxRate !== undefined) p.maxRate = clampRate(changes.maxRate)
    },
    pipelineRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((x) => x.id !== action.payload)
    },
  },
})

export const { pipelineAdded, pipelineUpdated, pipelineRemoved } =
  pipelinesSlice.actions

export default pipelinesSlice.reducer
