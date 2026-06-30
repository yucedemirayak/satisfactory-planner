/** Public surface of the materials feature. */
export { MaterialManager } from './components/MaterialManager'
export { PhaseSelect } from './components/PhaseSelect'
export { default as materialsReducer } from './materialsSlice'
export { selectMaterials } from './selectors'
export { materialLabel, materialAssignableTo } from './helpers'
export type { Material, ItemPhase } from './types'
