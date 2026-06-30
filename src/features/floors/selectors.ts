import type { RootState } from '@/app/store'

import {
  DEFAULT_GRID_SIZE,
  DEFAULT_PORT_SCALE,
  DEFAULT_PX_PER_METER,
} from './constants'

/** Floors ordered bottom→top (index 0 = ground floor). */
export const selectFloors = (state: RootState) => state.floors.items

/** Floor-plan scale (px per metre); falls back to default for older saves. */
export const selectPxPerMeter = (state: RootState) =>
  state.floors.pxPerMeter ?? DEFAULT_PX_PER_METER

/** Grid snap resolution in metres; falls back to default for older saves. */
export const selectGridSize = (state: RootState) =>
  state.floors.gridSize ?? DEFAULT_GRID_SIZE

/** Connection-port hit size in pixels; falls back to default for older saves. */
export const selectPortScale = (state: RootState) =>
  state.floors.portScale ?? DEFAULT_PORT_SCALE

export const selectFloorCount = (state: RootState) => state.floors.items.length

/** Total stacked height of the factory in metres. */
export const selectTotalHeight = (state: RootState) =>
  state.floors.items.reduce((sum, f) => sum + f.height, 0)

export const selectSelectedFloorId = (state: RootState) =>
  state.floors.selectedId

export const selectSelectedFloor = (state: RootState) =>
  state.floors.items.find((f) => f.id === state.floors.selectedId) ?? null
