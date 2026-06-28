/** Public surface of the floors feature. */
export { FloorStack } from './components/FloorStack'
export { FloorInspector } from './components/FloorInspector'
export { FloorScaleControl } from './components/FloorScaleControl'
export { FloorGridControl } from './components/FloorGridControl'
export { default as floorsReducer } from './floorsSlice'
export {
  selectFloorCount,
  selectTotalHeight,
  selectPxPerMeter,
  selectGridSize,
} from './selectors'
export type { Floor, InsertPosition } from './types'
