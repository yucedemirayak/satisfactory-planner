/** Public surface of the floors feature. */
export { FloorStack } from './components/FloorStack'
export { FloorInspector } from './components/FloorInspector'
export { FloorScaleControl } from './components/FloorScaleControl'
export { default as floorsReducer } from './floorsSlice'
export {
  selectFloorCount,
  selectTotalHeight,
  selectPxPerMeter,
} from './selectors'
export type { Floor, InsertPosition } from './types'
