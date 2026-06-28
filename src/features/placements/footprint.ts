import { createSelector } from '@reduxjs/toolkit'

import type { RootState } from '@/app/store'

const selectByFloor = (s: RootState) => s.placements.byFloor
const selectWorkbenchItems = (s: RootState) => s.workbenches.items
const selectExtractorItems = (s: RootState) => s.extractors.items
const selectSpacerItems = (s: RootState) => s.spacers.items

export interface FactoryFootprint {
  /** Widest floor's total width — Σ(item width × quantity), in metres. */
  width: number
  /** Deepest single placed machine, in metres (one row → depth doesn't add up). */
  depth: number
}

/**
 * Aggregate footprint of the whole plan:
 * - `width` = the widest floor, machines counted by their quantity laid in a row;
 * - `depth` = the deepest single placed machine (a floor is one row, so depths
 *   overlap rather than accumulate).
 * Spacers count toward width (they occupy floor space) but have no depth.
 */
export const selectFactoryFootprint = createSelector(
  [selectByFloor, selectWorkbenchItems, selectExtractorItems, selectSpacerItems],
  (byFloor, workbenches, extractors, spacers): FactoryFootprint => {
    const wb = new Map(workbenches.map((w) => [w.id, w]))
    const ex = new Map(extractors.map((e) => [e.id, e]))
    const sp = new Map(spacers.map((s) => [s.id, s]))

    let width = 0
    let depth = 0
    for (const list of Object.values(byFloor)) {
      let floorWidth = 0
      for (const p of list) {
        const qty = p.quantity ?? 1
        if (p.kind === 'workbench') {
          const b = wb.get(p.refId)
          if (b) {
            floorWidth += b.width * qty
            if (b.depth > depth) depth = b.depth
          }
        } else if (p.kind === 'extractor') {
          const b = ex.get(p.refId)
          if (b) {
            floorWidth += b.width * qty
            if (b.depth > depth) depth = b.depth
          }
        } else {
          const b = sp.get(p.refId)
          if (b) floorWidth += b.width * qty
        }
      }
      if (floorWidth > width) width = floorWidth
    }
    return { width, depth }
  },
)
