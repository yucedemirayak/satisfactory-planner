import { useAppSelector } from '@/app/hooks'
import { PortEditorToolbar, portEditorWidth } from '@/features/ports'

import { selectGeneratorCount, selectGenerators } from '../selectors'
import { GeneratorCard } from './GeneratorCard'
import { GeneratorForm } from './GeneratorForm'

/** Card padding + border around the editor, so a zoomed editor still fits. */
const CARD_CHROME_PX = 28
const MIN_CARD_PX = 240 // 15rem — the base card width

/** Page for defining power generators (MW producers placed onto floors). */
export function GeneratorManager() {
  const generators = useAppSelector(selectGenerators)
  const count = useAppSelector(selectGeneratorCount)
  // Card columns widen with the editor zoom so it never gets cramped inside.
  const editor = useAppSelector((s) => s.portEditor.generators)
  const minCol = Math.max(
    MIN_CARD_PX,
    portEditorWidth(editor.zoom, editor.portScale) + CARD_CHROME_PX,
  )

  return (
    <section className="flex h-full flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-100">Generators</h1>
          <p className="text-sm text-gray-500">
            Power producers. MW and fuel burn at 100% clock — generators scale
            linearly with clock; no fuels = geothermal (purity-scaled).
          </p>
        </div>
        <PortEditorToolbar page="generators" />
        <dl className="text-right">
          <dt className="text-xs text-gray-500">Defined</dt>
          <dd className="font-mono text-lg text-ficsit">{count}</dd>
        </dl>
      </header>

      <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-1 gap-4 overflow-y-auto lg:auto-rows-auto lg:grid-cols-[20rem_1fr] lg:overflow-visible">
        <div className="min-h-0 overflow-y-auto">
          <GeneratorForm />
        </div>

        <div className="min-h-0 overflow-y-auto">
          {count === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-edge bg-surface-1/50 p-10 text-center text-gray-400">
              No generators yet. Create one on the left.
            </div>
          ) : (
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${minCol}px, 1fr))`,
              }}
            >
              {generators.map((g, i) => (
                <GeneratorCard key={g.id} generator={g} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
