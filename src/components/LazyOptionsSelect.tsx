import { useState, type ReactNode, type SelectHTMLAttributes } from 'react'
import { flushSync } from 'react-dom'

interface LazyOptionsSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children' | 'value'> {
  value: string
  /** Label shown while collapsed for the current value (unused when value === ''). */
  currentLabel: string
  /** Text shown while collapsed when value === ''. */
  placeholder: string
  /** Builds the full <option>/<optgroup> tree — only invoked after first use. */
  renderOptions: () => ReactNode
}

/**
 * A native <select> that defers building its (potentially huge) option list
 * until the user first interacts with it. Until then it renders a single option
 * for the current value, so hundreds of these on one page stay cheap to mount.
 *
 * `flushSync` forces the real options into the DOM synchronously on that first
 * mousedown/focus, before the browser opens the dropdown — so the list is never
 * empty on the first click.
 */
export function LazyOptionsSelect({
  value,
  currentLabel,
  placeholder,
  renderOptions,
  ...rest
}: LazyOptionsSelectProps) {
  const [expanded, setExpanded] = useState(false)
  const expand = () => {
    if (!expanded) flushSync(() => setExpanded(true))
  }

  return (
    <select {...rest} value={value} onMouseDown={expand} onFocus={expand}>
      {expanded ? (
        renderOptions()
      ) : (
        <option value={value}>{value ? currentLabel : placeholder}</option>
      )}
    </select>
  )
}
