import type { PortPos } from '@/features/ports'

/**
 * A user-defined extractor (miner / oil extractor / …). Produces a material
 * with no inputs. Per-placement you pick the material, node purity and tier.
 */
export interface Extractor {
  id: string
  name: string
  /** Footprint width in metres (longer horizontal side). */
  width: number
  /** Footprint depth in metres (other horizontal side, into the floor). */
  depth: number
  /** Footprint height in metres. */
  height: number
  /** Items/min at a Normal node, Mk.1, 100% clock (purity/tier scale this). */
  baseRate: number
  /**
   * MW drawn per machine at 100% clock, by Mk tier (1–3) — tiers don't scale
   * power uniformly (Miner: 5 / 15 / 45). Overclock scales by clock^1.321928.
   */
  powerUsage: { 1: number; 2: number; 3: number }
  /** Number of output ports; the extraction rate is split evenly across them. */
  outputs: number
  /** Custom output port positions; missing entries default to the box centre. */
  outputPorts?: PortPos[]
  /** Hex colour for visual identification. */
  color: string
}

export type ExtractorDraft = Omit<Extractor, 'id'>
