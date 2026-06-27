import type { RootState } from '@/app/store'

import { WORKBENCH_PALETTE } from './constants'

export const selectWorkbenches = (state: RootState) => state.workbenches.items

export const selectWorkbenchCount = (state: RootState) =>
  state.workbenches.items.length

/** Suggested colour for the next workbench, cycling through the palette. */
export const selectNextWorkbenchColor = (state: RootState) =>
  WORKBENCH_PALETTE[state.workbenches.items.length % WORKBENCH_PALETTE.length]
