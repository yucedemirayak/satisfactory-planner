import type { Recipe } from './types'

/** Display label for a recipe; falls back to a positional name. */
export const recipeLabel = (recipe: Recipe, index: number): string =>
  recipe.name.trim() || `Recipe ${index + 1}`
