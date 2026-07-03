import { useAppSelector } from '@/app/hooks'
import { PortEditorToolbar } from '@/features/ports'

import { selectExtractorCount, selectExtractors } from '../selectors'
import { ExtractorCard } from './ExtractorCard'
import { ExtractorForm } from './ExtractorForm'

/** Page for defining extractors (miners) that produce materials. */
export function ExtractorManager() {
  const extractors = useAppSelector(selectExtractors)
  const count = useAppSelector(selectExtractorCount)

  return (
    <section className="flex h-full flex-col gap-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-100">Extractors</h1>
          <p className="text-sm text-gray-500">
            Miners / extractors. Base rate = Mk.1 on a Normal node at 100%.
          </p>
        </div>
        <PortEditorToolbar page="extractors" />
        <dl className="text-right">
          <dt className="text-xs text-gray-500">Defined</dt>
          <dd className="font-mono text-lg text-ficsit">{count}</dd>
        </dl>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[20rem_1fr] gap-4">
        <div className="min-h-0 overflow-y-auto">
          <ExtractorForm />
        </div>

        <div className="min-h-0 overflow-y-auto">
          {count === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-edge bg-surface-1/50 p-10 text-center text-gray-400">
              No extractors yet. Create one on the left.
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
              {extractors.map((e, i) => (
                <ExtractorCard key={e.id} extractor={e} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
