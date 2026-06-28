import type { Conveyor } from './types'

/** Display label for a conveyor; falls back to a positional name. */
export const conveyorLabel = (conveyor: Conveyor, index: number): string =>
  conveyor.name.trim() || `Conveyor ${index + 1}`
