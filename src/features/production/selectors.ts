import type { RootState } from '@/app/store'

export const selectProductionOrder = (state: RootState) => state.production.order
