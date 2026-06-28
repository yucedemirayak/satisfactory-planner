import { createSelector } from '@reduxjs/toolkit'

import type { RootState } from '@/app/store'

const selectByFloor = (s: RootState) => s.placements.byFloor
const selectWorkbenchItems = (s: RootState) => s.workbenches.items
const selectExtractorItems = (s: RootState) => s.extractors.items
const selectSpacerItems = (s: RootState) => s.spacers.items

export interface FactoryFootprint {
  /** Widest floor's right edge — max(x + item width), in metres. */
  width: number
  /** Deepest single placed machine, in metres (one row → depth doesn't add up). */
  depth: number
}

/**
 * Aggregate footprint of the whole plan:
 * - `width` = the widest floor's right edge (max x + width across its items);
 * - `depth` = the deepest single placed machine (a floor is one row, so depths
 *   overlap rather than accumulate).
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
      for (const p of list) {
        if (p.kind === 'workbench') {
          const b = wb.get(p.refId)
          if (b) {
            if (p.x + b.width > width) width = p.x + b.width
            if (b.depth > depth) depth = b.depth
          }
        } else if (p.kind === 'extractor') {
          const b = ex.get(p.refId)
          if (b) {
            if (p.x + b.width > width) width = p.x + b.width
            if (b.depth > depth) depth = b.depth
          }
        } else {
          const b = sp.get(p.refId)
          if (b && p.x + b.width > width) width = p.x + b.width
        }
      }
    }
    return { width, depth }
  },
)
