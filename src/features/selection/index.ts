/** Public surface of the selection feature (single cross-kind selection). */
export {
  default as selectionReducer,
  itemSelected,
  selectionCleared,
} from './selectionSlice'
export type { Selection, SelectionKind } from './selectionSlice'
export { selectSelection } from './selectors'
