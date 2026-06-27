import type { RootState } from '@/app/store'

export const selectProducts = (state: RootState) => state.products.items

export const selectProductCount = (state: RootState) =>
  state.products.items.length
