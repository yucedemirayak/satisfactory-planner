/**
 * A user-defined workbench (machine footprint) that can later be placed onto
 * floors. Dimensions are in metres, matching floor heights.
 */
export interface Workbench {
  /** Stable unique id. */
  id: string
  name: string
  /** Width in metres. */
  width: number
  /** Height in metres. */
  height: number
  /** Max somersloop slots per machine (production amplification). */
  sloopSlots: number
  /** Hex colour used to identify the workbench visually. */
  color: string
}

/** Fields the user can edit on an existing workbench. */
export type WorkbenchDraft = Omit<Workbench, 'id'>
