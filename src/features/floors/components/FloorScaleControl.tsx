import { useAppDispatch, useAppSelector } from '@/app/hooks'

import {
  MAX_PX_PER_METER,
  MIN_PX_PER_METER,
  PX_PER_METER_STEP,
} from '../constants'
import { pxPerMeterChanged } from '../floorsSlice'
import { selectPxPerMeter } from '../selectors'

/** Zoom control for the floor plan — adjusts the pixels-per-metre scale. */
export function FloorScaleControl() {
  const dispatch = useAppDispatch()
  const pxPerMeter = useAppSelector(selectPxPerMeter)

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">Zoom</span>
      <input
        type="range"
        min={MIN_PX_PER_METER}
        max={MAX_PX_PER_METER}
        step={PX_PER_METER_STEP}
        value={pxPerMeter}
        onChange={(e) => dispatch(pxPerMeterChanged(Number(e.target.value)))}
        aria-label="Floor plan zoom (pixels per metre)"
        className="w-28 accent-ficsit"
      />
      <span className="w-16 text-right font-mono text-xs text-ficsit">
        {pxPerMeter} px/m
      </span>
    </div>
  )
}
