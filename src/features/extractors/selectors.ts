import type { RootState } from '@/app/store'

import { EXTRACTOR_PALETTE } from './constants'

export const selectExtractors = (state: RootState) => state.extractors.items

export const selectExtractorCount = (state: RootState) =>
  state.extractors.items.length

export const selectNextExtractorColor = (state: RootState) =>
  EXTRACTOR_PALETTE[state.extractors.items.length % EXTRACTOR_PALETTE.length]
