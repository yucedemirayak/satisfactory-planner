import { useAppSelector } from '@/app/hooks'

import { selectConveyorCount, selectConveyors } from '../selectors'
import { ConveyorCard } from './ConveyorCard'
import { ConveyorForm } from './ConveyorForm'

/** Page for defining conveyor belt tiers and their max throughput. */
export function ConveyorManager() {
  const conveyors = useAppSelector(selectConveyors)
  const count = useAppSelector(selectConveyorCount)

  return (
    <section className="flex h-full flex-col gap-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-100">Conveyors</h1>
          <p className="text-sm text-gray-500">
            Belt tiers and their max throughput in items/min.
          </p>
        </div>
        <dl className="text-right">
          <dt className="text-xs text-gray-500">Defined</dt>
          <dd className="font-mono text-lg text-ficsit">{count}</dd>
        </dl>
      </header>

      <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-1 gap-4 overflow-y-auto lg:auto-rows-auto lg:grid-cols-[20rem_1fr] lg:overflow-visible">
        <div className="min-h-0 overflow-y-auto">
          <ConveyorForm />
        </div>

        <div className="min-h-0 overflow-y-auto">
          {count === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-edge bg-surface-1/50 p-10 text-center text-gray-400">
              No conveyors yet. Create one on the left.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {conveyors.map((c, i) => (
                <ConveyorCard key={c.id} conveyor={c} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
