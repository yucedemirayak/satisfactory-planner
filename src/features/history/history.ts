import { createAction, type Action } from '@reduxjs/toolkit'

import type { RootState } from '@/app/store'
import {
  connectionAdded,
  connectionRemoved,
  connectionTransportChanged,
} from '@/features/connections/connectionsSlice'
import {
  floorAdded,
  floorHeightChanged,
  floorRemoved,
  floorRenamed,
} from '@/features/floors/floorsSlice'
import { nodeAdded, nodeMoved, nodeRemoved } from '@/features/nodes/nodesSlice'
import {
  placementAdded,
  placementConfigAdded,
  placementConfigChanged,
  placementConfigRemoved,
  placementMaterialChanged,
  placementMoved,
  placementPurityChanged,
  placementQuantityChanged,
  placementRecipeChanged,
  placementRemoved,
  placementTierChanged,
} from '@/features/placements/placementsSlice'

import type { HistoryState, PlanSnapshot } from './types'

export const undo = createAction('history/undo')
export const redo = createAction('history/redo')

const initialState: HistoryState = { past: [], future: [], lastGroup: null }

/**
 * Inert reducer: only gives history a slot in RootState. All transitions
 * (push / undo / redo) happen in the store's root reducer, which — unlike any
 * slice reducer — sees every plan slice at once.
 */
export const historyReducer = (
  state: HistoryState = initialState,
  _action: Action,
): HistoryState => state

/**
 * Floor-plan mutations that create an undo entry. Deliberately absent:
 * view settings (zoom/grid/ports/defaults), selection, wiring-in-progress,
 * and catalogue edits with their cascades (undo scope is the plan itself).
 */
const UNDOABLE = new Set<string>(
  [
    floorAdded,
    floorRemoved,
    floorHeightChanged,
    floorRenamed,
    placementAdded,
    placementMoved,
    placementRemoved,
    placementQuantityChanged,
    placementRecipeChanged,
    placementMaterialChanged,
    placementPurityChanged,
    placementTierChanged,
    placementConfigAdded,
    placementConfigChanged,
    placementConfigRemoved,
    nodeAdded,
    nodeMoved,
    nodeRemoved,
    connectionAdded,
    connectionRemoved,
    connectionTransportChanged,
  ].map((a) => a.type),
)

/**
 * Slider drags and typing fire one action per tick/keystroke — a consecutive
 * same-target run of these collapses into a single history entry.
 */
const COLLAPSIBLE = new Set<string>(
  [
    floorHeightChanged,
    floorRenamed,
    placementQuantityChanged,
    placementConfigChanged,
  ].map((a) => a.type),
)

export const isUndoableAction = (action: Action): boolean =>
  UNDOABLE.has(action.type)

/** Collapse key for the action, or null when it always gets its own entry. */
export const historyGroupKey = (action: Action): string | null => {
  if (!COLLAPSIBLE.has(action.type)) return null
  const payload = (action as { payload?: { id?: string; configId?: string } })
    .payload
  return `${action.type}:${payload?.id ?? ''}:${payload?.configId ?? ''}`
}

export const planSnapshotOf = (state: RootState): PlanSnapshot => ({
  floors: state.floors.items,
  placementsByFloor: state.placements.byFloor,
  nodes: state.nodes.items,
  connections: state.connections.items,
})

export const applyPlanSnapshot = (
  state: RootState,
  snap: PlanSnapshot,
): RootState => ({
  ...state,
  floors: { ...state.floors, items: snap.floors },
  placements: { byFloor: snap.placementsByFloor },
  nodes: { items: snap.nodes },
  // Half-made wiring may point at a port the snapshot removes — drop it.
  connections: { items: snap.connections, pendingFrom: null },
})

/** Did an action actually touch the plan? (Immer keeps refs on no-ops.) */
export const planChanged = (a: RootState, b: RootState): boolean =>
  a.floors.items !== b.floors.items ||
  a.placements.byFloor !== b.placements.byFloor ||
  a.nodes.items !== b.nodes.items ||
  a.connections.items !== b.connections.items
