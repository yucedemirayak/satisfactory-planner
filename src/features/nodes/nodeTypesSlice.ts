import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import { DEFAULT_NODE_SIZE, MAX_NODE_SIZE, MIN_NODE_SIZE } from './constants'
import type { NodeKind, NodeSize } from './types'

/** Per-kind editable footprint for splitters and mergers (metres). */
export interface NodeTypesState {
  splitter: NodeSize
  merger: NodeSize
}

const initialState: NodeTypesState = {
  splitter: { ...DEFAULT_NODE_SIZE },
  merger: { ...DEFAULT_NODE_SIZE },
}

const clamp = (n: number): number =>
  Number.isFinite(n)
    ? Math.min(MAX_NODE_SIZE, Math.max(MIN_NODE_SIZE, n))
    : MIN_NODE_SIZE

const nodeTypesSlice = createSlice({
  name: 'nodeTypes',
  initialState,
  reducers: {
    nodeSizeChanged(
      state,
      action: PayloadAction<{ kind: NodeKind; changes: Partial<NodeSize> }>,
    ) {
      const t = state[action.payload.kind]
      const { width, height } = action.payload.changes
      if (typeof width === 'number') t.width = clamp(width)
      if (typeof height === 'number') t.height = clamp(height)
    },
  },
})

export const { nodeSizeChanged } = nodeTypesSlice.actions

export default nodeTypesSlice.reducer
