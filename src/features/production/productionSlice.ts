import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import { productRemoved } from '@/features/products/productsSlice'

export interface ProductionState {
  /** User-defined row order for the production table, as product ids. */
  order: string[]
}

const initialState: ProductionState = {
  order: [],
}

const productionSlice = createSlice({
  name: 'production',
  initialState,
  reducers: {
    productOrderChanged(state, action: PayloadAction<string[]>) {
      state.order = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(productRemoved, (state, action) => {
      state.order = state.order.filter((id) => id !== action.payload)
    })
  },
})

export const { productOrderChanged } = productionSlice.actions

export default productionSlice.reducer
