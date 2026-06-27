import type { RootState } from '@/app/store'

export const selectMaterials = (state: RootState) => state.materials.items

export const selectMaterialCount = (state: RootState) =>
  state.materials.items.length
