import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

import { materialRemoved } from '@/features/materials/materialsSlice'
import { productRemoved } from '@/features/products/productsSlice'
import { workbenchRemoved } from '@/features/workbenches/workbenchesSlice'

import { MAX_BY_SIDE } from './constants'
import type { Recipe, RecipeItem, RecipeSide } from './types'

export interface RecipesState {
  items: Recipe[]
}

const initialState: RecipesState = {
  items: [],
}

const clampRate = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, value) : 0

const recipesSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
    recipeAdded: {
      reducer(state, action: PayloadAction<Recipe>) {
        state.items.push(action.payload)
      },
      prepare() {
        return {
          payload: {
            id: nanoid(),
            name: '',
            workbenchId: null,
            inputs: [],
            outputs: [],
          } as Recipe,
        }
      },
    },
    recipeRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((r) => r.id !== action.payload)
    },
    recipeRenamed(state, action: PayloadAction<{ id: string; name: string }>) {
      const recipe = state.items.find((r) => r.id === action.payload.id)
      if (recipe) recipe.name = action.payload.name
    },
    recipeWorkbenchChanged(
      state,
      action: PayloadAction<{ id: string; workbenchId: string | null }>,
    ) {
      const recipe = state.items.find((r) => r.id === action.payload.id)
      if (recipe) recipe.workbenchId = action.payload.workbenchId
    },
    recipeLineAdded(
      state,
      action: PayloadAction<{ id: string; side: RecipeSide }>,
    ) {
      const recipe = state.items.find((r) => r.id === action.payload.id)
      if (!recipe) return
      const { side } = action.payload
      if (recipe[side].length >= MAX_BY_SIDE[side]) return
      recipe[side].push({ refId: '', rate: 0 })
    },
    recipeLineRemoved(
      state,
      action: PayloadAction<{ id: string; side: RecipeSide; index: number }>,
    ) {
      const recipe = state.items.find((r) => r.id === action.payload.id)
      if (recipe) recipe[action.payload.side].splice(action.payload.index, 1)
    },
    recipeLineChanged(
      state,
      action: PayloadAction<{
        id: string
        side: RecipeSide
        index: number
        changes: Partial<RecipeItem>
      }>,
    ) {
      const recipe = state.items.find((r) => r.id === action.payload.id)
      const line = recipe?.[action.payload.side][action.payload.index]
      if (!line) return
      const { changes } = action.payload
      if (changes.refId !== undefined) line.refId = changes.refId
      if (changes.rate !== undefined) line.rate = clampRate(changes.rate)
    },
  },
  extraReducers: (builder) => {
    // Drop recipe lines that reference a product or material that was deleted.
    const dropRef = (state: RecipesState, refId: string) => {
      for (const recipe of state.items) {
        recipe.inputs = recipe.inputs.filter((l) => l.refId !== refId)
        recipe.outputs = recipe.outputs.filter((l) => l.refId !== refId)
      }
    }
    builder.addCase(productRemoved, (state, action) => {
      dropRef(state, action.payload)
    })
    builder.addCase(materialRemoved, (state, action) => {
      dropRef(state, action.payload)
    })
    // Unassign the workbench from recipes when that workbench is deleted.
    builder.addCase(workbenchRemoved, (state, action) => {
      for (const recipe of state.items) {
        if (recipe.workbenchId === action.payload) recipe.workbenchId = null
      }
    })
  },
})

export const {
  recipeAdded,
  recipeRemoved,
  recipeRenamed,
  recipeWorkbenchChanged,
  recipeLineAdded,
  recipeLineRemoved,
  recipeLineChanged,
} = recipesSlice.actions

export default recipesSlice.reducer
