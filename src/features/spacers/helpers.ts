import type { Spacer } from './types'

/** Display label for a spacer; falls back to a positional name. */
export const spacerLabel = (spacer: Spacer, index: number): string =>
  spacer.name.trim() || `Spacer ${index + 1}`
