/**
 * A user-defined spacer (empty gap) placed between workbenches on a floor.
 * Only a width matters — it represents horizontal empty space.
 */
export interface Spacer {
  id: string
  name: string
  /** Width in metres. */
  width: number
}

export type SpacerDraft = Omit<Spacer, 'id'>
