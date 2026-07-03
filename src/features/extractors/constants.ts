/** Extractor domain constants. Dimensions in metres, rate in items/min. */

export const DEFAULT_EXTRACTOR_WIDTH = 8
export const DEFAULT_EXTRACTOR_DEPTH = 8
export const DEFAULT_EXTRACTOR_HEIGHT = 8
export const MIN_EXTRACTOR_DIM = 1
export const MAX_EXTRACTOR_DIM = 200

/** Base rate = Mk.1 on a Normal node at 100% clock (e.g. miner = 60). */
export const DEFAULT_EXTRACTOR_BASE_RATE = 60
export const MIN_EXTRACTOR_BASE_RATE = 0
export const MAX_EXTRACTOR_BASE_RATE = 100000

/** Extractors only output (no inputs); most buildings have a single port. */
export const DEFAULT_EXTRACTOR_OUTPUTS = 1
export const MIN_EXTRACTOR_OUTPUTS = 1
export const MAX_EXTRACTOR_OUTPUTS = 6

export const EXTRACTOR_PALETTE = [
  '#8ecae6',
  '#a7c957',
  '#ffb703',
  '#bc6c25',
  '#e76f51',
  '#9d4edd',
] as const
