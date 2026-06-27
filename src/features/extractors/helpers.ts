import type { Extractor } from './types'

/** Display label for an extractor; falls back to a positional name. */
export const extractorLabel = (extractor: Extractor, index: number): string =>
  extractor.name.trim() || `Extractor ${index + 1}`
