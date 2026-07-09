import type { Generator } from '@/features/generators/types'

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

/** Clock→power exponent for production buildings (the game's log₂ 2.5). */
export const POWER_CLOCK_EXPONENT = Math.log2(2.5)

/**
 * Power multiplier of a placement's machines relative to one machine's base
 * draw: Σ over machines of (clock)^1.321928 × amplification². Overclocking
 * to 250% draws ~3.36× power; a fully slooped machine (2× output) draws 4×.
 */
export function placementPowerFactor(
  placement: Placement,
  sloopSlots: number,
): number {
  const grouped = placement.configs.reduce((sum, c) => sum + c.count, 0)
  let factor = Math.max(0, placement.quantity - grouped)
  for (const c of placement.configs) {
    const used = Math.min(c.sloops, sloopSlots)
    const amplification = sloopSlots > 0 ? 1 + used / sloopSlots : 1
    factor +=
      c.count * (c.clock / 100) ** POWER_CLOCK_EXPONENT * amplification ** 2
  }
  return factor
}

/** MW drawn per machine of an extractor placement's Mk tier at 100% clock. */
export function extractorPowerUsage(
  powerUsage: { 1: number; 2: number; 3: number },
  tier: number,
): number {
  const mk = Math.min(3, Math.max(1, Math.round(tier))) as 1 | 2 | 3
  return powerUsage[mk] ?? 0
}

/**
 * Linear clock sum of a generator placement's machines (generators over- and
 * underclock linearly — fuel, water, waste and power all scale together).
 */
export function generatorClockFactor(placement: Placement): number {
  // sloopSlots = 0 → input factor == Σ clock across machines.
  return placementFactors(placement, 0).input
}

/**
 * Total MW produced by a generator placement. Fuel-burning generators need a
 * fuel picked to run; fuel-less ones (geothermal) always run and scale their
 * output with node purity instead.
 */
export function generatorPower(
  placement: Placement,
  generator: Generator,
): number {
  if (generator.fuels.length > 0) {
    const fuel = placement.fuelId
      ? generator.fuels.find((f) => f.refId === placement.fuelId)
      : undefined
    if (!fuel) return 0
    return generator.powerOutput * generatorClockFactor(placement)
  }
  const purity = PURITY_MULTIPLIER[placement.purity] ?? 1
  return generator.powerOutput * purity * generatorClockFactor(placement)
}
