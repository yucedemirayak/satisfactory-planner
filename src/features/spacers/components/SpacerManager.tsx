import { useAppSelector } from '@/app/hooks'

import { selectSpacerCount, selectSpacers } from '../selectors'
import { SpacerCard } from './SpacerCard'
import { SpacerForm } from './SpacerForm'

/** Page for defining the catalogue of spacers to place between workbenches. */
export function SpacerManager() {
  const spacers = useAppSelector(selectSpacers)
  const count = useAppSelector(selectSpacerCount)

  return (
    <section className="flex h-full flex-col gap-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-100">Spacers</h1>
          <p className="text-sm text-gray-500">
            Define reusable gaps to place between workbenches.
          </p>
        </div>
        <dl className="text-right">
          <dt className="text-xs text-gray-500">Defined</dt>
          <dd className="font-mono text-lg text-ficsit">{count}</dd>
        </dl>
      </header>

      <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-1 gap-4 overflow-y-auto lg:auto-rows-auto lg:grid-cols-[20rem_1fr] lg:overflow-visible">
        <div className="min-h-0 overflow-y-auto">
          <SpacerForm />
        </div>

        <div className="min-h-0 overflow-y-auto">
          {count === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-edge bg-surface-1/50 p-10 text-center text-gray-400">
              No spacers yet. Create one on the left.
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
              {spacers.map((sp, i) => (
                <SpacerCard key={sp.id} spacer={sp} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
