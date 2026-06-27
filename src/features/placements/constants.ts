/** Placement domain constants. */
import type { Purity } from './types'

/** Default count for a newly placed item. */
export const DEFAULT_PLACEMENT_QUANTITY = 1
export const MIN_PLACEMENT_QUANTITY = 1
export const MAX_PLACEMENT_QUANTITY = 9999

/** Overclock (clock %) range for a machine config. 100 = 1×, 250 = 2.5×. */
export const MIN_CLOCK = 1
export const MAX_CLOCK = 250
export const DEFAULT_CLOCK = 100

/** Hard cap on somersloops per machine (the per-workbench slots cap below this). */
export const MAX_SLOOPS = 4

/** Extractor node purity multipliers (output scales by these). */
export const PURITY_MULTIPLIER: Record<Purity, number> = {
  impure: 0.5,
  normal: 1,
  pure: 2,
}

/** Extractor tier multipliers — Mk.1 ×1, Mk.2 ×2, Mk.3 ×4. */
export const TIER_MULTIPLIER: Record<number, number> = { 1: 1, 2: 2, 3: 4 }
export const MIN_TIER = 1
export const MAX_TIER = 3
export const DEFAULT_TIER = 1
export const DEFAULT_PURITY: Purity = 'normal'
