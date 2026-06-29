import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectConnectionViews } from '@/features/connections/selectors'
import { selectRefNames } from '@/features/recipes/selectors'

import { nodeRemoved } from '../nodesSlice'
import { selectSelectedNode } from '../selectors'
import { nodePortCounts } from '../types'

const round = (n: number) => Math.round(n * 100) / 100

/** Right-column editor for the selected route node: throughput, item, delete. */
export function NodeInspector() {
  const dispatch = useAppDispatch()
  const node = useAppSelector(selectSelectedNode)
  const views = useAppSelector(selectConnectionViews)
  const refNames = useAppSelector(selectRefNames)

  if (!node)
    return (
      <aside className="rounded-lg border border-edge bg-surface-1 p-4">
        <p className="text-sm text-gray-500">Select a node to edit.</p>
      </aside>
    )

  const { inputs, outputs } = nodePortCounts(node.kind)
  const inViews = views.filter((v) => v.to.ref === 'node' && v.to.id === node.id)
  const outViews = views.filter(
    (v) => v.from.ref === 'node' && v.from.id === node.id,
  )
  const inFlow = inViews.reduce((s, v) => s + v.sourceRate, 0)
  const outFlow = outViews.reduce((s, v) => s + v.sourceRate, 0)
  const itemRefId = inViews.find((v) => v.itemRefId)?.itemRefId ?? ''
  const itemName = itemRefId ? (refNames[itemRefId] ?? 'Item') : 'Unknown'
  const label = node.kind === 'splitter' ? 'Splitter' : 'Merger'

  return (
    <aside className="flex flex-col gap-3 rounded-lg border border-sky-400/40 bg-surface-1 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-gray-300 uppercase">
          {label}{' '}
          <span className="text-gray-500">
            ({inputs} → {outputs})
          </span>
        </h2>
        <button
          type="button"
          onClick={() => dispatch(nodeRemoved(node.id))}
          className="rounded px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/15"
        >
          Delete
        </button>
      </div>

      <p className="text-sm text-gray-300">
        Carrying <span className="font-medium text-ficsit">{itemName}</span>
      </p>

      <dl className="grid grid-cols-2 gap-2">
        <div>
          <dt className="text-xs text-gray-500">In</dt>
          <dd className="font-mono text-sm text-gray-100">{round(inFlow)}/min</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Out</dt>
          <dd className="font-mono text-sm text-gray-100">
            {round(outFlow)}/min
          </dd>
        </div>
      </dl>
    </aside>
  )
}
