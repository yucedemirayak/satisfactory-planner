import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { PortPos } from '@/features/ports'

import { DEFAULT_NODE_SIZE, MAX_NODE_SIZE, MIN_NODE_SIZE } from './constants'
import { nodePortCounts, type NodeKind, type NodeSize } from './types'

/** Per-kind editable footprint + port positions for splitters / mergers. */
export interface NodeTypeConfig extends NodeSize {
  inputPorts: PortPos[]
  outputPorts: PortPos[]
}

export interface NodeTypesState {
  splitter: NodeTypeConfig
  merger: NodeTypeConfig
}

/** Default port positions per kind — mirrors the original hard-coded layout. */
export const DEFAULT_NODE_PORTS: Record<
  NodeKind,
  { inputPorts: PortPos[]; outputPorts: PortPos[] }
> = {
  splitter: {
    inputPorts: [{ fx: 0.5, fy: 1 }],
    outputPorts: [
      { fx: 0, fy: 0.5 },
      { fx: 0.5, fy: 0 },
      { fx: 1, fy: 0.5 },
    ],
  },
  merger: {
    inputPorts: [
      { fx: 0, fy: 0.5 },
      { fx: 0.5, fy: 1 },
      { fx: 1, fy: 0.5 },
    ],
    outputPorts: [{ fx: 0.5, fy: 0 }],
  },
}

const initialState: NodeTypesState = {
  splitter: { ...DEFAULT_NODE_SIZE, ...DEFAULT_NODE_PORTS.splitter },
  merger: { ...DEFAULT_NODE_SIZE, ...DEFAULT_NODE_PORTS.merger },
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
    /** Move one input/output port of a node kind to a position on its face. */
    nodePortPosChanged(
      state,
      action: PayloadAction<{
        kind: NodeKind
        side: 'inputs' | 'outputs'
        index: number
        pos: PortPos
      }>,
    ) {
      const { kind, side, index, pos } = action.payload
      const t = state[kind]
      const counts = nodePortCounts(kind)
      const isInput = side === 'inputs'
      const count = isInput ? counts.inputs : counts.outputs
      if (index < 0 || index >= count) return
      const fallback = DEFAULT_NODE_PORTS[kind]
      const list = Array.from(
        { length: count },
        (_, i) =>
          (isInput ? t.inputPorts : t.outputPorts)?.[i] ??
          (isInput ? fallback.inputPorts[i] : fallback.outputPorts[i]),
      )
      list[index] = pos
      if (isInput) t.inputPorts = list
      else t.outputPorts = list
    },
  },
})

export const { nodeSizeChanged, nodePortPosChanged } = nodeTypesSlice.actions

export default nodeTypesSlice.reducer
