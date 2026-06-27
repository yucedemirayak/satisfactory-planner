import { useAppDispatch } from '@/app/hooks'

import { productLabel } from '../helpers'
import { productRemoved, productUpdated } from '../productsSlice'
import type { Product } from '../types'

interface ProductCardProps {
  product: Product
  index: number
}

/** A created product with an inline-editable name. */
export function ProductCard({ product, index }: ProductCardProps) {
  const dispatch = useAppDispatch()

  return (
    <div className="flex items-center gap-2 rounded-lg border border-edge bg-surface-1 p-2.5">
      <input
        type="text"
        value={product.name}
        placeholder={productLabel(product, index)}
        onChange={(e) =>
          dispatch(productUpdated({ id: product.id, changes: { name: e.target.value } }))
        }
        className="min-w-0 flex-1 rounded-md border border-edge bg-surface-0 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit"
      />
      <button
        type="button"
        onClick={() => dispatch(productRemoved(product.id))}
        className="shrink-0 rounded px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/15"
      >
        Delete
      </button>
    </div>
  )
}
