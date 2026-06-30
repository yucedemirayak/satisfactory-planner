import { useAppDispatch, useAppSelector } from '@/app/hooks'

import { MAX_PORT_SCALE, MIN_PORT_SCALE, PORT_SCALE_STEP } from '../constants'
import { portScaleChanged } from '../floorsSlice'
import { selectPortScale } from '../selectors'

/** Size control for connection ports — fixed pixels so they stay clickable. */
export function FloorPortControl() {
  const dispatch = useAppDispatch()
  const portScale = useAppSelector(selectPortScale)

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">Ports</span>
      <input
        type="range"
        min={MIN_PORT_SCALE}
        max={MAX_PORT_SCALE}
        step={PORT_SCALE_STEP}
        value={portScale}
        onChange={(e) => dispatch(portScaleChanged(Number(e.target.value)))}
        aria-label="Connection port size (pixels)"
        className="w-20 accent-ficsit"
      />
      <span className="w-10 text-right font-mono text-xs text-ficsit">
        {portScale} px
      </span>
    </div>
  )
}
