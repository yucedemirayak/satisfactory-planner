/**
 * A conveyor belt tier. Belts move items between machines; the only property
 * that matters for planning is throughput (items/min). Placement/routing on top
 * of these is built separately.
 */
export interface Conveyor {
  id: string
  name: string
  /** Max throughput in items/min (e.g. Mk.1 = 60, Mk.6 = 1200). */
  maxRate: number
}

export type ConveyorDraft = Omit<Conveyor, 'id'>
