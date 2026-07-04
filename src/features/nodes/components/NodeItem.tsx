import { useDraggable } from '@dnd-kit/core'
import type { CSSProperties } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  connectionAdded,
  connectionSourceSet,
} from '@/features/connections/connectionsSlice'
import { selectConnectionSource } from '@/features/connections/selectors'
import { selectNewConnectionTransportId } from '@/features/defaults'
import { selectPortScale, selectPxPerMeter } from '@/features/floors/selectors'
import type { NodeDragData } from '@/features/placements/dnd'
import { portPosStyle, resolvePorts } from '@/features/ports'
import { itemSelected } from '@/features/selection'

import { MIN_NODE_PX } from '../constants'
import { DEFAULT_NODE_PORTS } from '../nodeTypesSlice'
import { selectSelectedNodeId } from '../selectors'
import type { RouteNode } from '../types'

const portBase =
  'pointer-events-auto cursor-pointer rounded-full ring-1 transition hover:scale-125'

/** A splitter/merger placed freely on a floor; belts attach to its ports. */
export function NodeItem({ node }: { node: RouteNode }) {
  const dispatch = useAppDispatch()
  const pxPerMeter = useAppSelector(selectPxPerMeter)
  const portScale = useAppSelector(selectPortScale)
  const cfg = useAppSelector((s) => s.nodeTypes[node.kind])
  const pendingFrom = useAppSelector(selectConnectionSource)
  const selected = useAppSelector(selectSelectedNodeId) === node.id
  const defaultTransportId = useAppSelector(selectNewConnectionTransportId)

  const data: NodeDragData = {
    type: 'node',
    floorId: node.floorId,
    kind: node.kind,
  }
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: node.id,
    data,
  })

  const def = DEFAULT_NODE_PORTS[node.kind]
  const inPorts = resolvePorts(cfg.inputPorts, def.inputPorts)
  const outPorts = resolvePorts(cfg.outputPorts, def.outputPorts)
  const portDescs = [
    ...inPorts.map((pos, i) => ({ type: 'in' as const, i, pos })),
    ...outPorts.map((pos, i) => ({ type: 'out' as const, i, pos })),
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
        transportId: defaultTransportId,
      }),
    )
  }

  const style: CSSProperties = {
    position: 'absolute',
    left: node.x * pxPerMeter,
    top: node.y * pxPerMeter,
    width: Math.max(MIN_NODE_PX, cfg.width * pxPerMeter),
    height: Math.max(MIN_NODE_PX, cfg.height * pxPerMeter),
    opacity: isDragging ? 0.4 : 1,
  }
  // Ports are a fixed pixel size (user-adjustable) so they stay clickable at any zoom.
  const portStyle: CSSProperties = { width: portScale, height: portScale }

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        e.stopPropagation()
        dispatch(itemSelected({ kind: 'node', id: node.id }))
      }}
      style={style}
      // No z-index: the box stays below the belt layer (z-10) so belts render
      // over it, while its ports (z-30) escape this non-stacking-context box and
      // sit above the belts — same layering as machines.
      className={`flex cursor-grab touch-none items-center justify-center rounded-sm border-2 bg-surface-2 text-[9px] font-bold tracking-wide text-gray-200 active:cursor-grabbing ${
        selected ? 'border-ficsit ring-2 ring-ficsit' : 'border-sky-400/70'
      }`}
      title={node.kind === 'splitter' ? 'Splitter (1 → 3)' : 'Merger (3 → 1)'}
      {...attributes}
      {...listeners}
    >
      {node.kind === 'splitter' ? 'SPL' : 'MRG'}

      {portDescs.map((p) => {
        const wrap: CSSProperties = { ...portPosStyle(p.pos), zIndex: 30 }
        if (p.type === 'in') {
          const valid = Boolean(pendingFrom) && !isSelf
          return (
            <span key={`in-${p.i}`} style={wrap}>
              <button
                type="button"
                data-port={`${node.id}::in::${p.i}`}
                aria-label="Input port"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  completeTo(p.i)
                }}
                style={portStyle}
                className={`block bg-sky-400 ${portBase} ${
                  valid ? 'scale-125 ring-2 ring-emerald-400' : 'ring-sky-200/50'
                }`}
              />
            </span>
          )
        }
        const isSrc = isSelf && pendingFrom.port === p.i
        return (
          <span key={`out-${p.i}`} style={wrap}>
            <button
              type="button"
              data-port={`${node.id}::out::${p.i}`}
              aria-label="Output port"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                pickSource(p.i)
              }}
              style={portStyle}
              className={`block bg-ficsit ${portBase} ${
                isSrc ? 'scale-125 ring-2 ring-ficsit' : 'ring-ficsit/50'
              }`}
            />
          </span>
        )
      })}

    </div>
  )
}
