import { Link } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { PATHS } from '@/app/paths'
import { selectProducts } from '@/features/products'

import { recipeAdded } from '../recipesSlice'
import { selectRecipeCount, selectRecipes } from '../selectors'
import { RecipeCard } from './RecipeCard'

/** Page for defining recipes (≤4 inputs, ≤2 outputs, products at per-min rates). */
export function RecipeManager() {
  const dispatch = useAppDispatch()
  const recipes = useAppSelector(selectRecipes)
  const count = useAppSelector(selectRecipeCount)
  const hasProducts = useAppSelector(selectProducts).length > 0

  return (
    <section className="flex h-full flex-col gap-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-100">Recipes</h1>
          <p className="text-sm text-gray-500">
            Up to 4 inputs and 2 outputs, in products per minute.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <dl className="text-right">
            <dt className="text-xs text-gray-500">Defined</dt>
            <dd className="font-mono text-lg text-ficsit">{count}</dd>
          </dl>
          <button
            type="button"
            onClick={() => dispatch(recipeAdded())}
            className="rounded-md bg-ficsit px-4 py-2 text-sm font-semibold text-surface-0 transition hover:bg-ficsit-dark"
          >
            + New Recipe
          </button>
        </div>
      </header>

      {!hasProducts && (
        <p className="rounded-md border border-dashed border-edge bg-surface-1/50 p-3 text-sm text-gray-400">
          Tip: define some{' '}
          <Link to={PATHS.products} className="text-ficsit hover:underline">
            products
          </Link>{' '}
          first — recipe inputs and outputs are chosen from them.
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {count === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-edge bg-surface-1/50 p-10 text-center text-gray-400">
            No recipes yet. Use “+ New Recipe”.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recipes.map((r, i) => (
              <RecipeCard key={r.id} recipe={r} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
