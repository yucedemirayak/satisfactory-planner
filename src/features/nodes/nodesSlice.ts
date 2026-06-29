import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

import { floorRemoved } from '@/features/floors/floorsSlice'

import type { NodeKind, RouteNode } from './types'

export interface NodesState {
  items: RouteNode[]
  /** Node open in the inspector, or null. */
  selectedId: string | null
}

const initialState: NodesState = {
  items: [],
  selectedId: null,
}

const nodesSlice = createSlice({
  name: 'nodes',
  initialState,
  reducers: {
    nodeAdded: {
      reducer(state, action: PayloadAction<RouteNode>) {
        state.items.push(action.payload)
        state.selectedId = action.payload.id
      },
      prepare(args: { kind: NodeKind; floorId: string; x: number; y: number }) {
        return { payload: { id: nanoid(), ...args } }
      },
    },
    nodeMoved(
      state,
      action: PayloadAction<{ id: string; floorId: string; x: number; y: number }>,
    ) {
      const n = state.items.find((it) => it.id === action.payload.id)
      if (n) {
        n.floorId = action.payload.floorId
        n.x = action.payload.x
        n.y = action.payload.y
      }
    },
    nodeRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((n) => n.id !== action.payload)
      if (state.selectedId === action.payload) state.selectedId = null
    },
    nodeSelected(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(floorRemoved, (state, action) => {
      state.items = state.items.filter((n) => n.floorId !== action.payload)
    })
  },
})

export const { nodeAdded, nodeMoved, nodeRemoved, nodeSelected } =
  nodesSlice.actions

export default nodesSlice.reducer
