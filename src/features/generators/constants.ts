/** Generator domain constants. Dimensions in metres, power in MW. */

export const DEFAULT_GENERATOR_WIDTH = 10
export const DEFAULT_GENERATOR_DEPTH = 10
export const DEFAULT_GENERATOR_HEIGHT = 10
export const MIN_GENERATOR_DIM = 1
export const MAX_GENERATOR_DIM = 200

/** MW per machine at 100% clock (fuel-less generators scale by purity). */
export const DEFAULT_GENERATOR_POWER = 75
export const MIN_GENERATOR_POWER = 0
export const MAX_GENERATOR_POWER = 100000

/** Fuel / water per-minute rates. */
export const MIN_FUEL_RATE = 0
export const MAX_FUEL_RATE = 100000

export const GENERATOR_PALETTE = [
  '#f4a261',
  '#90be6d',
  '#e63946',
  '#00b4d8',
  '#c77dff',
  '#ffd166',
] as const
