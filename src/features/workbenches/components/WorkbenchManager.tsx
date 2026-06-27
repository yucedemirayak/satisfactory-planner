import { useAppSelector } from '@/app/hooks'

import { selectWorkbenchCount, selectWorkbenches } from '../selectors'
import { WorkbenchCard } from './WorkbenchCard'
import { WorkbenchForm } from './WorkbenchForm'

/** Page for defining the catalogue of workbenches to place onto floors later. */
export function WorkbenchManager() {
  const workbenches = useAppSelector(selectWorkbenches)
  const count = useAppSelector(selectWorkbenchCount)

  return (
    <section className="flex h-full flex-col gap-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-100">Workbenches</h1>
          <p className="text-sm text-gray-500">
            Define your workbenches and their footprint.
          </p>
        </div>
        <dl className="text-right">
          <dt className="text-xs text-gray-500">Defined</dt>
          <dd className="font-mono text-lg text-ficsit">{count}</dd>
        </dl>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[20rem_1fr] gap-4">
        <div className="min-h-0 overflow-y-auto">
          <WorkbenchForm />
        </div>

        <div className="min-h-0 overflow-y-auto">
          {count === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-edge bg-surface-1/50 p-10 text-center text-gray-400">
              No workbenches yet. Create one on the left.
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
              {workbenches.map((wb, i) => (
                <WorkbenchCard key={wb.id} workbench={wb} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
