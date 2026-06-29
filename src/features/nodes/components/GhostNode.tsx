import { useAppSelector } from '@/app/hooks'
import { selectPxPerMeter } from '@/features/floors/selectors'

import { MIN_NODE_PX } from '../constants'
import type { NodeKind } from '../types'

/** Faded silhouette of a route node at its free 2D landing spot while dragging. */
export function GhostNode({
  kind,
  x,
  y,
}: {
  kind: NodeKind
  x: number
  y: number
}) {
  const pxPerMeter = useAppSelector(selectPxPerMeter)
  const size = useAppSelector((s) => s.nodeTypes[kind])
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: x * pxPerMeter,
        top: y * pxPerMeter,
        width: Math.max(MIN_NODE_PX, size.width * pxPerMeter),
        height: Math.max(MIN_NODE_PX, size.height * pxPerMeter),
      }}
      className="pointer-events-none z-20 flex items-center justify-center rounded-sm border-2 border-dashed border-sky-400/70 bg-surface-2/60 text-[9px] font-bold tracking-wide text-gray-300 opacity-60"
    >
      {kind === 'splitter' ? 'SPL' : 'MRG'}
    </div>
  )
}
