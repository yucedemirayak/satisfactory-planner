import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import { conveyorRemoved } from '@/features/conveyors/conveyorsSlice'
import { pipelineRemoved } from '@/features/pipelines/pipelinesSlice'
import { MAX_TIER, MIN_TIER } from '@/features/placements/constants'

export interface DefaultsState {
  /** Belt tier for newly created connections (null → first conveyor). */
  conveyorId: string | null
  /** Pipe tier a fluid link resolves to by default (null → first pipeline). */
  pipelineId: string | null
  /** Mk tier for newly placed extractors. */
  extractorTier: number
}

const initialState: DefaultsState = {
  conveyorId: null,
  pipelineId: null,
  extractorTier: MIN_TIER,
}

const clampTier = (tier: number): number =>
  Number.isFinite(tier)
    ? Math.min(MAX_TIER, Math.max(MIN_TIER, Math.round(tier)))
    : MIN_TIER

/**
 * Defaults applied to NEW floor-plan items (connections, extractor placements),
 * set via the toolbar's PlanDefaultsControl. Existing items keep their own
 * per-item settings — this never rewrites them.
 */
const defaultsSlice = createSlice({
  name: 'defaults',
  initialState,
  reducers: {
    defaultsChanged(state, action: PayloadAction<Partial<DefaultsState>>) {
      const { conveyorId, pipelineId, extractorTier } = action.payload
      if (conveyorId !== undefined) state.conveyorId = conveyorId
      if (pipelineId !== undefined) state.pipelineId = pipelineId
      if (extractorTier !== undefined) state.extractorTier = clampTier(extractorTier)
    },
  },
  extraReducers: (builder) => {
    // A deleted tier can't stay the default — fall back to "first" (null).
    builder.addCase(conveyorRemoved, (state, action) => {
      if (state.conveyorId === action.payload) state.conveyorId = null
    })
    builder.addCase(pipelineRemoved, (state, action) => {
      if (state.pipelineId === action.payload) state.pipelineId = null
    })
  },
})

export const { defaultsChanged } = defaultsSlice.actions

export default defaultsSlice.reducer
