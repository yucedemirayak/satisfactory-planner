import type { RootState } from '@/app/store'

export const selectPipelines = (state: RootState) => state.pipelines.items

export const selectPipelineCount = (state: RootState) =>
  state.pipelines.items.length
