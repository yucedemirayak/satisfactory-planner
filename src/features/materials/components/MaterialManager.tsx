import { useAppSelector } from '@/app/hooks'

import { selectMaterialCount, selectMaterials } from '../selectors'
import { MaterialCard } from './MaterialCard'
import { MaterialForm } from './MaterialForm'

/** Page for defining raw materials (extracted, only used as recipe inputs). */
export function MaterialManager() {
  const materials = useAppSelector(selectMaterials)
  const count = useAppSelector(selectMaterialCount)

  return (
    <section className="flex h-full flex-col gap-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-100">Materials</h1>
          <p className="text-sm text-gray-500">
            Raw resources — extracted by miners, only used as recipe inputs.
          </p>
        </div>
        <dl className="text-right">
          <dt className="text-xs text-gray-500">Defined</dt>
          <dd className="font-mono text-lg text-ficsit">{count}</dd>
        </dl>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[20rem_1fr] gap-4">
        <div className="min-h-0 overflow-y-auto">
          <MaterialForm />
        </div>

        <div className="min-h-0 overflow-y-auto">
          {count === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-edge bg-surface-1/50 p-10 text-center text-gray-400">
              No materials yet. Create one on the left.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {materials.map((m, i) => (
                <MaterialCard key={m.id} material={m} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
