import type { PortPos } from '@/features/ports'

/**
 * A user-defined workbench (machine footprint) that can later be placed onto
 * floors. Dimensions are in metres, matching floor heights.
 */
export interface Workbench {
  /** Stable unique id. */
  id: string
  name: string
  /** Width in metres (the longer horizontal footprint side — along the floor). */
  width: number
  /** Depth in metres (the other horizontal side — into the floor). */
  depth: number
  /** Height in metres. */
  height: number
  /** Max somersloop slots per machine (production amplification). */
  sloopSlots: number
  /**
   * MW drawn per machine at 100% clock. Overclock scales power by
   * clock^1.321928; recipes may override this (variable-power machines).
   */
  powerUsage: number
  /** Number of input ports (recipes assigned here may use at most this many). */
  inputs: number
  /** Number of output ports. */
  outputs: number
  /** Position of each input port on the face (index-aligned); missing → left edge. */
  inputPorts?: PortPos[]
  /** Position of each output port on the face (index-aligned); missing → right edge. */
  outputPorts?: PortPos[]
  /** Hex colour used to identify the workbench visually. */
  color: string
}

/** Fields the user can edit on an existing workbench. */
export type WorkbenchDraft = Omit<Workbench, 'id'>
