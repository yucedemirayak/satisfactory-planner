/** Public surface of the connections feature. */
export { ConnectionLayer } from './components/ConnectionLayer'
export { ConnectionInspector } from './components/ConnectionInspector'
export { default as connectionsReducer } from './connectionsSlice'
export { connectionSourceCleared, connectionSelected } from './connectionsSlice'
export { selectConnectionViews, selectConnectionSource } from './selectors'
export type { Connection } from './types'
export type { ConnectionView } from './selectors'
