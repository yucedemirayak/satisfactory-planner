import { createSelector } from '@reduxjs/toolkit'

import type { RootState } from '@/app/store'
import { extractorRate, placementFactors } from '@/features/placements/calc'
import type { Placement } from '@/features/placements/types'

export const selectConnectionSource = (s: RootState) => s.connections.pendingFrom

export const selectSelectedConnectionId = (s: RootState) =>
  s.connections.selectedId

/** A connection enriched with the carried item, its flow rate and belt capacity. */
export interface ConnectionView {
  id: string
  fromPlacementId: string
  fromPort: number
  toPlacementId: string
  toPort: number
  conveyorId: string
  /** Product/material id flowing along the link. */
  itemRefId: string
  /** Items/min leaving the source output port (scaled by overclock/sloops/qty). */
  sourceRate: number
  /** The belt's max throughput (0 if the conveyor is gone). */
  capacity: number
  overCapacity: boolean
}

/** Valid output ports of a placement as {refId, rate per minute}. */
function outputPortsOf(
  p: Placement,
  recipesById: Map<string, { outputs: { refId: string; rate: number }[] }>,
  workbenchSloopSlots: (refId: string) => number,
  extractorBaseRate: (refId: string) => number | undefined,
): { refId: string; rate: number }[] {
  if (p.kind === 'extractor') {
    if (!p.materialId) return []
    const base = extractorBaseRate(p.refId)
    return [{ refId: p.materialId, rate: base ? extractorRate(p, base) : 0 }]
  }
  if (p.kind === 'workbench' && p.recipeId) {
    const r = recipesById.get(p.recipeId)
    if (!r) return []
    const f = placementFactors(p, workbenchSloopSlots(p.refId))
    return r.outputs
      .filter((o) => o.refId)
      .map((o) => ({ refId: o.refId, rate: o.rate * f.output }))
  }
  return []
}

/** Valid input port item ids of a placement. */
function inputRefsOf(
  p: Placement,
  recipesById: Map<string, { inputs: { refId: string }[] }>,
): string[] {
  if (p.kind === 'workbench' && p.recipeId) {
    const r = recipesById.get(p.recipeId)
    if (r) return r.inputs.filter((i) => i.refId).map((i) => i.refId)
  }
  return []
}

/**
 * Connections that still resolve to existing, item-matching ports, enriched for
 * rendering/inspection. Filters out stale entries (deleted endpoints, changed
 * recipes, mismatched items) so the rest of the app only sees valid links.
 */
export const selectConnectionViews = createSelector(
  [
    (s: RootState) => s.connections.items,
    (s: RootState) => s.placements.byFloor,
    (s: RootState) => s.recipes.items,
    (s: RootState) => s.workbenches.items,
    (s: RootState) => s.extractors.items,
    (s: RootState) => s.conveyors.items,
  ],
  (items, byFloor, recipes, workbenches, extractors, conveyors) => {
    const placements = new Map<string, Placement>()
    for (const list of Object.values(byFloor)) {
      for (const p of list) placements.set(p.id, p)
    }
    const recipesById = new Map(recipes.map((r) => [r.id, r]))
    const wbSlots = new Map(workbenches.map((w) => [w.id, w.sloopSlots]))
    const exRate = new Map(extractors.map((e) => [e.id, e.baseRate]))
    const convRate = new Map(conveyors.map((c) => [c.id, c.maxRate]))

    const views: ConnectionView[] = []
    for (const c of items) {
      const from = placements.get(c.fromPlacementId)
      const to = placements.get(c.toPlacementId)
      if (!from || !to) continue
      const out = outputPortsOf(
        from,
        recipesById,
        (id) => wbSlots.get(id) ?? 1,
        (id) => exRate.get(id),
      )[c.fromPort]
      const inRef = inputRefsOf(to, recipesById)[c.toPort]
      if (!out || inRef == null || out.refId !== inRef) continue
      const capacity = convRate.get(c.conveyorId) ?? 0
      views.push({
        id: c.id,
        fromPlacementId: c.fromPlacementId,
        fromPort: c.fromPort,
        toPlacementId: c.toPlacementId,
        toPort: c.toPort,
        conveyorId: c.conveyorId,
        itemRefId: out.refId,
        sourceRate: out.rate,
        capacity,
        overCapacity: capacity > 0 && out.rate > capacity + 1e-9,
      })
    }
    return views
  },
)
