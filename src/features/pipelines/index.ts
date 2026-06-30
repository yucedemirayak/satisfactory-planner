/** Public surface of the pipelines feature. */
export { PipelineManager } from './components/PipelineManager'
export { default as pipelinesReducer } from './pipelinesSlice'
export { selectPipelines, selectPipelineCount } from './selectors'
export { pipelineLabel } from './helpers'
export type { Pipeline } from './types'
