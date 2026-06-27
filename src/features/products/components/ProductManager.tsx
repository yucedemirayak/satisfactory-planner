import { useAppSelector } from '@/app/hooks'

import { selectProductCount, selectProducts } from '../selectors'
import { ProductCard } from './ProductCard'
import { ProductForm } from './ProductForm'

/** Page for defining the catalogue of products. */
export function ProductManager() {
  const products = useAppSelector(selectProducts)
  const count = useAppSelector(selectProductCount)

  return (
    <section className="flex h-full flex-col gap-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-100">Products</h1>
          <p className="text-sm text-gray-500">Define the products you make.</p>
        </div>
        <dl className="text-right">
          <dt className="text-xs text-gray-500">Defined</dt>
          <dd className="font-mono text-lg text-ficsit">{count}</dd>
        </dl>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[20rem_1fr] gap-4">
        <div className="min-h-0 overflow-y-auto">
          <ProductForm />
        </div>

        <div className="min-h-0 overflow-y-auto">
          {count === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-edge bg-surface-1/50 p-10 text-center text-gray-400">
              No products yet. Create one on the left.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
