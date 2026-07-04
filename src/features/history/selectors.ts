import type { RootState } from '@/app/store'

export const selectCanUndo = (state: RootState) => state.history.past.length > 0
export const selectCanRedo = (state: RootState) =>
  state.history.future.length > 0
