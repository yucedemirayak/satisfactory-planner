/** Port-editor display constants (per-page settings on the Settings pages). */

/** Editor magnification: 1 = the base 150 px box, scaled up for fine grids. */
export const DEFAULT_EDITOR_ZOOM = 1
export const MIN_EDITOR_ZOOM = 0.5
export const MAX_EDITOR_ZOOM = 3
export const EDITOR_ZOOM_STEP = 0.25

/** Editor box size on its long side at 1× zoom, in pixels. */
export const PORT_EDITOR_BOX_MAX = 150

/** How far a dot overhangs the box edge (half size × hover scale + ring). */
export const portDotOverhang = (portScale: number): number =>
  Math.ceil((portScale * 1.25) / 2) + 2

/** Editor footprint width (box + dot padding) — lets cards size to fit it. */
export const portEditorWidth = (zoom: number, portScale: number): number =>
  Math.round(PORT_EDITOR_BOX_MAX * zoom) + 2 * portDotOverhang(portScale)
