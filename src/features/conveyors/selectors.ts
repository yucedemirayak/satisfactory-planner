import type { RootState } from '@/app/store'

export const selectConveyors = (state: RootState) => state.conveyors.items

export const selectConveyorCount = (state: RootState) =>
  state.conveyors.items.length
