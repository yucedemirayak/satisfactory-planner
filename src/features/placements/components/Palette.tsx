import { Link } from 'react-router-dom'

import { useAppSelector } from '@/app/hooks'
import { PATHS } from '@/app/paths'
import { extractorLabel, selectExtractors } from '@/features/extractors'
import { workbenchLabel } from '@/features/workbenches/helpers'
import { selectWorkbenches } from '@/features/workbenches/selectors'

import { PaletteItem } from './PaletteItem'

function EmptyHint({ to, label }: { to: string; label: string }) {
  return (
    <div className="rounded-md border border-dashed border-edge p-3 text-center text-xs text-gray-500">
      None yet.{' '}
      <Link to={to} className="text-ficsit hover:underline">
        {label}
      </Link>
      .
    </div>
  )
}

/** Sidebar of draggable workbenches and extractors to drop onto floors. */
export function Palette() {
  const workbenches = useAppSelector(selectWorkbenches)
  const extractors = useAppSelector(selectExtractors)

  return (
    // max-h caps the palette when the page stacks on mobile (own scroll);
    // desktop columns give it a real height so max-h-none restores h-full.
    <aside className="flex h-full max-h-40 flex-col gap-4 overflow-y-auto rounded-lg border border-edge bg-surface-1 p-3 lg:max-h-none">
      <section className="flex flex-col gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-gray-300 uppercase">
            Workbenches
          </h2>
          <p className="text-xs text-gray-500">Drag onto a floor.</p>
        </div>
        {workbenches.length === 0 ? (
          <EmptyHint to={PATHS.workbenches} label="Create some" />
        ) : (
          workbenches.map((wb, i) => (
            <PaletteItem
              key={wb.id}
              dndId={`palette-wb-${wb.id}`}
              data={{ type: 'palette', kind: 'workbench', refId: wb.id }}
            >
              <span
                className="size-4 shrink-0 rounded-sm border"
                style={{
                  borderColor: wb.color,
                  backgroundColor: `${wb.color}33`,
                }}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-200">
                {workbenchLabel(wb, i)}
              </span>
              <span className="shrink-0 font-mono text-xs text-gray-500">
                {wb.width}×{wb.height}
              </span>
            </PaletteItem>
          ))
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-gray-300 uppercase">
            Extractors
          </h2>
          <p className="text-xs text-gray-500">Drag onto a floor.</p>
        </div>
        {extractors.length === 0 ? (
          <EmptyHint to={PATHS.extractors} label="Create some" />
        ) : (
          extractors.map((ex, i) => (
            <PaletteItem
              key={ex.id}
              dndId={`palette-ex-${ex.id}`}
              data={{ type: 'palette', kind: 'extractor', refId: ex.id }}
            >
              <span
                className="size-4 shrink-0 rounded-sm border"
                style={{
                  borderColor: ex.color,
                  backgroundColor: `${ex.color}33`,
                }}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-200">
                {extractorLabel(ex, i)}
              </span>
              <span className="shrink-0 font-mono text-xs text-gray-500">
                {ex.width}×{ex.height}
              </span>
            </PaletteItem>
          ))
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-gray-300 uppercase">
            Routing
          </h2>
          <p className="text-xs text-gray-500">
            Split / merge belts. Drop anywhere.
          </p>
        </div>
        {(
          [
            { kind: 'splitter', label: 'Splitter', flow: '1 → 3' },
            { kind: 'merger', label: 'Merger', flow: '3 → 1' },
          ] as const
        ).map(({ kind, label, flow }) => (
          <PaletteItem
            key={kind}
            dndId={`palette-node-${kind}`}
            data={{ type: 'palette-node', kind }}
          >
            <span className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-sky-400/70 text-[8px] font-bold text-sky-300">
              {kind === 'splitter' ? 'S' : 'M'}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-gray-200">
              {label}
            </span>
            <span className="shrink-0 font-mono text-xs text-gray-500">
              {flow}
            </span>
          </PaletteItem>
        ))}
      </section>
    </aside>
  )
}
