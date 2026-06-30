import type { Workbench } from '@/features/workbenches/types'

import type { Recipe } from './types'

/** Display label for a recipe; falls back to a positional name. */
export const recipeLabel = (recipe: Recipe, index: number): string =>
  recipe.name.trim() || `Recipe ${index + 1}`

/** Whether a recipe's line counts fit a workbench's input/output port counts. */
export const recipeFitsWorkbench = (
  recipe: Recipe,
  workbench: Pick<Workbench, 'inputs' | 'outputs'>,
): boolean =>
  recipe.inputs.length <= workbench.inputs &&
  recipe.outputs.length <= workbench.outputs

/**
 * Whether a recipe may be assigned to a placed workbench: it must be bound to
 * this workbench type (or unbound = runs anywhere) and its line counts must fit
 * the workbench's ports.
 */
export const recipeAssignableTo = (
  recipe: Recipe,
  workbench: Pick<Workbench, 'id' | 'inputs' | 'outputs'>,
): boolean =>
  (recipe.workbenchId === workbench.id || recipe.workbenchId === null) &&
  recipeFitsWorkbench(recipe, workbench)
