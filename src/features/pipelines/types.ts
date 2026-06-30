/**
 * A pipeline tier. Pipelines move fluids/gases between machines; the only
 * property that matters for planning is throughput (m³/min). Placement/routing
 * on top of these is built separately.
 */
export interface Pipeline {
  id: string
  name: string
  /** Max throughput in m³/min (e.g. Mk.1 = 300, Mk.2 = 600). */
  maxRate: number
}

export type PipelineDraft = Omit<Pipeline, 'id'>
