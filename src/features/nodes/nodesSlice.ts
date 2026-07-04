import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

import { floorRemoved } from '@/features/floors/floorsSlice'

import type { NodeKind, RouteNode } from './types'

export interface NodesState {
  items: RouteNode[]
}

const initialState: NodesState = {
  items: [],
}

const nodesSlice = createSlice({
  name: 'nodes',
  initialState,
  reducers: {
    nodeAdded: {
      reducer(state, action: PayloadAction<RouteNode>) {
        state.items.push(action.payload)
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
    },
  },
  extraReducers: (builder) => {
    builder.addCase(floorRemoved, (state, action) => {
      state.items = state.items.filter((n) => n.floorId !== action.payload)
    })
  },
})

export const { nodeAdded, nodeMoved, nodeRemoved } = nodesSlice.actions

export default nodesSlice.reducer
