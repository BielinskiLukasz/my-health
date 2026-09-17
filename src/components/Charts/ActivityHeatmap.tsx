import { useState } from 'react'
import { getDay, parseISO, format } from 'date-fns'
import { useHeatmapData } from '@/hooks/useHeatmapData'
import type { HeatmapCell } from '@/hooks/useHeatmapData'
import { METRIC_CONFIG } from '@/utils/constants'

// Layout.tsx's fixed bottom nav rendered height (py-3 padding + size-5 icon +
// gap-1 + text-xs label) — same reserved-nav-band concept as MetricChart.tsx's
// Log FAB offset (commit 2d12acf), used here as a precise clamp boundary.
const NAV_HEIGHT = 64
// Conservative rendered-height estimate for the tooltip's px-3 py-2 bordered
// box (padding + border + date label row), plus one row per metric line.
// Estimated high on purpose so the clamp never under-reserves space.
const TOOLTIP_BASE_HEIGHT = 48
const TOOLTIP_LINE_HEIGHT = 18

function heatmapCellClass(count: number): string {
  if (count === 0) return 'bg-zinc-800'
  if (count <= 2) return 'bg-emerald-900'
  if (count <= 4) return 'bg-emerald-600'
  return 'bg-emerald-500'
}

interface MonthLabel {
  label: string
  col: number
}

function getMonthLabels(cells: HeatmapCell[], startDay: number): MonthLabel[] {
  const labels: MonthLabel[] = []
  let lastMonth = ''

  cells.forEach((cell, i) => {
    const monthKey = cell.date.slice(0, 7)
    if (monthKey !== lastMonth) {
      // Column index = floor((cell index + start padding) / 7)
      const col = Math.floor((i + startDay) / 7)
      labels.push({
        label: format(parseISO(cell.date + 'T00:00:00'), 'MMM'),
        col,
      })
      lastMonth = monthKey
    }
  })

  return labels
}

interface TooltipState {
  date: string
  metrics: string[]
  x: number
  y: number
}

// Clamp/flip the tooltip's vertical position so it never renders under the
// fixed bottom nav. Uses the existing below-tap-point offset when it fits
// above the reserved nav band; otherwise flips the tooltip above the tap
// point. Always clamped between 8px from the viewport top and the lowest
// top that keeps the tooltip's bottom edge clear of the nav.
function getTooltipTop(y: number, metricsCount: number): number {
  const estimatedHeight = TOOLTIP_BASE_HEIGHT + Math.max(1, metricsCount) * TOOLTIP_LINE_HEIGHT
  const maxTop = window.innerHeight - NAV_HEIGHT - estimatedHeight
  const naturalTop = y - 10
  const flippedTop = y - 10 - estimatedHeight
  return Math.max(8, Math.min(naturalTop > maxTop ? flippedTop : naturalTop, maxTop))
}

export default function ActivityHeatmap() {
  const { cellData, isLoading } = useHeatmapData()
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const handleCellClick = (cell: HeatmapCell, event: React.MouseEvent) => {
    event.stopPropagation()
    setTooltip({
      date: cell.date,
      metrics: cell.metrics,
      x: event.clientX,
      y: event.clientY,
    })
  }

  if (isLoading) {
    return (
      <div className="h-[100px] flex items-center justify-center text-zinc-500 text-sm">
        Loading activity...
      </div>
    )
  }

  // Day-of-week index of first cell (0=Sunday) — used to pad grid start
  const startDay = cellData.length > 0
    ? getDay(parseISO(cellData[0].date + 'T00:00:00'))
    : 0

  const monthLabels = getMonthLabels(cellData, startDay)
  // Each column pitch: 10px cell + 2px gap = 12px
  const CELL_PITCH = 12

  return (
    <div>
      <p className="text-sm font-medium text-zinc-400 mb-2">Activity</p>

      {/* overflow-x-auto: heatmap scrolls horizontally on small screens (RESEARCH Pitfall 6) */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: '600px' }}>
          {/* Month labels — absolutely positioned at col * 12px offsets */}
          <div style={{ position: 'relative', height: '14px', marginBottom: '4px' }}>
            {monthLabels.map(({ label, col }) => (
              <span
                key={`month-${col}`}
                className="absolute text-[10px] text-zinc-500 whitespace-nowrap"
                style={{ left: `${col * CELL_PITCH}px` }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Heatmap grid: column-major (52 cols × 7 rows) per D-12 */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: 'repeat(7, 10px)',
              gridAutoFlow: 'column',
              gap: '2px',
              minWidth: '600px',
            }}
          >
            {/* Padding cells to align first real day with its correct day-of-week row */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`pad-${i}`} className="w-[10px] h-[10px]" />
            ))}

            {/* Data cells — intensity colored by metric count (D-10) */}
            {cellData.map((cell) => (
              <div
                key={cell.date}
                className={`w-[10px] h-[10px] rounded-sm cursor-pointer ${heatmapCellClass(cell.count)}`}
                data-date={cell.date}
                data-metrics={cell.metrics.join(',')}
                onClick={(e) => handleCellClick(cell, e)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Overlay — dismisses tooltip on click outside cell (z-40, below tooltip z-[60]) */}
      {tooltip && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setTooltip(null)}
        />
      )}

      {/* Tooltip — pointer-events-none so it doesn't block overlay dismiss (D-13) */}
      {tooltip && (
        <div
          className="fixed z-[60] rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-lg text-sm pointer-events-none"
          style={{
            top: getTooltipTop(tooltip.y, tooltip.metrics.length),
            left: tooltip.x > window.innerWidth - 200 ? tooltip.x - 160 : tooltip.x + 10,
          }}
        >
          {/* Date label — T00:00:00 avoids UTC/local shift (Pitfall 3) */}
          <p className="text-zinc-400 text-xs mb-1">
            {format(parseISO(tooltip.date + 'T00:00:00'), 'EEEE, MMM d, yyyy')}
          </p>
          {tooltip.metrics.length === 0 ? (
            <p className="text-zinc-500 text-xs">No metrics logged</p>
          ) : (
            <ul>
              {tooltip.metrics.map((m) => (
                <li key={m} className="text-white text-xs">
                  {/* Security: m comes from hardcoded allowlist in useHeatmapData (T-02-04) */}
                  {METRIC_CONFIG[m as keyof typeof METRIC_CONFIG]?.label ?? m}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
