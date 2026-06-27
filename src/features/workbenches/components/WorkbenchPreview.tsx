interface WorkbenchPreviewProps {
  width: number
  height: number
  color: string
  /** Size of the square preview area in px. */
  boxPx?: number
}

/**
 * A scaled rectangle representing a workbench footprint, fit to a square box
 * while preserving the width:height aspect ratio.
 */
export function WorkbenchPreview({
  width,
  height,
  color,
  boxPx = 88,
}: WorkbenchPreviewProps) {
  const scale = boxPx / Math.max(width, height)
  const w = Math.max(4, width * scale)
  const h = Math.max(4, height * scale)

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-md border border-edge bg-surface-0"
      style={{ width: boxPx, height: boxPx }}
    >
      <div
        className="rounded-sm border-2"
        style={{
          width: w,
          height: h,
          borderColor: color,
          backgroundColor: `${color}33`,
        }}
      />
    </div>
  )
}
