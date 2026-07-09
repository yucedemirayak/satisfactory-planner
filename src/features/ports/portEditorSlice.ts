import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import {
  DEFAULT_GRID_SIZE,
  DEFAULT_PORT_SCALE,
  MAX_GRID_SIZE,
  MAX_PORT_SCALE,
  MIN_GRID_SIZE,
  MIN_PORT_SCALE,
} from '@/features/floors/constants'

import {
  DEFAULT_EDITOR_ZOOM,
  MAX_EDITOR_ZOOM,
  MIN_EDITOR_ZOOM,
} from './constants'

/** Pages that host a port-layout editor, each with its own display settings. */
export type PortEditorPage = 'workbenches' | 'extractors' | 'generators' | 'routing'

/** Display settings for one page's editors — scoped, not shared across pages. */
export interface PortEditorSettings {
  /** Grid resolution in metres per cell. */
  gridSize: number
  /** Port dot diameter in pixels. */
  portScale: number
  /** Editor box magnification (1 = base size). */
  zoom: number
}

export type PortEditorState = Record<PortEditorPage, PortEditorSettings>

export const DEFAULT_PORT_EDITOR_SETTINGS: PortEditorSettings = {
  gridSize: DEFAULT_GRID_SIZE,
  portScale: DEFAULT_PORT_SCALE,
  zoom: DEFAULT_EDITOR_ZOOM,
}

const initialState: PortEditorState = {
  workbenches: DEFAULT_PORT_EDITOR_SETTINGS,
  extractors: DEFAULT_PORT_EDITOR_SETTINGS,
  generators: DEFAULT_PORT_EDITOR_SETTINGS,
  routing: DEFAULT_PORT_EDITOR_SETTINGS,
}

const clamp = (v: number, min: number, max: number, fallback: number): number =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback

const portEditorSlice = createSlice({
  name: 'portEditor',
  initialState,
  reducers: {
    portEditorChanged(
      state,
      action: PayloadAction<{
        page: PortEditorPage
        changes: Partial<PortEditorSettings>
      }>,
    ) {
      const { page, changes } = action.payload
      const s = state[page]
      if (changes.gridSize !== undefined)
        s.gridSize = clamp(
          changes.gridSize,
          MIN_GRID_SIZE,
          MAX_GRID_SIZE,
          DEFAULT_PORT_EDITOR_SETTINGS.gridSize,
        )
      if (changes.portScale !== undefined)
        s.portScale = clamp(
          changes.portScale,
          MIN_PORT_SCALE,
          MAX_PORT_SCALE,
          DEFAULT_PORT_EDITOR_SETTINGS.portScale,
        )
      if (changes.zoom !== undefined)
        s.zoom = clamp(
          changes.zoom,
          MIN_EDITOR_ZOOM,
          MAX_EDITOR_ZOOM,
          DEFAULT_PORT_EDITOR_SETTINGS.zoom,
        )
    },
  },
})

export const { portEditorChanged } = portEditorSlice.actions

export default portEditorSlice.reducer
