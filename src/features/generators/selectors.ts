import type { RootState } from '@/app/store'

import { GENERATOR_PALETTE } from './constants'

export const selectGenerators = (state: RootState) => state.generators.items

export const selectGeneratorCount = (state: RootState) =>
  state.generators.items.length

export const selectNextGeneratorColor = (state: RootState) =>
  GENERATOR_PALETTE[state.generators.items.length % GENERATOR_PALETTE.length]
