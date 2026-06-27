import { LazyOptionsSelect } from '@/components/LazyOptionsSelect'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectMaterials } from '@/features/materials'
import { selectProducts } from '@/features/products'

import { recipeLineChanged, recipeLineRemoved } from '../recipesSlice'
import { selectRefNames } from '../selectors'
import type { RecipeItem, RecipeSide } from '../types'

interface RecipeLineProps {
  recipeId: string
  side: RecipeSide
  index: number
  line: RecipeItem
}

/**
 * One input/output row: item picker + per-minute rate. Inputs may reference a
 * product or a material; outputs only products (materials can't be produced).
 */
export function RecipeLine({ recipeId, side, index, line }: RecipeLineProps) {
  const dispatch = useAppDispatch()
  const products = useAppSelector(selectProducts)
  const materials = useAppSelector(selectMaterials)
  const refNames = useAppSelector(selectRefNames)

  const change = (changes: Partial<RecipeItem>) =>
    dispatch(recipeLineChanged({ id: recipeId, side, index, changes }))

  return (
    <div className="flex items-center gap-1.5">
      <LazyOptionsSelect
        value={line.refId}
        currentLabel={refNames[line.refId] ?? ''}
        placeholder="Select item"
        aria-label="Item"
        onChange={(e) => change({ refId: e.target.value })}
        className="min-w-0 flex-1 rounded-md border border-edge bg-surface-0 px-2 py-1 text-sm text-gray-100 outline-none focus:border-ficsit"
        renderOptions={() => (
          <>
            <option value="" disabled>
              Select item
            </option>
            <optgroup label="Products">
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
            {side === 'inputs' && (
              <optgroup label="Materials">
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
            )}
          </>
        )}
      />

      <input
        type="number"
        min={0}
        step="any"
        value={line.rate}
        onChange={(e) => change({ rate: Number(e.target.value) })}
        className="w-16 rounded-md border border-edge bg-surface-0 px-2 py-1 text-right font-mono text-sm text-gray-100 outline-none focus:border-ficsit"
      />
      <span className="w-9 shrink-0 text-xs text-gray-500">/min</span>

      <button
        type="button"
        onClick={() => dispatch(recipeLineRemoved({ id: recipeId, side, index }))}
        title="Remove"
        aria-label="Remove line"
        className="shrink-0 rounded px-1.5 py-1 text-xs text-red-400 transition hover:bg-red-500/15"
      >
        ✕
      </button>
    </div>
  )
}
