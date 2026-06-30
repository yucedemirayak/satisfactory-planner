import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { extractorLabel, selectExtractors } from '@/features/extractors'

import { materialLabel } from '../helpers'
import { materialRemoved, materialUpdated } from '../materialsSlice'
import type { Material } from '../types'

interface MaterialCardProps {
  material: Material
  index: number
}

/** A created material with an inline-editable name and extractor link. */
export function MaterialCard({ material, index }: MaterialCardProps) {
  const dispatch = useAppDispatch()
  const extractors = useAppSelector(selectExtractors)

  return (
    <div className="flex items-center gap-2 rounded-lg border border-edge bg-surface-1 p-2.5">
      <input
        type="text"
        value={material.name}
        placeholder={materialLabel(material, index)}
        onChange={(e) =>
          dispatch(
            materialUpdated({ id: material.id, changes: { name: e.target.value } }),
          )
        }
        className="min-w-0 flex-1 rounded-md border border-edge bg-surface-0 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit"
      />
      <select
        value={material.extractorId ?? ''}
        onChange={(e) =>
          dispatch(
            materialUpdated({
              id: material.id,
              changes: { extractorId: e.target.value || null },
            }),
          )
        }
        aria-label="Extracted by"
        className="w-36 shrink-0 rounded-md border border-edge bg-surface-0 px-2 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit"
      >
        <option value="">Any extractor</option>
        {extractors.map((ex, i) => (
          <option key={ex.id} value={ex.id}>
            {extractorLabel(ex, i)}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => dispatch(materialRemoved(material.id))}
        className="shrink-0 rounded px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/15"
      >
        Delete
      </button>
    </div>
  )
}
