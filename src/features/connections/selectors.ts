import { createSelector } from '@reduxjs/toolkit'

import type { RootState } from '@/app/store'
import type { ItemPhase } from '@/features/materials'
import { nodePortCounts } from '@/features/nodes/types'
import { extractorRate, placementFactors } from '@/features/placements/calc'
import type { Placement } from '@/features/placements/types'

import type { Connection, ConnectionEnd } from './types'

export const selectConnectionSource = (s: RootState) => s.connections.pendingFrom

export const selectSelectedConnectionId = (s: RootState) =>
  s.selection.current?.kind === 'connection' ? s.selection.current.id : null

/** A connection enriched with the carried item, its flow rate and capacity. */
export interface ConnectionView {
  id: string
  from: ConnectionEnd
  to: ConnectionEnd
  /** Effective transport tier (conveyor or pipeline) carrying this link. */
  transportId: string
  /** Whether the carried item travels on belts (solid) or in pipes (fluid). */
  phase: ItemPhase
  /** Product/material id flowing along the link. */
  itemRefId: string
  /** Rate leaving the source output port (scaled by overclock/sloops/qty). */
  sourceRate: number
  /** The transport's max throughput (0 if no matching tier exists). */
  capacity: number
  overCapacity: boolean
  /** Carried item doesn't match the target input, or a merger mixes items. */
  mismatch: boolean
}

interface Flow {
  rate: number
  /** Carried item id, or '' when unknown/empty. */
  item: string
  /** A merger is carrying more than one distinct item. */
  conflict: boolean
}

const NO_FLOW: Flow = { rate: 0, item: '', conflict: false }

