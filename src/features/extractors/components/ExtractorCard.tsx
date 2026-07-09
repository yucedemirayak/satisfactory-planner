import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  PortGridEditor,
  centerPorts,
  resolvePorts,
  type EditablePort,
} from '@/features/ports'
import { WorkbenchPreview } from '@/features/workbenches'

import {
  MAX_EXTRACTOR_BASE_RATE,
  MAX_EXTRACTOR_DIM,
  MAX_EXTRACTOR_OUTPUTS,
  MAX_EXTRACTOR_POWER,
  MIN_EXTRACTOR_BASE_RATE,
  MIN_EXTRACTOR_DIM,
  MIN_EXTRACTOR_OUTPUTS,
  MIN_EXTRACTOR_POWER,
} from '../constants'
import {
  extractorPortPosChanged,
  extractorRemoved,
  extractorUpdated,
} from '../extractorsSlice'
import { extractorLabel } from '../helpers'
import type { Extractor } from '../types'

interface ExtractorCardProps {
  extractor: Extractor
  index: number
}

const dimInput =
  'w-full rounded-md border border-edge bg-surface-0 px-2 py-1 text-center font-mono text-sm text-gray-100 outline-none focus:border-ficsit'

/** A created extractor with inline-editable footprint, base rate and colour. */
export function ExtractorCard({ extractor, index }: ExtractorCardProps) {
  const dispatch = useAppDispatch()
  const update = (changes: Parameters<typeof extractorUpdated>[0]['changes']) =>
    dispatch(extractorUpdated({ id: extractor.id, changes }))
  const editor = useAppSelector((s) => s.portEditor.extractors)

  // Extractors only output — every editable port is an output slot.
  const ports: EditablePort[] = resolvePorts(
    extractor.outputPorts,
    centerPorts(extractor.outputs),
  ).map((pos, portIndex) => ({ side: 'outputs' as const, index: portIndex, pos }))

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-edge bg-surface-1 p-3">
      <div className="flex items-start gap-3">
        <WorkbenchPreview
          width={extractor.width}
          height={extractor.height}
          color={extractor.color}
          boxPx={72}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            type="text"
            value={extractor.name}
            placeholder={extractorLabel(extractor, index)}
            onChange={(e) => update({ name: e.target.value })}
            className="w-full rounded-md border border-edge bg-surface-0 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit"
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={extractor.color}
              onChange={(e) => update({ color: e.target.value })}
              className="size-7 shrink-0 cursor-pointer rounded border border-edge bg-surface-0"
              aria-label="Color"
            />
            <button
              type="button"
              onClick={() => dispatch(extractorRemoved(extractor.id))}
              className="ml-auto rounded px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/15"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Width (m)</span>
          <input
            type="number"
            min={MIN_EXTRACTOR_DIM}
            max={MAX_EXTRACTOR_DIM}
            step="any"
            value={extractor.width}
            onChange={(e) => update({ width: Number(e.target.value) })}
            className={dimInput}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Depth (m)</span>
          <input
            type="number"
            min={MIN_EXTRACTOR_DIM}
            max={MAX_EXTRACTOR_DIM}
            step="any"
            value={extractor.depth}
            onChange={(e) => update({ depth: Number(e.target.value) })}
            className={dimInput}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Height (m)</span>
          <input
            type="number"
            min={MIN_EXTRACTOR_DIM}
            max={MAX_EXTRACTOR_DIM}
            step="any"
            value={extractor.height}
            onChange={(e) => update({ height: Number(e.target.value) })}
            className={dimInput}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Rate /min</span>
          <input
            type="number"
            min={MIN_EXTRACTOR_BASE_RATE}
            max={MAX_EXTRACTOR_BASE_RATE}
            step="any"
            value={extractor.baseRate}
            onChange={(e) => update({ baseRate: Number(e.target.value) })}
            className={dimInput}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Outputs</span>
          <input
            type="number"
            min={MIN_EXTRACTOR_OUTPUTS}
            max={MAX_EXTRACTOR_OUTPUTS}
            value={extractor.outputs}
            onChange={(e) => update({ outputs: Number(e.target.value) })}
            className={dimInput}
          />
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-400">
          Power (MW) — Mk.1 / Mk.2 / Mk.3
        </span>
        <div className="grid grid-cols-3 gap-2">
          {([1, 2, 3] as const).map((mk) => (
            <input
              key={mk}
              type="number"
              min={MIN_EXTRACTOR_POWER}
              max={MAX_EXTRACTOR_POWER}
              step="any"
              value={extractor.powerUsage[mk]}
              aria-label={`Power Mk.${mk} (MW)`}
              onChange={(e) =>
                update({
                  powerUsage: {
                    ...extractor.powerUsage,
                    [mk]: Number(e.target.value),
                  },
                })
              }
              className={dimInput}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-gray-400">Port layout</span>
        <PortGridEditor
          width={extractor.width}
          height={extractor.height}
          gridSize={editor.gridSize}
          portScale={editor.portScale}
          zoom={editor.zoom}
          ports={ports}
          onMove={(_side, portIndex, pos) =>
            dispatch(
              extractorPortPosChanged({ id: extractor.id, index: portIndex, pos }),
            )
          }
        />
      </div>
    </div>
  )
}
