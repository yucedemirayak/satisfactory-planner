import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectConveyors } from '@/features/conveyors'
import { selectRefNames } from '@/features/recipes/selectors'

import { connectionConveyorChanged, connectionRemoved } from '../connectionsSlice'
import { selectConnectionViews, selectSelectedConnectionId } from '../selectors'

const round = (n: number) => Math.round(n * 100) / 100

/** Right-column editor for the selected connection: belt tier, flow, delete. */
export function ConnectionInspector() {
  const dispatch = useAppDispatch()
  const selectedId = useAppSelector(selectSelectedConnectionId)
  const views = useAppSelector(selectConnectionViews)
  const conveyors = useAppSelector(selectConveyors)
  const refNames = useAppSelector(selectRefNames)

  const view = views.find((v) => v.id === selectedId)
  if (!view)
    return (
      <div className="rounded-lg border border-edge bg-surface-1 p-4">
        <p className="text-sm text-gray-500">Select a connection to edit.</p>
      </div>
    )

  const itemName = view.itemRefId
    ? (refNames[view.itemRefId] ?? 'Item')
    : 'Unknown'

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-edge bg-surface-1 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-gray-100">Connection</h2>
        <button
          type="button"
          onClick={() => dispatch(connectionRemoved(view.id))}
          className="rounded px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/15"
        >
          Delete
        </button>
      </div>

      <p className="text-sm text-gray-300">
        Carrying <span className="font-medium text-ficsit">{itemName}</span>
      </p>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-400">Conveyor</span>
        <select
          value={view.conveyorId}
          onChange={(e) =>
            dispatch(
              connectionConveyorChanged({
                id: view.id,
                conveyorId: e.target.value,
              }),
            )
          }
          className="rounded-md border border-edge bg-surface-0 px-2 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit"
        >
          {conveyors.length === 0 && <option value="">No conveyors defined</option>}
          {conveyors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.maxRate}/min)
            </option>
          ))}
        </select>
      </label>

      <dl className="grid grid-cols-2 gap-2">
        <div>
          <dt className="text-xs text-gray-500">Flow</dt>
          <dd
            className={`font-mono text-sm ${view.overCapacity ? 'text-red-400' : 'text-gray-100'}`}
          >
            {round(view.sourceRate)}/min
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Capacity</dt>
          <dd className="font-mono text-sm text-gray-100">{view.capacity}/min</dd>
        </div>
      </dl>

      {view.overCapacity && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300">
          ⚠ Flow exceeds belt capacity — use a faster conveyor or split the line.
        </p>
      )}

      {view.mismatch && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-300">
          ⚠ Item mismatch — this belt's item doesn't match the target input (or a
          merger is mixing different items).
        </p>
      )}
    </div>
  )
}
