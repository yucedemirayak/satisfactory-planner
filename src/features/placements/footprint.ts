import { createSelector } from '@reduxjs/toolkit'

import type { RootState } from '@/app/store'

const selectByFloor = (s: RootState) => s.placements.byFloor
const selectWorkbenchItems = (s: RootState) => s.workbenches.items
const selectExtractorItems = (s: RootState) => s.extractors.items
const selectGeneratorItems = (s: RootState) => s.generators.items

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
  [
    selectByFloor,
    selectWorkbenchItems,
    selectExtractorItems,
    selectGeneratorItems,
  ],
  (byFloor, workbenches, extractors, generators): FactoryFootprint => {
    const wb = new Map(workbenches.map((w) => [w.id, w]))
    const ex = new Map(extractors.map((e) => [e.id, e]))
    const gen = new Map(generators.map((g) => [g.id, g]))

    let width = 0
    let depth = 0
    for (const list of Object.values(byFloor)) {
      for (const p of list) {
        const b =
          p.kind === 'workbench'
            ? wb.get(p.refId)
            : p.kind === 'extractor'
              ? ex.get(p.refId)
              : gen.get(p.refId)
        if (b) {
          if (p.x + b.width > width) width = p.x + b.width
          if (b.depth > depth) depth = b.depth
        }
      }
    }
    return { width, depth }
  },
)
