import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Link } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { PATHS } from '@/app/paths'
import { selectMaterials } from '@/features/materials'
import { selectProductionBalance } from '@/features/placements'
import { productOrderChanged, selectProductionOrder } from '@/features/production'
import { selectProducts } from '@/features/products'

const fmt = (n: number) => Number(n.toFixed(3)).toString()
const EPS = 1e-6

function netClass(net: number): string {
  if (net > EPS) return 'text-emerald-400'
  if (net < -EPS) return 'text-red-400'
  return 'text-gray-500'
}

function netLabel(net: number): string {
  return net > EPS ? `+${fmt(net)}` : fmt(net)
}

interface Row {
  refId: string
  name: string
  produced: number
  consumed: number
  net: number
}

function SortableRow({ row }: { row: Row }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.refId })

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="border-t border-edge bg-surface-1 odd:bg-surface-1/40"
    >
      <td className="w-8 px-2 py-2 text-center">
        <button
          type="button"
          className="cursor-grab touch-none text-gray-500 transition hover:text-ficsit active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
      </td>
      <td className="px-4 py-2 text-gray-200">{row.name}</td>
      <td className="px-4 py-2 text-right font-mono text-gray-300">
        {fmt(row.produced)}
      </td>
      <td className="px-4 py-2 text-right font-mono text-gray-300">
        {fmt(row.consumed)}
      </td>
      <td
        className={`px-4 py-2 text-right font-mono font-semibold ${netClass(row.net)}`}
      >
        {netLabel(row.net)}
      </td>
    </tr>
  )
}

/** Factory-wide production balance with drag-to-reorder rows. */
function ProductionPage() {
  const dispatch = useAppDispatch()
  const balance = useAppSelector(selectProductionBalance)
  const products = useAppSelector(selectProducts)
  const materials = useAppSelector(selectMaterials)
  const order = useAppSelector(selectProductionOrder)

  const nameOf = (id: string) =>
    products.find((p) => p.id === id)?.name ||
    materials.find((m) => m.id === id)?.name ||
    'Unknown'

  // Ordered ids first (by saved order), the rest appended alphabetically.
  const orderIndex = new Map(order.map((id, i) => [id, i]))
  const rows: Row[] = balance
    .map((b) => ({ ...b, name: nameOf(b.refId) }))
    .sort((a, b) => {
      const ai = orderIndex.get(a.refId) ?? Infinity
      const bi = orderIndex.get(b.refId) ?? Infinity
      return ai !== bi ? ai - bi : a.name.localeCompare(b.name)
    })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = rows.map((r) => r.refId)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from === -1 || to === -1) return
    const shown = arrayMove(ids, from, to)
    const shownSet = new Set(shown)
    // Keep previously-ordered-but-not-shown ids after the visible ones.
    dispatch(
      productOrderChanged([...shown, ...order.filter((id) => !shownSet.has(id))]),
    )
  }

  return (
    <section className="flex h-full flex-col gap-4">
      <header>
        <h1 className="text-lg font-bold text-gray-100">Production</h1>
        <p className="text-sm text-gray-500">
          Factory-wide totals per minute — gross produced, gross consumed, and
          net (surplus / deficit). Drag rows to reorder.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-edge bg-surface-1/50 p-10 text-center text-gray-400">
          Nothing produced yet. Assign recipes to workbenches on the{' '}
          <Link to={PATHS.floors} className="text-ficsit hover:underline">
            Floor&nbsp;Plan
          </Link>
          .
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-edge">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-surface-2 text-xs tracking-wide text-gray-400 uppercase">
              <tr>
                <th className="w-8 px-2 py-2" />
                <th className="px-4 py-2 text-left font-semibold">Product</th>
                <th className="px-4 py-2 text-right font-semibold">Produced</th>
                <th className="px-4 py-2 text-right font-semibold">Consumed</th>
                <th className="px-4 py-2 text-right font-semibold">Net</th>
              </tr>
            </thead>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={rows.map((r) => r.refId)}
                strategy={verticalListSortingStrategy}
              >
                <tbody>
                  {rows.map((r) => (
                    <SortableRow key={r.refId} row={r} />
                  ))}
                </tbody>
              </SortableContext>
            </DndContext>
          </table>
        </div>
      )}
    </section>
  )
}

export default ProductionPage
