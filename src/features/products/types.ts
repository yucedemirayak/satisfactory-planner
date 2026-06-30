import type { ItemPhase } from '@/features/materials'

/**
 * A user-defined product (a crafted item). Carries a phase so connections know
 * whether it moves on belts (solid) or in pipes (fluid).
 */
export interface Product {
  id: string
  name: string
  /** Solid (belt) or fluid/gas (pipe). */
  phase: ItemPhase
}

export type ProductDraft = Omit<Product, 'id'>
