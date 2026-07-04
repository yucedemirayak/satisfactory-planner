import { createSelector } from '@reduxjs/toolkit'

import type { RootState } from '@/app/store'

import type { NodeKind } from './types'

export const selectNodes = (s: RootState) => s.nodes.items
export const selectSelectedNodeId = (s: RootState) =>
  s.selection.current?.kind === 'node' ? s.selection.current.id : null

export const selectNodeTypes = (s: RootState) => s.nodeTypes
export const selectNodeSize = (s: RootState, kind: NodeKind) => s.nodeTypes[kind]

/** Route nodes on a given floor. */
export const selectFloorNodes = createSelector(
  [selectNodes, (_: RootState, floorId: string) => floorId],
  (nodes, floorId) => nodes.filter((n) => n.floorId === floorId),
)

export const selectSelectedNode = createSelector(
  [selectNodes, selectSelectedNodeId],
  (nodes, id) => nodes.find((n) => n.id === id) ?? null,
)
