/**
 * Shared port-layout primitives used by machines (workbenches) and route nodes
 * (splitters / mergers). A port is positioned anywhere on the box face as
 * fractions (0..1) from the top-left; the editor snaps placement to a grid
 * whose cell size follows the floor-plan grid setting.
 */
export interface PortPos {
  /** Horizontal position, 0 = left edge … 1 = right edge. */
  fx: number
  /** Vertical position, 0 = top edge … 1 = bottom edge. */
  fy: number
}
