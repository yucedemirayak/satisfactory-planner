import { createSelector } from '@reduxjs/toolkit'

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
  state.selection.current?.kind === 'placement'
    ? state.selection.current.id
    : null

export const selectSelectedPlacement = (state: RootState): Placement | null => {
  const selectedId = selectSelectedPlacementId(state)
  if (!selectedId) return null
  for (const list of Object.values(state.placements.byFloor)) {
    const found = list.find((p) => p.id === selectedId)
    if (found) return found
  }
  return null
}

const widthOf = (
  p: Placement,
  wb: Map<string, { width: number }>,
  ex: Map<string, { width: number }>,
  sp: Map<string, { width: number }>,
): number => {
  if (p.kind === 'workbench') return wb.get(p.refId)?.width ?? 0
  if (p.kind === 'extractor') return ex.get(p.refId)?.width ?? 0
  return sp.get(p.refId)?.width ?? 0
}

/**
 * Ids of placements whose x-ranges overlap another on the same floor — flagged
 * red in the plan (overlap is allowed, just warned, per the grid model).
 */
export const selectOverlappingPlacementIds = createSelector(
  [
    selectPlacementsByFloor,
    (s: RootState) => s.workbenches.items,
    (s: RootState) => s.extractors.items,
    (s: RootState) => s.spacers.items,
  ],
  (byFloor, workbenches, extractors, spacers) => {
    const wb = new Map(workbenches.map((w) => [w.id, w]))
    const ex = new Map(extractors.map((e) => [e.id, e]))
    const sp = new Map(spacers.map((s) => [s.id, s]))
    const overlapping = new Set<string>()
    for (const list of Object.values(byFloor)) {
      for (let i = 0; i < list.length; i++) {
        const a = list[i]
        const aEnd = a.x + widthOf(a, wb, ex, sp)
        for (let j = i + 1; j < list.length; j++) {
          const b = list[j]
          const bEnd = b.x + widthOf(b, wb, ex, sp)
          if (a.x < bEnd - 1e-6 && b.x < aEnd - 1e-6) {
            overlapping.add(a.id)
            overlapping.add(b.id)
          }
        }
      }
    }
    return overlapping
  },
)
