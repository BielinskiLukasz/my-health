import { getDay, parseISO, format } from 'date-fns'
import { useHeatmapData } from '@/hooks/useHeatmapData'
import type { HeatmapCell } from '@/hooks/useHeatmapData'

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

export default function ActivityHeatmap() {
  const { cellData, isLoading } = useHeatmapData()

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
                className={`w-[10px] h-[10px] rounded-sm ${heatmapCellClass(cell.count)}`}
                data-date={cell.date}
                data-metrics={cell.metrics.join(',')}
                onClick={() => {/* no-op — tooltip wired in Task 2 */}}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
