import type { Material } from './types'

/** Display label for a material; falls back to a positional name. */
export const materialLabel = (material: Material, index: number): string =>
  material.name.trim() || `Material ${index + 1}`
