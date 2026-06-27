interface AddFloorButtonProps {
  onClick: () => void
  /** Visible button text. Defaults to "Add Floor". */
  label?: string
  /** Tooltip / accessible label to disambiguate placement (top vs bottom). */
  title?: string
}

/** Prominent, always-visible button to add a floor at the top or bottom. */
export function AddFloorButton({
  onClick,
  label = 'Add Floor',
  title,
}: AddFloorButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? label}
      aria-label={title ?? label}
      className="flex w-full items-center justify-start rounded-md border
        border-dashed border-edge bg-surface-1/40 py-2 text-sm font-medium
        text-gray-400 transition hover:border-ficsit hover:bg-ficsit/10
        hover:text-ficsit focus-visible:border-ficsit focus-visible:outline-none"
    >
      {/* sticky so it stays visible while the plan scrolls horizontally */}
      <span className="sticky left-3 flex items-center gap-1.5">
        <span className="text-base leading-none">+</span>
        {label}
      </span>
    </button>
  )
}
