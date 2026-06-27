import { PURITY_MULTIPLIER, TIER_MULTIPLIER } from './constants'
import type { Placement } from './types'

export interface PlacementFactors {
  /** Total input multiplier (Σ over machines of clock). */
  input: number
  /** Total output multiplier (Σ over machines of clock × sloop amplification). */
  output: number
  /** Total somersloops consumed across all machines. */
  sloops: number
}

/**
 * Aggregate the per-machine clock/somersloop setups of a workbench placement
 * into input/output multipliers applied to a recipe's per-minute rates.
 *
 * - Overclock scales BOTH input and output by clock (e.g. 250% → ×2.5).
 * - Somersloops amplify OUTPUT only by (1 + sloops / sloopSlots) — full slots
 *   double the output. Inputs are unchanged.
 * - Machines not covered by a config run at base (100% clock, 0 sloops).
 */
export function placementFactors(
  placement: Placement,
  sloopSlots: number,
): PlacementFactors {
  const grouped = placement.configs.reduce((sum, c) => sum + c.count, 0)
  const base = Math.max(0, placement.quantity - grouped)

  let input = base
  let output = base
  let sloops = 0

  for (const c of placement.configs) {
    const clock = c.clock / 100
    const used = Math.min(c.sloops, sloopSlots)
    const amplification = sloopSlots > 0 ? 1 + used / sloopSlots : 1
    input += c.count * clock
    output += c.count * clock * amplification
    sloops += c.count * used
  }

  return { input, output, sloops }
}

/**
 * Total per-minute output of an extractor placement:
 * baseRate × tier × purity × clock-sum (overclock; no somersloops on miners).
 */
export function extractorRate(placement: Placement, baseRate: number): number {
  const tier = TIER_MULTIPLIER[placement.tier] ?? 1
  const purity = PURITY_MULTIPLIER[placement.purity] ?? 1
  // sloopSlots = 0 → output factor == input factor == Σ clock across machines.
  const { output } = placementFactors(placement, 0)
  return baseRate * tier * purity * output
}
