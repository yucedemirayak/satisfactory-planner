import { createSelector } from '@reduxjs/toolkit'

import { selectMaterials } from '@/features/materials'
import { selectProducts } from '@/features/products'
import type { RootState } from '@/app/store'

export const selectRecipes = (state: RootState) => state.recipes.items

export const selectRecipeCount = (state: RootState) => state.recipes.items.length

/**
 * id → name map across products + materials, for O(1) refId lookups (recipe
 * lines reference either). Memoised so it rebuilds only when those slices do.
 */
export const selectRefNames = createSelector(
  [selectProducts, selectMaterials],
  (products, materials) => {
    const map: Record<string, string> = {}
    for (const p of products) map[p.id] = p.name
    for (const m of materials) map[m.id] = m.name
    return map
  },
)
