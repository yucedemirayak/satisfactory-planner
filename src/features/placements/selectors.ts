import type { RootState } from '@/app/store'

import type { Placement } from './types'

/** Stable empty reference so floors with no placements don't re-render. */
const EMPTY: readonly Placement[] = []

export const selectPlacementsByFloor = (state: RootState) =>
  state.placements.byFloor

export const selectFloorPlacements = (
  state: RootState,
  floorId: string,
): readonly Placement[] => state.placements.byFloor[floorId] ?? EMPTY

export const selectSelectedPlacementId = (state: RootState) =>
  state.placements.selectedId

export const selectSelectedPlacement = (state: RootState): Placement | null => {
  const { selectedId, byFloor } = state.placements
  if (!selectedId) return null
  for (const floorId of Object.keys(byFloor)) {
    const found = byFloor[floorId].find((p) => p.id === selectedId)
    if (found) return found
  }
  return null
}
