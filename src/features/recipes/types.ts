/**
 * A recipe: up to 4 inputs and up to 2 outputs. Each line references a product
 * and a rate measured per minute.
 */
export interface RecipeItem {
  /**
   * Ref to a Product or Material (ids are globally unique, so no tag needed).
   * Empty string = not chosen yet. Outputs may only reference Products.
   */
  refId: string
  /** Amount per minute. */
  rate: number
}

export interface Recipe {
  id: string
  name: string
  /** Workbench this recipe runs in, or null = any/unassigned. Refs Workbench. */
  workbenchId: string | null
  inputs: RecipeItem[]
  outputs: RecipeItem[]
}

/** Which side of a recipe a line belongs to. */
export type RecipeSide = 'inputs' | 'outputs'
