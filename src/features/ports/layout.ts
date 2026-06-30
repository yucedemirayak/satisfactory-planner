import type { CSSProperties } from 'react'

import type { PortPos } from './types'

export const clamp01 = (n: number): number => Math.min(1, Math.max(0, n))

/** Number of grid cells across a machine face of `size` m at `gridSize` m/cell. */
export const cellCount = (size: number, gridSize: number): number =>
  Math.max(1, Math.round(size / gridSize))

/** Absolute placement for a port centred on its fractional position. */
export function portPosStyle({ fx, fy }: PortPos): CSSProperties {
  return {
    position: 'absolute',
    left: `${fx * 100}%`,
    top: `${fy * 100}%`,
    transform: 'translate(-50%, -50%)',
  }
}

/**
 * Snap a raw fraction to the nearest grid-line intersection (vertex) in a
 * cols×rows grid. There are (cols+1)×(rows+1) intersections, so edges and
 * corners (fx/fy = 0 or 1) are valid targets too.
 */
export function snapToGrid(
  fx: number,
  fy: number,
  cols: number,
  rows: number,
): PortPos {
  const i = Math.min(cols, Math.max(0, Math.round(fx * cols)))
  const j = Math.min(rows, Math.max(0, Math.round(fy * rows)))
  return { fx: i / cols, fy: j / rows }
}

/** Pad/truncate stored positions to `defaults` length, filling gaps with them. */
export function resolvePorts(
  positions: PortPos[] | undefined,
  defaults: PortPos[],
): PortPos[] {
  return defaults.map((d, i) => positions?.[i] ?? d)
}

/** Default positions evenly spread along the left (inputs) or right (outputs) edge. */
export function edgePorts(count: number, side: 'left' | 'right'): PortPos[] {
  const fx = side === 'left' ? 0 : 1
  return Array.from({ length: count }, (_, i) => ({
    fx,
    fy: (i + 1) / (count + 1),
  }))
}
