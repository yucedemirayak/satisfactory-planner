import type { Workbench } from './types'

/** Display label for a workbench; falls back to a positional name. */
export const workbenchLabel = (workbench: Workbench, index: number): string =>
  workbench.name.trim() || `Workbench ${index + 1}`
