import { useAppSelector } from '@/app/hooks'
import { PortEditorToolbar, portEditorWidth } from '@/features/ports'

import { selectExtractorCount, selectExtractors } from '../selectors'
import { ExtractorCard } from './ExtractorCard'
import { ExtractorForm } from './ExtractorForm'

/** Card padding + border around the editor, so a zoomed editor still fits. */
const CARD_CHROME_PX = 28
const MIN_CARD_PX = 240 // 15rem — the base card width

/** Page for defining extractors (miners) that produce materials. */
export function ExtractorManager() {
  const extractors = useAppSelector(selectExtractors)
  const count = useAppSelector(selectExtractorCount)
  // Card columns widen with the editor zoom so it never gets cramped inside.
  const editor = useAppSelector((s) => s.portEditor.extractors)
  const minCol = Math.max(
    MIN_CARD_PX,
    portEditorWidth(editor.zoom, editor.portScale) + CARD_CHROME_PX,
  )

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
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${minCol}px, 1fr))`,
              }}
            >
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
