import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  PortEditorToolbar,
  PortGridEditor,
  resolvePorts,
  type EditablePort,
} from '@/features/ports'

import { MAX_NODE_SIZE, MIN_NODE_SIZE } from '../constants'
import {
  DEFAULT_NODE_PORTS,
  nodePortPosChanged,
  nodeSizeChanged,
} from '../nodeTypesSlice'
import { nodePortCounts, type NodeKind } from '../types'

const KINDS: { kind: NodeKind; label: string }[] = [
  { kind: 'splitter', label: 'Splitter' },
  { kind: 'merger', label: 'Merger' },
]

const stepperBtn =
  'flex size-6 items-center justify-center rounded border border-edge bg-surface-2 text-gray-300 transition hover:border-ficsit hover:text-ficsit'

function DimField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">{label}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(value - 0.5)}
            className={stepperBtn}
            aria-label={`Decrease ${label}`}
          >
            −
          </button>
          <input
            type="number"
            min={MIN_NODE_SIZE}
            max={MAX_NODE_SIZE}
            step={0.5}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-16 rounded-md border border-edge bg-surface-0 px-2 py-1 text-center font-mono text-sm text-gray-100 outline-none focus:border-ficsit"
          />
          <button
            type="button"
            onClick={() => onChange(value + 0.5)}
            className={stepperBtn}
            aria-label={`Increase ${label}`}
          >
            +
          </button>
          <span className="ml-1 text-xs text-gray-500">m</span>
        </div>
      </div>
      <input
        type="range"
        min={MIN_NODE_SIZE}
        max={MAX_NODE_SIZE}
        step={0.5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-ficsit"
      />
    </div>
  )
}

function RoutingCard({ kind, label }: { kind: NodeKind; label: string }) {
  const dispatch = useAppDispatch()
  const size = useAppSelector((s) => s.nodeTypes[kind])
  const editor = useAppSelector((s) => s.portEditor.routing)
  const { inputs, outputs } = nodePortCounts(kind)
  const set = (changes: { width?: number; height?: number }) =>
    dispatch(nodeSizeChanged({ kind, changes }))

  const def = DEFAULT_NODE_PORTS[kind]
  const ports: EditablePort[] = [
    ...resolvePorts(size.inputPorts, def.inputPorts).map((pos, index) => ({
      side: 'inputs' as const,
      index,
      pos,
    })),
    ...resolvePorts(size.outputPorts, def.outputPorts).map((pos, index) => ({
      side: 'outputs' as const,
      index,
      pos,
    })),
  ]

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-edge bg-surface-1 p-4">
      <header className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-300 uppercase">
          <span className="flex size-5 items-center justify-center rounded-sm border border-sky-400/70 text-[9px] font-bold text-sky-300">
            {kind === 'splitter' ? 'S' : 'M'}
          </span>
          {label}
        </h2>
        <span className="font-mono text-xs text-gray-500">
          {inputs} → {outputs}
        </span>
      </header>
      <DimField
        label="Width"
        value={size.width}
        onChange={(v) => set({ width: v })}
      />
      <DimField
        label="Height"
        value={size.height}
        onChange={(v) => set({ height: v })}
      />

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-gray-400">Port layout</span>
        <PortGridEditor
          width={size.width}
          height={size.height}
          gridSize={editor.gridSize}
          portScale={editor.portScale}
          zoom={editor.zoom}
          ports={ports}
          onMove={(side, index, pos) =>
            dispatch(nodePortPosChanged({ kind, side, index, pos }))
          }
        />
      </div>
    </div>
  )
}

/** Page for editing splitter / merger footprints (metres, like other elements). */
export function RoutingManager() {
  return (
    <section className="flex h-full flex-col gap-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-100">Routing</h1>
          <p className="text-sm text-gray-500">
            Splitter and merger footprints in metres — they scale with the
            floor-plan zoom, like machines.
          </p>
        </div>
        <PortEditorToolbar page="routing" />
      </header>

      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {KINDS.map(({ kind, label }) => (
          <RoutingCard key={kind} kind={kind} label={label} />
        ))}
      </div>
    </section>
  )
}
