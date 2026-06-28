/**
 * A conveyor link between an output port of one placement and an input port of
 * another. Ports are positional indexes into each placement's *valid* (refId-
 * filtered) port list — outputs for `from`, inputs for `to`. The carried item is
 * derived from the source output, so it isn't stored.
 */
export interface Connection {
  id: string
  fromPlacementId: string
  fromPort: number
  toPlacementId: string
  toPort: number
  /** Conveyor (belt) tier id carrying this link. */
  conveyorId: string
}

/** Mid two-click selection: the chosen source output port + its item id. */
export interface PendingFrom {
  placementId: string
  port: number
  /** Product/material id of the source output, for input-match validation. */
  refId: string
}
