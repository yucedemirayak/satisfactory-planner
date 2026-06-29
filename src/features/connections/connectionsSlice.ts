import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

import { conveyorRemoved } from '@/features/conveyors/conveyorsSlice'
import { nodeRemoved } from '@/features/nodes/nodesSlice'
import {
  placementMaterialChanged,
  placementRecipeChanged,
  placementRemoved,
} from '@/features/placements/placementsSlice'

import type {
  Connection,
  ConnectionEnd,
  EndpointRef,
  PendingFrom,
} from './types'

export interface ConnectionsState {
  items: Connection[]
  /** Source output port chosen mid two-click, awaiting an input target. */
  pendingFrom: PendingFrom | null
  /** Connection open in the inspector, or null. */
  selectedId: string | null
}

const initialState: ConnectionsState = {
  items: [],
  pendingFrom: null,
  selectedId: null,
}

const sameEnd = (a: ConnectionEnd, b: ConnectionEnd): boolean =>
  a.ref === b.ref && a.id === b.id && a.port === b.port

const connectionsSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {
    /** Pick (or toggle off) the source output port for a new connection. */
    connectionSourceSet(state, action: PayloadAction<PendingFrom>) {
      const f = state.pendingFrom
      const p = action.payload
      state.pendingFrom =
        f && f.ref === p.ref && f.id === p.id && f.port === p.port ? null : p
    },
    connectionSourceCleared(state) {
      state.pendingFrom = null
    },
    connectionAdded: {
      reducer(state, action: PayloadAction<Connection>) {
        const c = action.payload
        // One belt per port: reject if either endpoint's port is already wired.
        const clash = state.items.some(
          (x) => sameEnd(x.from, c.from) || sameEnd(x.to, c.to),
        )
        if (!clash) {
          state.items.push(c)
          state.selectedId = c.id
        }
        state.pendingFrom = null
      },
      prepare(args: Omit<Connection, 'id'>) {
        return { payload: { id: nanoid(), ...args } }
      },
    },
    connectionRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((c) => c.id !== action.payload)
      if (state.selectedId === action.payload) state.selectedId = null
    },
    connectionSelected(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload
    },
    connectionConveyorChanged(
      state,
      action: PayloadAction<{ id: string; conveyorId: string }>,
    ) {
      const c = state.items.find((x) => x.id === action.payload.id)
      if (c) c.conveyorId = action.payload.conveyorId
    },
  },
  extraReducers: (builder) => {
    // An endpoint's ports vanish/shift when it's removed or its recipe/material
    // changes — drop any connection touching it. (Other cascades — e.g. deleting
    // a workbench definition — leave entries that selectConnectionViews filters.)
    const dropTouching = (
      state: ConnectionsState,
      ref: EndpointRef,
      id: string,
    ): void => {
      state.items = state.items.filter(
        (c) =>
          !(
            (c.from.ref === ref && c.from.id === id) ||
            (c.to.ref === ref && c.to.id === id)
          ),
      )
      const f = state.pendingFrom
      if (f && f.ref === ref && f.id === id) state.pendingFrom = null
    }
    builder.addCase(placementRemoved, (s, a) =>
      dropTouching(s, 'placement', a.payload),
    )
    builder.addCase(placementRecipeChanged, (s, a) =>
      dropTouching(s, 'placement', a.payload.id),
    )
    builder.addCase(placementMaterialChanged, (s, a) =>
      dropTouching(s, 'placement', a.payload.id),
    )
    builder.addCase(nodeRemoved, (s, a) => dropTouching(s, 'node', a.payload))
    builder.addCase(conveyorRemoved, (s, a) => {
      s.items = s.items.filter((c) => c.conveyorId !== a.payload)
    })
  },
})

export const {
  connectionSourceSet,
  connectionSourceCleared,
  connectionAdded,
  connectionRemoved,
  connectionSelected,
  connectionConveyorChanged,
} = connectionsSlice.actions

export default connectionsSlice.reducer
