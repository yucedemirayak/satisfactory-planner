/**
 * A user-defined product. Only a name for now; more properties (recipe, rate,
 * icon, …) can be added later without touching consumers.
 */
export interface Product {
  id: string
  name: string
}

export type ProductDraft = Omit<Product, 'id'>