/** Valid output ports of a placement as {refId, rate per minute}. */
function outputPortsOf(
  p: Placement,
  recipesById: Map<string, { outputs: { refId: string; rate: number }[] }>,
  workbenchSloopSlots: (refId: string) => number,
  extractorOf: (refId: string) => { baseRate: number; outputs: number } | undefined,
): { refId: string; rate: number }[] {
  if (p.kind === 'extractor') {
    const item = p.materialId
    if (!item) return []
    const ex = extractorOf(p.refId)
    // Every port carries the material; total extraction splits evenly across them.
    const count = Math.max(1, ex?.outputs ?? 1)
    const perPort = ex ? extractorRate(p, ex.baseRate) / count : 0
    return Array.from({ length: count }, () => ({ refId: item, rate: perPort }))
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
 * Connections that still resolve to existing ports, enriched with the per-belt
 * flow computed across the splitter/merger graph, for rendering / inspection.
 *
 * Flow propagates forward from machine outputs (known rate + item): a splitter
 * divides its input equally among its *connected* outputs, a merger sums its
 * inputs (flagging a conflict if they carry different items). Item matching to a
 * machine input — and merger conflicts — surface as `mismatch` rather than being
 * dropped. Stale links (deleted endpoint / out-of-range port) are filtered out.
 */
export const selectConnectionViews = createSelector(
  [
    (s: RootState) => s.connections.items,
    (s: RootState) => s.placements.byFloor,
    (s: RootState) => s.recipes.items,
    (s: RootState) => s.workbenches.items,
    (s: RootState) => s.extractors.items,
    (s: RootState) => s.conveyors.items,
    (s: RootState) => s.pipelines.items,
    (s: RootState) => s.nodes.items,
    (s: RootState) => s.materials.items,
    (s: RootState) => s.products.items,
    (s: RootState) => s.defaults,
  ],
  (
    items,
    byFloor,
    recipes,
    workbenches,
    extractors,
    conveyors,
    pipelines,
    nodes,
    materials,
    products,
    defaults,
  ) => {
    const placements = new Map<string, Placement>()
    for (const list of Object.values(byFloor)) {
      for (const p of list) placements.set(p.id, p)
    }
    const recipesById = new Map(recipes.map((r) => [r.id, r]))
    const wbSlots = new Map(workbenches.map((w) => [w.id, w.sloopSlots]))
    const exById = new Map(extractors.map((e) => [e.id, e]))
    const convRate = new Map(conveyors.map((c) => [c.id, c.maxRate]))
    const pipeRate = new Map(pipelines.map((p) => [p.id, p.maxRate]))
    const nodesById = new Map(nodes.map((n) => [n.id, n]))

    // Item phase (solid → belt, fluid → pipe). Default solid when unknown.
    const itemPhase = new Map<string, ItemPhase>()
    for (const m of materials) itemPhase.set(m.id, m.phase)
    for (const p of products) itemPhase.set(p.id, p.phase)
    // Tier a link falls back to per kind: the toolbar default, else the first.
    const fallbackConveyor =
      defaults.conveyorId && convRate.has(defaults.conveyorId)
        ? defaults.conveyorId
        : (conveyors[0]?.id ?? '')
    const fallbackPipeline =
      defaults.pipelineId && pipeRate.has(defaults.pipelineId)
        ? defaults.pipelineId
        : (pipelines[0]?.id ?? '')

    // Belts grouped by the node they enter / leave (each port carries ≤1 belt).
    const intoNode = new Map<string, Connection[]>()
    const fromNode = new Map<string, Connection[]>()
    const push = (m: Map<string, Connection[]>, id: string, c: Connection) => {
      const list = m.get(id)
      if (list) list.push(c)
      else m.set(id, [c])
    }
    for (const c of items) {
      if (c.to.ref === 'node') push(intoNode, c.to.id, c)
      if (c.from.ref === 'node') push(fromNode, c.from.id, c)
    }

    const machineOutput = (end: ConnectionEnd): Flow => {
      const p = placements.get(end.id)
      if (!p) return NO_FLOW
      const out = outputPortsOf(
        p,
        recipesById,
        (id) => wbSlots.get(id) ?? 1,
        (id) => exById.get(id),
      )[end.port]
      return out ? { rate: out.rate, item: out.refId, conflict: false } : NO_FLOW
    }

    // Flow carried by a belt, memoised; recursion walks upstream through nodes.
    const cache = new Map<string, Flow>()
    const visiting = new Set<string>()
    const flowOf = (c: Connection): Flow => {
      const hit = cache.get(c.id)
      if (hit) return hit
      if (visiting.has(c.id)) return NO_FLOW // cycle guard
      visiting.add(c.id)

      let result: Flow
      if (c.from.ref === 'placement') {
        result = machineOutput(c.from)
      } else {
        const n = nodesById.get(c.from.id)
        if (!n) {
          result = NO_FLOW
        } else if (n.kind === 'splitter') {
          const inBelt = intoNode.get(n.id)?.[0]
          const inFlow = inBelt ? flowOf(inBelt) : NO_FLOW
          const divisor = fromNode.get(n.id)?.length || 1
          result = {
            rate: inFlow.rate / divisor,
            item: inFlow.item,
            conflict: inFlow.conflict,
          }
        } else {
          // merger: sum inputs; conflict if they carry different items
          let rate = 0
          let conflict = false
          const seen = new Set<string>()
          for (const inBelt of intoNode.get(n.id) ?? []) {
            const f = flowOf(inBelt)
            rate += f.rate
            if (f.item) seen.add(f.item)
            if (f.conflict) conflict = true
          }
          if (seen.size > 1) conflict = true
          result = {
            rate,
            item: seen.size === 1 ? [...seen][0] : '',
            conflict,
          }
        }
      }

      visiting.delete(c.id)
      cache.set(c.id, result)
      return result
    }

    // Validate a `from` (output) endpoint exists and its port is in range.
    const validFrom = (end: ConnectionEnd): boolean => {
      if (end.ref === 'node') {
        const n = nodesById.get(end.id)
        return !!n && end.port < nodePortCounts(n.kind).outputs
      }
      const p = placements.get(end.id)
      if (!p) return false
      return (
        end.port <
        outputPortsOf(
          p,
          recipesById,
          (id) => wbSlots.get(id) ?? 1,
          (id) => exById.get(id),
        ).length
      )
    }

    // Required item of a `to` (input) endpoint: '' for a node (accepts any), the
    // item id for a machine input, or null when the endpoint/port is invalid.
    const sinkItem = (end: ConnectionEnd): string | null => {
      if (end.ref === 'node') {
        const n = nodesById.get(end.id)
        return n && end.port < nodePortCounts(n.kind).inputs ? '' : null
      }
      const p = placements.get(end.id)
      if (!p) return null
      return inputRefsOf(p, recipesById)[end.port] ?? null
    }

    const views: ConnectionView[] = []
    for (const c of items) {
      if (!c.from || !c.to) continue // defend against malformed saved links
      if (!validFrom(c.from)) continue
      const reqItem = sinkItem(c.to)
      if (reqItem === null) continue
      const f = flowOf(c)
      // Pick transport by the carried item's phase. A stored id of the wrong
      // kind (or a deleted tier) falls back to the default tier of the right
      // kind (else the first) — this is how a new fluid link lands on the
      // default pipeline even though creation stores the belt default.
      const phase: ItemPhase = f.item
        ? (itemPhase.get(f.item) ?? 'solid')
        : 'solid'
      const stored = c.transportId
      const storedFits =
        phase === 'fluid' ? pipeRate.has(stored) : convRate.has(stored)
      const transportId = storedFits
        ? stored
        : phase === 'fluid'
          ? fallbackPipeline
          : fallbackConveyor
      const capacity =
        (phase === 'fluid' ? pipeRate.get(transportId) : convRate.get(transportId)) ??
        0
      const mismatch =
        f.conflict || (reqItem !== '' && f.item !== '' && f.item !== reqItem)
      views.push({
        id: c.id,
        from: c.from,
        to: c.to,
        transportId,
        phase,
        itemRefId: f.item,
        sourceRate: f.rate,
        capacity,
        overCapacity: capacity > 0 && f.rate > capacity + 1e-9,
        mismatch,
      })
    }
    return views
  },
)
