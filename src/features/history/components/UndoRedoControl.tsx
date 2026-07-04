import { useAppDispatch, useAppSelector } from '@/app/hooks'

import { redo, undo } from '../history'
import { selectCanRedo, selectCanUndo } from '../selectors'

const btn =
  'flex size-7 items-center justify-center rounded-md border border-edge bg-surface-1 text-gray-300 transition hover:border-ficsit hover:text-ficsit disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-edge disabled:hover:text-gray-300'

function Arrow({ flip }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-4 ${flip ? '-scale-x-100' : ''}`}
      aria-hidden
    >
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  )
}

/** Undo / redo buttons for the floor plan (Ctrl+Z / Ctrl+Shift+Z). */
export function UndoRedoControl() {
  const dispatch = useAppDispatch()
  const canUndo = useAppSelector(selectCanUndo)
  const canRedo = useAppSelector(selectCanRedo)

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={!canUndo}
        onClick={() => dispatch(undo())}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        className={btn}
      >
        <Arrow />
      </button>
      <button
        type="button"
        disabled={!canRedo}
        onClick={() => dispatch(redo())}
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo"
        className={btn}
      >
        <Arrow flip />
      </button>
    </div>
  )
}
