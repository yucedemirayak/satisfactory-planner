/** Workbench domain constants. Dimensions are in metres. */

export const DEFAULT_WORKBENCH_WIDTH = 8
export const DEFAULT_WORKBENCH_DEPTH = 8
export const DEFAULT_WORKBENCH_HEIGHT = 4

export const MIN_WORKBENCH_DIM = 1
export const MAX_WORKBENCH_DIM = 200

/** Somersloop slots per machine (production amplification). */
export const DEFAULT_WORKBENCH_SLOOP_SLOTS = 1
export const MIN_WORKBENCH_SLOOP_SLOTS = 0
export const MAX_WORKBENCH_SLOOP_SLOTS = 4

/** Palette cycled through when assigning a colour to a new workbench. */
export const WORKBENCH_PALETTE = [
  '#fa9549', // ficsit orange
  '#4ea8de',
  '#80ed99',
  '#f072a4',
  '#c77dff',
  '#ffd166',
  '#56cfe1',
  '#ff7b54',
] as const
