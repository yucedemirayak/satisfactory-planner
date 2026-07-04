/** Public surface of the connections feature. */
export { ConnectionLayer } from './components/ConnectionLayer'
export { ConnectionInspector } from './components/ConnectionInspector'
export { default as connectionsReducer } from './connectionsSlice'
export { connectionSourceCleared, connectionRemoved } from './connectionsSlice'
export { selectConnectionViews, selectConnectionSource } from './selectors'
export type { Connection, ConnectionEnd, EndpointRef } from './types'
export type { ConnectionView } from './selectors'
