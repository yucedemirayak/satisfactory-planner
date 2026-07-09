import type { PortPos } from '@/features/ports'

/** One burnable fuel option of a generator, with its per-minute rates. */
export interface GeneratorFuel {
  /** Ref to a Product or Material burned as fuel (ids are globally unique). */
  refId: string
  /** Fuel consumed per minute at 100% clock. */
  rate: number
  /** Waste emitted while burning (e.g. Uranium Waste), or null for none. */
  byproduct: { refId: string; rate: number } | null
}

/**
 * A user-defined power generator that can be placed onto floors. Produces
 * megawatts (not an item): power lives outside the item balance entirely.
 * Per-placement you pick which fuel it burns; fuel-less generators
 * (geothermal) scale their output with node purity instead.
 */
export interface Generator {
  id: string
  name: string
  /** Footprint width in metres (longer horizontal side). */
  width: number
  /** Footprint depth in metres (other horizontal side, into the floor). */
  depth: number
  /** Footprint height in metres. */
  height: number
  /**
   * MW produced per machine at 100% clock — generators over/underclock
   * LINEARLY (fuel and power alike), unlike production buildings.
   */
  powerOutput: number
  /** Constant water intake per minute at 100% clock, or null for none. */
  water: { refId: string; rate: number } | null
  /** Burnable fuels; empty = fuel-less (output scales with node purity). */
  fuels: GeneratorFuel[]
  /** Position of each input port (fuel, then water); missing → left edge. */
  inputPorts?: PortPos[]
  /** Position of each output port (waste); missing → right edge. */
  outputPorts?: PortPos[]
  /** Hex colour used to identify the generator visually. */
  color: string
}

/** Fields the user can edit on an existing generator. */
export type GeneratorDraft = Omit<Generator, 'id'>
