import { useAppSelector } from '@/app/hooks'
import { selectPxPerMeter } from '@/features/floors/selectors'

import { MIN_NODE_PX } from '../constants'
import type { NodeKind } from '../types'

/** Floating clone rendered in the DragOverlay while dragging a route node. */
export function NodePreview({ kind }: { kind: NodeKind }) {
  const pxPerMeter = useAppSelector(selectPxPerMeter)
  const size = useAppSelector((s) => s.nodeTypes[kind])
  return (
    <div
      style={{
        width: Math.max(MIN_NODE_PX, size.width * pxPerMeter),
        height: Math.max(MIN_NODE_PX, size.height * pxPerMeter),
      }}
      className="flex scale-105 cursor-grabbing items-center justify-center rounded-sm border-2 border-sky-400/80 bg-surface-2 text-[9px] font-bold tracking-wide text-gray-200 shadow-2xl shadow-black/50 ring-2 ring-ficsit/40"
    >
      {kind === 'splitter' ? 'SPL' : 'MRG'}
    </div>
  )
}
