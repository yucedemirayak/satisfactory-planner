import type { Generator } from './types'

/** Display label for a generator; falls back to a positional name. */
export const generatorLabel = (generator: Generator, index: number): string =>
  generator.name.trim() || `Generator ${index + 1}`

/**
 * Physical port counts of a generator, derived from its definition:
 * one input for fuel (when it burns any), one for water (when it drinks any),
 * and one output when any fuel leaves a waste byproduct behind.
 */
export function generatorPortCounts(generator: Generator): {
  inputs: number
  outputs: number
} {
  const fuel = generator.fuels.length > 0 ? 1 : 0
  const water = generator.water ? 1 : 0
  const waste = generator.fuels.some((f) => f.byproduct) ? 1 : 0
  return { inputs: fuel + water, outputs: waste }
}
