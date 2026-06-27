import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

import type { Product, ProductDraft } from './types'

export interface ProductsState {
  items: Product[]
}

const initialState: ProductsState = {
  items: [],
}

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    productAdded: {
      reducer(state, action: PayloadAction<Product>) {
        state.items.push(action.payload)
      },
      prepare(draft: ProductDraft) {
        return { payload: { id: nanoid(), ...draft } }
      },
    },
    productUpdated(
      state,
      action: PayloadAction<{ id: string; changes: Partial<ProductDraft> }>,
    ) {
      const product = state.items.find((p) => p.id === action.payload.id)
      if (!product) return
      if (action.payload.changes.name !== undefined) {
        product.name = action.payload.changes.name
      }
    },
    productRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((p) => p.id !== action.payload)
    },
  },
})

export const { productAdded, productUpdated, productRemoved } =
  productsSlice.actions

export default productsSlice.reducer
