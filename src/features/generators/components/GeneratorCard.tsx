import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectMaterials } from '@/features/materials'
import {
  PortGridEditor,
  edgePorts,
  resolvePorts,
  type EditablePort,
} from '@/features/ports'
import { selectProducts } from '@/features/products'
import { WorkbenchPreview } from '@/features/workbenches'

import {
  MAX_FUEL_RATE,
  MAX_GENERATOR_DIM,
  MAX_GENERATOR_POWER,
  MIN_FUEL_RATE,
  MIN_GENERATOR_DIM,
  MIN_GENERATOR_POWER,
} from '../constants'
import {
  generatorPortPosChanged,
  generatorRemoved,
  generatorUpdated,
} from '../generatorsSlice'
import { generatorLabel, generatorPortCounts } from '../helpers'
import type { Generator, GeneratorFuel } from '../types'

interface GeneratorCardProps {
  generator: Generator
  index: number
}

const dimInput =
  'w-full rounded-md border border-edge bg-surface-0 px-2 py-1 text-center font-mono text-sm text-gray-100 outline-none focus:border-ficsit'
const selectInput =
  'w-full rounded-md border border-edge bg-surface-0 px-2 py-1 text-sm text-gray-100 outline-none focus:border-ficsit'

/** A created generator: footprint, MW, water intake, fuel list and ports. */
export function GeneratorCard({ generator, index }: GeneratorCardProps) {
  const dispatch = useAppDispatch()
  const update = (changes: Parameters<typeof generatorUpdated>[0]['changes']) =>
    dispatch(generatorUpdated({ id: generator.id, changes }))
  const editor = useAppSelector((s) => s.portEditor.generators)
  const products = useAppSelector(selectProducts)
  const materials = useAppSelector(selectMaterials)

  const setFuel = (i: number, changes: Partial<GeneratorFuel>) =>
    update({
      fuels: generator.fuels.map((f, fi) => (fi === i ? { ...f, ...changes } : f)),
    })

  const counts = generatorPortCounts(generator)
  const ports: EditablePort[] = [
    ...resolvePorts(generator.inputPorts, edgePorts(counts.inputs, 'left')).map(
      (pos, portIndex) => ({ side: 'inputs' as const, index: portIndex, pos }),
    ),
    ...resolvePorts(generator.outputPorts, edgePorts(counts.outputs, 'right')).map(
      (pos, portIndex) => ({ side: 'outputs' as const, index: portIndex, pos }),
    ),
  ]

  // Fuels can be products or materials; byproducts are products (waste).
  const itemOptions = (
    <>
      <option value="">— pick an item —</option>
      <optgroup label="Products">
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="Materials">
        {materials.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </optgroup>
    </>
  )

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-edge bg-surface-1 p-3">
      <div className="flex items-start gap-3">
        <WorkbenchPreview
          width={generator.width}
          height={generator.height}
          color={generator.color}
          boxPx={72}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            type="text"
            value={generator.name}
            placeholder={generatorLabel(generator, index)}
            onChange={(e) => update({ name: e.target.value })}
            className="w-full rounded-md border border-edge bg-surface-0 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit"
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={generator.color}
              onChange={(e) => update({ color: e.target.value })}
              className="size-7 shrink-0 cursor-pointer rounded border border-edge bg-surface-0"
              aria-label="Color"
            />
            <button
              type="button"
              onClick={() => dispatch(generatorRemoved(generator.id))}
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
            min={MIN_GENERATOR_DIM}
            max={MAX_GENERATOR_DIM}
            step="any"
            value={generator.width}
            onChange={(e) => update({ width: Number(e.target.value) })}
            className={dimInput}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Depth (m)</span>
          <input
            type="number"
            min={MIN_GENERATOR_DIM}
            max={MAX_GENERATOR_DIM}
            step="any"
            value={generator.depth}
            onChange={(e) => update({ depth: Number(e.target.value) })}
            className={dimInput}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Height (m)</span>
          <input
            type="number"
            min={MIN_GENERATOR_DIM}
            max={MAX_GENERATOR_DIM}
            step="any"
            value={generator.height}
            onChange={(e) => update({ height: Number(e.target.value) })}
            className={dimInput}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Power (MW)</span>
          <input
            type="number"
            min={MIN_GENERATOR_POWER}
            max={MAX_GENERATOR_POWER}
            step="any"
            value={generator.powerOutput}
            onChange={(e) => update({ powerOutput: Number(e.target.value) })}
            className={dimInput}
          />
        </label>
      </div>

      {/* Water intake: constant while running, same for every fuel. */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-400">Water intake</span>
        <div className="flex items-center gap-2">
          <select
            value={generator.water?.refId ?? ''}
            onChange={(e) =>
              update({
                water: e.target.value
                  ? { refId: e.target.value, rate: generator.water?.rate ?? 0 }
                  : null,
              })
            }
            className={selectInput}
            aria-label="Water item"
          >
            <option value="">None</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          {generator.water && (
            <input
              type="number"
              min={MIN_FUEL_RATE}
              max={MAX_FUEL_RATE}
              step="any"
              value={generator.water.rate}
              onChange={(e) =>
                update({
                  water: { ...generator.water!, rate: Number(e.target.value) },
                })
              }
              className={`w-24 ${dimInput}`}
              aria-label="Water per minute"
            />
          )}
        </div>
      </div>

      {/* Fuel options; empty list = geothermal-style (purity-scaled, always on). */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">
            Fuels (per minute at 100%)
          </span>
          <button
            type="button"
            onClick={() =>
              update({
                fuels: [...generator.fuels, { refId: '', rate: 0, byproduct: null }],
              })
            }
            className="rounded border border-dashed border-edge px-1.5 py-0.5 text-xs text-gray-400 transition hover:border-ficsit hover:text-ficsit"
          >
            + Fuel
          </button>
        </div>
        {generator.fuels.length === 0 && (
          <p className="text-xs text-gray-500">
            No fuels — runs for free, output scales with node purity
            (geothermal).
          </p>
        )}
        {generator.fuels.map((f, i) => (
          <div
            key={i}
            className="flex flex-col gap-1.5 rounded-md border border-edge bg-surface-0 p-2"
          >
            <div className="flex items-center gap-1.5">
              <select
                value={f.refId}
                onChange={(e) => setFuel(i, { refId: e.target.value })}
                className={selectInput}
                aria-label="Fuel item"
              >
                {itemOptions}
              </select>
              <input
                type="number"
                min={MIN_FUEL_RATE}
                max={MAX_FUEL_RATE}
                step="any"
                value={f.rate}
                onChange={(e) => setFuel(i, { rate: Number(e.target.value) })}
                className={`w-24 ${dimInput}`}
                aria-label="Fuel per minute"
              />
              <button
                type="button"
                onClick={() =>
                  update({ fuels: generator.fuels.filter((_, fi) => fi !== i) })
                }
                className="rounded px-1.5 py-0.5 text-red-400 transition hover:bg-red-500/15"
                aria-label="Remove fuel"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 text-xs text-gray-500">Waste</span>
              <select
                value={f.byproduct?.refId ?? ''}
                onChange={(e) =>
                  setFuel(i, {
                    byproduct: e.target.value
                      ? { refId: e.target.value, rate: f.byproduct?.rate ?? 0 }
                      : null,
                  })
                }
                className={selectInput}
                aria-label="Waste item"
              >
                <option value="">None</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {f.byproduct && (
                <input
                  type="number"
                  min={MIN_FUEL_RATE}
                  max={MAX_FUEL_RATE}
                  step="any"
                  value={f.byproduct.rate}
                  onChange={(e) =>
                    setFuel(i, {
                      byproduct: { ...f.byproduct!, rate: Number(e.target.value) },
                    })
                  }
                  className={`w-24 ${dimInput}`}
                  aria-label="Waste per minute"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {ports.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-gray-400">
            Port layout — in: fuel{generator.water ? ', water' : ''}
            {counts.outputs > 0 ? ' · out: waste' : ''}
          </span>
          <PortGridEditor
            width={generator.width}
            height={generator.height}
            gridSize={editor.gridSize}
            portScale={editor.portScale}
            zoom={editor.zoom}
            ports={ports}
            onMove={(side, portIndex, pos) =>
              dispatch(
                generatorPortPosChanged({
                  id: generator.id,
                  side: side === 'inputs' ? 'in' : 'out',
                  index: portIndex,
                  pos,
                }),
              )
            }
          />
        </div>
      )}
    </div>
  )
}
