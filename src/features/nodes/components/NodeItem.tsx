import { useDraggable } from '@dnd-kit/core'
import type { CSSProperties } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  connectionAdded,
  connectionSourceSet,
} from '@/features/connections/connectionsSlice'
import { selectConnectionSource } from '@/features/connections/selectors'
import { selectPxPerMeter } from '@/features/floors/selectors'
import type { NodeDragData } from '@/features/placements/dnd'

import { MIN_NODE_PX } from '../constants'
import { nodeRemoved, nodeSelected } from '../nodesSlice'
import { selectSelectedNodeId } from '../selectors'
import { nodePortCounts, type NodeKind, type RouteNode } from '../types'

const portBase =
  'pointer-events-auto cursor-pointer rounded-full ring-1 transition hover:scale-125'

type Edge = 'top' | 'bottom' | 'left' | 'right'

/** Absolute placement (straddling the edge) for a port on each side. */
const EDGE_POS: Record<Edge, string> = {
  top: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2',
  bottom: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
  left: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2',
  right: 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2',
}

const SPLITTER_OUT: Edge[] = ['left', 'top', 'right']
const MERGER_IN: Edge[] = ['left', 'bottom', 'right']

/**
 * Which edge a port sits on. Splitter: input at the bottom, outputs on
 * left/top/right. Merger: output at the top, inputs on left/bottom/right.
 */
function portEdge(kind: NodeKind, type: 'in' | 'out', i: number): Edge {
  if (kind === 'splitter')
    return type === 'in' ? 'bottom' : (SPLITTER_OUT[i] ?? 'right')
  return type === 'out' ? 'top' : (MERGER_IN[i] ?? 'left')
}

/** A splitter/merger placed freely on a floor; belts attach to its ports. */
export function NodeItem({ node }: { node: RouteNode }) {
  const dispatch = useAppDispatch()
  const pxPerMeter = useAppSelector(selectPxPerMeter)
  const size = useAppSelector((s) => s.nodeTypes[node.kind])
  const pendingFrom = useAppSelector(selectConnectionSource)
  const selected = useAppSelector(selectSelectedNodeId) === node.id
  const defaultConveyorId = useAppSelector((s) => s.conveyors.items[0]?.id ?? '')

  const data: NodeDragData = {
    type: 'node',
    floorId: node.floorId,
    kind: node.kind,
  }
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: node.id,
    data,
  })

  const { inputs, outputs } = nodePortCounts(node.kind)
  const ports = [
    ...Array.from({ length: inputs }, (_, i) => ({ type: 'in' as const, i })),
    ...Array.from({ length: outputs }, (_, i) => ({ type: 'out' as const, i })),
  ]
  const isSelf = pendingFrom?.ref === 'node' && pendingFrom.id === node.id

  // Outputs start a wire (item unknown → refId null); inputs accept any source.
  const pickSource = (port: number) =>
    dispatch(connectionSourceSet({ ref: 'node', id: node.id, port, refId: null }))
  const completeTo = (port: number) => {
    if (!pendingFrom || isSelf) return
    dispatch(
      connectionAdded({
        from: {
          ref: pendingFrom.ref,
          id: pendingFrom.id,
          port: pendingFrom.port,
        },
        to: { ref: 'node', id: node.id, port },
        conveyorId: defaultConveyorId,
      }),
    )
  }

  const style: CSSProperties = {
    position: 'absolute',
    left: node.x * pxPerMeter,
    top: node.y * pxPerMeter,
    width: Math.max(MIN_NODE_PX, size.width * pxPerMeter),
    height: Math.max(MIN_NODE_PX, size.height * pxPerMeter),
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        e.stopPropagation()
        dispatch(nodeSelected(node.id))
      }}
      style={style}
      // No z-index: the box stays below the belt layer (z-10) so belts render
      // over it, while its ports (z-30) escape this non-stacking-context box and
      // sit above the belts — same layering as machines.
      className={`group/node flex cursor-grab touch-none items-center justify-center rounded-sm border-2 bg-surface-2 text-[9px] font-bold tracking-wide text-gray-200 active:cursor-grabbing ${
        selected ? 'border-ficsit ring-2 ring-ficsit' : 'border-sky-400/70'
      }`}
      title={node.kind === 'splitter' ? 'Splitter (1 → 3)' : 'Merger (3 → 1)'}
      {...attributes}
      {...listeners}
    >
      {node.kind === 'splitter' ? 'SPL' : 'MRG'}

      {ports.map((p) => {
        const pos = EDGE_POS[portEdge(node.kind, p.type, p.i)]
        if (p.type === 'in') {
          const valid = Boolean(pendingFrom) && !isSelf
          return (
            <button
              key={`in-${p.i}`}
              type="button"
              data-port={`${node.id}::in::${p.i}`}
              aria-label="Input port"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                completeTo(p.i)
              }}
              className={`absolute z-30 size-2.5 bg-sky-400 ${pos} ${portBase} ${
                valid ? 'scale-125 ring-2 ring-emerald-400' : 'ring-sky-200/50'
              }`}
            />
          )
        }
        const isSrc = isSelf && pendingFrom.port === p.i
        return (
          <button
            key={`out-${p.i}`}
            type="button"
            data-port={`${node.id}::out::${p.i}`}
            aria-label="Output port"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              pickSource(p.i)
            }}
            className={`absolute z-30 size-2.5 bg-ficsit ${pos} ${portBase} ${
              isSrc ? 'scale-125 ring-2 ring-ficsit' : 'ring-ficsit/50'
            }`}
          />
        )
      })}

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          dispatch(nodeRemoved(node.id))
        }}
        title="Remove"
        aria-label="Remove"
        className="absolute -right-1.5 -top-1.5 z-30 flex size-4 items-center justify-center rounded bg-surface-0/80 text-[10px] text-gray-300 opacity-0 transition hover:bg-red-500/40 hover:text-red-200 group-hover/node:opacity-100"
      >
        ✕
      </button>
    </div>
  )
}
