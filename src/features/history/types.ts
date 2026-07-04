import type { Connection } from '@/features/connections/types'
import type { Floor } from '@/features/floors/types'
import type { RouteNode } from '@/features/nodes/types'
import type { Placement } from '@/features/placements/types'

/**
 * The undoable projection of the app: everything the floor plan is made of.
 * Snapshots hold references into past Redux states (immutable), so keeping
 * many of them is cheap — nothing is deep-copied.
 */
export interface PlanSnapshot {
  floors: Floor[]
  placementsByFloor: Record<string, Placement[]>
  nodes: RouteNode[]
  connections: Connection[]
}

export interface HistoryState {
  /** Snapshots to undo back into, oldest → newest. */
  past: PlanSnapshot[]
  /** Snapshots to redo into (filled by undo, cleared by any new edit). */
  future: PlanSnapshot[]
  /** Collapse key of the newest entry, so an input-drag run stays one entry. */
  lastGroup: string | null
}
