import type { RootState } from '@/app/store'

export const selectSpacers = (state: RootState) => state.spacers.items

export const selectSpacerCount = (state: RootState) => state.spacers.items.length
