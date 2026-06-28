import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

import {
  DEFAULT_FLOOR_HEIGHT,
  DEFAULT_GRID_SIZE,
  DEFAULT_PX_PER_METER,
  MAX_FLOOR_HEIGHT,
  MAX_GRID_SIZE,
  MAX_PX_PER_METER,
  MIN_FLOOR_HEIGHT,
  MIN_GRID_SIZE,
  MIN_PX_PER_METER,
} from './constants'
import type { Floor, InsertPosition } from './types'

export interface FloorsState {
  /** Ordered bottom→top: index 0 is the ground floor, last index is the top. */
  items: Floor[]
  /** Id of the floor currently open in the inspector, or null. */
  selectedId: string | null
  /** Floor-plan scale in pixels per metre (user-adjustable zoom). */
  pxPerMeter: number
  /** Grid snap resolution in metres for placing items along a floor. */
  gridSize: number
}

const initialState: FloorsState = {
  // Start with no floors.
  items: [],
  selectedId: null,
  pxPerMeter: DEFAULT_PX_PER_METER,
  gridSize: DEFAULT_GRID_SIZE,
}

const clampHeight = (height: number): number =>
  Math.min(MAX_FLOOR_HEIGHT, Math.max(MIN_FLOOR_HEIGHT, Math.round(height)))

const clampPxPerMeter = (value: number): number =>
  Number.isFinite(value)
    ? Math.min(MAX_PX_PER_METER, Math.max(MIN_PX_PER_METER, Math.round(value)))
    : DEFAULT_PX_PER_METER

const clampGridSize = (value: number): number =>
  Number.isFinite(value) && value > 0
    ? Math.min(MAX_GRID_SIZE, Math.max(MIN_GRID_SIZE, value))
    : DEFAULT_GRID_SIZE

/** Resolve an InsertPosition to a concrete array index for the current list. */
const resolveIndex = (items: Floor[], position: InsertPosition): number => {
  switch (position.kind) {
    case 'bottom':
      return 0
    case 'top':
      return items.length
    case 'at':
      return Math.min(items.length, Math.max(0, position.index))
  }
}

const floorsSlice = createSlice({
  name: 'floors',
  initialState,
  reducers: {
    /**
     * Add a floor at a position. The new floor's id/height are built in the
     * pure `prepare` step; the concrete insert index is resolved in the reducer
     * against live state. The new floor becomes the selected one.
     */
    floorAdded: {
      reducer(
        state,
        action: PayloadAction<{ floor: Floor; position: InsertPosition }>,
      ) {
        const index = resolveIndex(state.items, action.payload.position)
        state.items.splice(index, 0, action.payload.floor)
        state.selectedId = action.payload.floor.id
      },
      prepare(position: InsertPosition, height: number = DEFAULT_FLOOR_HEIGHT) {
        return {
          payload: {
            floor: { id: nanoid(), name: '', height: clampHeight(height) },
            position,
          },
        }
      },
    },
    floorRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((f) => f.id !== action.payload)
      if (state.selectedId === action.payload) state.selectedId = null
    },
    floorSelected(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload
    },
    floorHeightChanged(
      state,
      action: PayloadAction<{ id: string; height: number }>,
    ) {
      const floor = state.items.find((f) => f.id === action.payload.id)
      if (floor) floor.height = clampHeight(action.payload.height)
    },
    floorRenamed(state, action: PayloadAction<{ id: string; name: string }>) {
      const floor = state.items.find((f) => f.id === action.payload.id)
      if (floor) floor.name = action.payload.name
    },
    pxPerMeterChanged(state, action: PayloadAction<number>) {
      state.pxPerMeter = clampPxPerMeter(action.payload)
    },
    gridSizeChanged(state, action: PayloadAction<number>) {
      state.gridSize = clampGridSize(action.payload)
    },
  },
})

export const {
  floorAdded,
  floorRemoved,
  floorSelected,
  floorHeightChanged,
  floorRenamed,
  pxPerMeterChanged,
  gridSizeChanged,
} = floorsSlice.actions

export default floorsSlice.reducer
