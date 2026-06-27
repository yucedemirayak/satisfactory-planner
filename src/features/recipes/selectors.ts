import type { RootState } from '@/app/store'

export const selectRecipes = (state: RootState) => state.recipes.items

export const selectRecipeCount = (state: RootState) => state.recipes.items.length
