/** Recipe domain constants. */

export const MAX_RECIPE_INPUTS = 4
export const MAX_RECIPE_OUTPUTS = 2

/** Per-side maximum, keyed for convenience. */
export const MAX_BY_SIDE = {
  inputs: MAX_RECIPE_INPUTS,
  outputs: MAX_RECIPE_OUTPUTS,
} as const
