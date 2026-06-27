/**
 * A single floor of the megafactory.
 *
 * Floors live in an ordered list where index 0 is the *bottom* floor (ground)
 * and the last index is the *top* floor. Display labels are derived from this
 * position at render time, so inserting/deleting renumbers floors automatically.
 */
export interface Floor {
  /** Stable unique id, independent of position. */
  id: string
  /** Optional user-given name. When empty, a label is derived from position. */
  name: string
  /** Floor height in metres (game units). */
  height: number
}

/** Where a new floor should be inserted relative to the existing stack. */
export type InsertPosition =
  | { kind: 'top' }
  | { kind: 'bottom' }
  /** Insert at an absolute index in the bottom-origin array. */
  | { kind: 'at'; index: number }
