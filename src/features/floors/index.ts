/** Public surface of the floors feature. */
export { FloorStack } from './components/FloorStack'
export { FloorInspector } from './components/FloorInspector'
export { FloorScaleControl } from './components/FloorScaleControl'
export { FloorGridControl } from './components/FloorGridControl'
export { FloorPortControl } from './components/FloorPortControl'
export {
  default as floorsReducer,
  floorRemoved,
  pxPerMeterChanged,
} from './floorsSlice'
export {
  MAX_PX_PER_METER,
  MIN_PX_PER_METER,
  PX_PER_METER_STEP,
} from './constants'
export {
  selectFloorCount,
  selectTotalHeight,
  selectPxPerMeter,
  selectGridSize,
  selectPortScale,
} from './selectors'
export type { Floor, InsertPosition } from './types'
