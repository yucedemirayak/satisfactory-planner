import type { Product } from './types'

/** Display label for a product; falls back to a positional name. */
export const productLabel = (product: Product, index: number): string =>
  product.name.trim() || `Product ${index + 1}`
