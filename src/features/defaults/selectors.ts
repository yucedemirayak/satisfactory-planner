import type { RootState } from '@/app/store'

export const selectDefaults = (state: RootState) => state.defaults

/**
 * Transport id stored on a newly created connection. Always the belt default —
 * the flow graph resolves fluid links to the pipeline default by phase.
 */
export const selectNewConnectionTransportId = (state: RootState) =>
  state.defaults.conveyorId ?? state.conveyors.items[0]?.id ?? ''

export const selectDefaultExtractorTier = (state: RootState) =>
  state.defaults.extractorTier
