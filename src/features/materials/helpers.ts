import type { Material } from './types'

/** Display label for a material; falls back to a positional name. */
export const materialLabel = (material: Material, index: number): string =>
  material.name.trim() || `Material ${index + 1}`

/**
 * Whether a material can be extracted by a given extractor type: it must be
 * bound to that extractor, or unassigned (= usable anywhere during setup).
 */
export const materialAssignableTo = (
  material: Material,
  extractorId: string,
): boolean =>
  material.extractorId === extractorId || material.extractorId === null
