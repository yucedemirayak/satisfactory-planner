/** A conveyor routing node: a splitter (1 in / 3 out) or a merger (3 in / 1 out). */
export type NodeKind = 'splitter' | 'merger'

/**
 * A splitter/merger placed freely (2D) on a floor — not constrained to the 1D
 * machine grid, so it can sit anywhere, including over a machine. Belts attach to
 * its ports; the carried item is whatever flows in (resolved from the graph).
 */
export interface RouteNode {
  id: string
  kind: NodeKind
  floorId: string
  /** Free position within the floor in metres: x from the left, y from bottom. */
  x: number
  y: number
}

/** Input/output port counts for a node kind. */
export function nodePortCounts(kind: NodeKind): { inputs: number; outputs: number } {
  return kind === 'splitter' ? { inputs: 1, outputs: 3 } : { inputs: 3, outputs: 1 }
}

/** Editable footprint (metres) of a routing-node kind. */
export interface NodeSize {
  width: number
  height: number
}
