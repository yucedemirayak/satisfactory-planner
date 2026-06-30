/**
 * Whether an item travels on belts (solid) or in pipes (fluid/gas). Drives which
 * transport (conveyor vs pipeline) a connection carrying it uses.
 */
export type ItemPhase = 'solid' | 'fluid'

/**
 * A raw material (resource). Only used as a recipe *input* — never a recipe
 * output. Materials are produced by extractors, not crafted in workbenches.
 */
export interface Material {
  id: string
  name: string
  /** Extractor this material is mined by, or null = unassigned. Refs Extractor. */
  extractorId: string | null
  /** Solid (belt) or fluid/gas (pipe). */
  phase: ItemPhase
}

export type MaterialDraft = Omit<Material, 'id'>
