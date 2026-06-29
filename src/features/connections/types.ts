/** Which side of the model an endpoint lives on. */
export type EndpointRef = 'placement' | 'node'

/**
 * One end of a conveyor link: a port on a machine placement or on a splitter/
 * merger route node. `port` is a positional index into that endpoint's port list
 * — outputs for a `from` end, inputs for a `to` end. Ids are globally unique, so
 * `ref` only disambiguates which slice to resolve the id against.
 */
export interface ConnectionEnd {
  ref: EndpointRef
  id: string
  port: number
}

/**
 * A conveyor link from an output port (`from`) to an input port (`to`). Either
 * end may be a machine placement or a route node. Each port carries at most one
 * belt — fan-out/in goes through splitters/mergers. The carried item is derived
 * from the upstream source, so it isn't stored.
 */
export interface Connection {
  id: string
  from: ConnectionEnd
  to: ConnectionEnd
  /** Conveyor (belt) tier id carrying this link. */
  conveyorId: string
}

/** Mid two-click selection: the chosen source output port. */
export interface PendingFrom {
  ref: EndpointRef
  id: string
  port: number
  /**
   * Source output item id when known (a machine output); null for route-node
   * outputs, whose carried item is resolved from the flow graph.
   */
  refId: string | null
}
