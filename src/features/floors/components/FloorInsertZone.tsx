interface FloorInsertZoneProps {
  onAdd: () => void
  /** Visible text revealed on hover. Defaults to "Add Floor". */
  label?: string
  /** Tooltip / accessible label, e.g. "Insert floor here". */
  title?: string
}

/**
 * A strip between two floor bands for inserting a floor in the middle. The "+"
 * badge stays faintly visible so the action is discoverable; on hover the strip
 * expands and reveals the label.
 */
export function FloorInsertZone({
  onAdd,
  label = 'Add Floor',
  title,
}: FloorInsertZoneProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      title={title ?? label}
      aria-label={title ?? label}
      className="group/insert relative flex h-4 w-full items-center justify-start
        transition-[height] duration-150 hover:h-8 focus-visible:h-8
        focus-visible:outline-none"
    >
      {/* dashed guide line */}
      <span
        className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 border-t
          border-dashed border-edge transition-colors
          group-hover/insert:border-ficsit group-focus-visible/insert:border-ficsit"
      />
      <span
        className="sticky left-3 z-10 flex items-center rounded-full border border-edge
          bg-surface-2 px-2 py-0.5 text-xs font-medium text-gray-500 shadow
          transition-colors group-hover/insert:border-ficsit
          group-hover/insert:text-ficsit group-focus-visible/insert:border-ficsit
          group-focus-visible/insert:text-ficsit"
      >
        <span className="text-sm leading-none">+</span>
        <span
          className="max-w-0 overflow-hidden whitespace-nowrap pl-0 opacity-0
            transition-all group-hover/insert:max-w-32 group-hover/insert:pl-1
            group-hover/insert:opacity-100 group-focus-visible/insert:max-w-32
            group-focus-visible/insert:pl-1 group-focus-visible/insert:opacity-100"
        >
          {label}
        </span>
      </span>
    </button>
  )
}
