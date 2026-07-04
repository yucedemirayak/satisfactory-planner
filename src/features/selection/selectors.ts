import type { RootState } from '@/app/store'

export const selectSelection = (state: RootState) => state.selection.current
