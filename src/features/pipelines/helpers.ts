import type { Pipeline } from './types'

/** Display label for a pipeline; falls back to a positional name. */
export const pipelineLabel = (pipeline: Pipeline, index: number): string =>
  pipeline.name.trim() || `Pipeline ${index + 1}`
