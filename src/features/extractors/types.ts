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
  /** Hex colour for visual identification. */
  color: string
}

export type ExtractorDraft = Omit<Extractor, 'id'>
