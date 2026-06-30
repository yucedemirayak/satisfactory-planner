/**
 * A raw material (resource). Only used as a recipe *input* — never a recipe
 * output. Materials are produced by extractors, not crafted in workbenches.
 */
export interface Material {
  id: string
  name: string
  /** Extractor this material is mined by, or null = unassigned. Refs Extractor. */
  extractorId: string | null
}

export type MaterialDraft = Omit<Material, 'id'>
