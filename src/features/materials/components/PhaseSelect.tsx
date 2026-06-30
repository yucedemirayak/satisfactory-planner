import type { ItemPhase } from '../types'

const PHASES: { value: ItemPhase; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'fluid', label: 'Fluid' },
]

interface PhaseSelectProps {
  value: ItemPhase
  onChange: (phase: ItemPhase) => void
  className?: string
  ariaLabel?: string
}

/** Solid/fluid picker — decides whether an item travels on belts or in pipes. */
export function PhaseSelect({
  value,
  onChange,
  className,
  ariaLabel = 'Phase',
}: PhaseSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ItemPhase)}
      aria-label={ariaLabel}
      className={
        className ??
        'rounded-md border border-edge bg-surface-0 px-2 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit'
      }
    >
      {PHASES.map((p) => (
        <option key={p.value} value={p.value}>
          {p.label}
        </option>
      ))}
    </select>
  )
}
