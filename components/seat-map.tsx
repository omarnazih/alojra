'use client'

import { ArrowLeftRight, Check } from 'lucide-react'
import type { SeatLayout } from '@/config/seat-layouts'
import type { Passenger } from '@/types/passenger'
import type { VehicleType } from '@/types/vehicles'
import {
  getSeatAriaLabel,
  getSeatProgress,
  getSeatStatus,
  SEAT_STATUS_LABELS,
  type SeatStatus,
} from '@/lib/seat-status'

/**
 * Colour and border per seat state. Colour is never the only signal: the
 * headrest meter shows how much of the fare is collected, and every seat
 * exposes the same detail as text to assistive technology.
 */
const SEAT_STATE_CLASSES: Record<SeatStatus, string> = {
  empty: 'border-dashed border-border bg-muted/40 text-muted-foreground/70',
  unpaid: 'border-dashed border-muted-foreground/40 bg-background text-muted-foreground hover:border-muted-foreground',
  partial: 'border-amber-500/70 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  settled: 'border-emerald-600/70 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  'change-due': 'border-rose-500/70 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  'change-given': 'border-emerald-600/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
}

const LEGEND: SeatStatus[] = ['unpaid', 'partial', 'settled', 'change-due']

/** Cabin silhouette per vehicle model: a taxi is compact and tapered, a coach is long and boxy. */
const VEHICLE_FRAME: Record<VehicleType, { width: string; cabin: string; nose: string }> = {
  taxi: { width: 'max-w-[13.5rem]', cabin: 'rounded-[1.75rem]', nose: 'h-7 rounded-t-[3rem]' },
  microbus: { width: 'max-w-[14.5rem]', cabin: 'rounded-[1.5rem]', nose: 'h-6 rounded-t-[2.25rem]' },
  bus: { width: 'max-w-[17.5rem]', cabin: 'rounded-xl', nose: 'h-5 rounded-t-xl' },
  custom: { width: 'max-w-[17.5rem]', cabin: 'rounded-2xl', nose: 'h-5 rounded-t-2xl' },
}

interface SeatMapProps {
  layout: SeatLayout
  passengers: Passenger[]
  costPerPerson: number
  vehicle: VehicleType
  vehicleName: string
  onSelectPassenger: (passenger: Passenger) => void
}

/**
 * Top-down cabin diagram: one seat per fare, in the order the collector walks
 * the vehicle. Selecting a seat opens the same payment dialog as a passenger card.
 */
export function SeatMap({
  layout,
  passengers,
  costPerPerson,
  vehicle,
  vehicleName,
  onSelectPassenger,
}: SeatMapProps) {
  const frame = VEHICLE_FRAME[vehicle]

  if (layout.seatCount === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        أدخل عدد الركاب لعرض خريطة المقاعد.
      </p>
    )
  }

  const bySeat = new Map(passengers.map((passenger) => [passenger.seatNumber, passenger]))
  const placedSeats = new Set(
    layout.rows.flatMap((row) =>
      row.cells.flatMap((cell) => (cell.seatNumber === undefined ? [] : [cell.seatNumber])),
    ),
  )
  const unplaced = passengers.filter((passenger) => !placedSeats.has(passenger.seatNumber))
  const pending = passengers.filter((passenger) => {
    const status = getSeatStatus(passenger, costPerPerson)
    return status === 'unpaid' || status === 'partial'
  }).length
  const changeDue = passengers.filter(
    (passenger) => getSeatStatus(passenger, costPerPerson) === 'change-due',
  ).length

  const gridTemplateColumns = Array.from({ length: layout.columns }, (_, column) =>
    layout.aisleColumns.includes(column) ? '1.25rem' : 'minmax(2.75rem, 1fr)',
  ).join(' ')

  return (
    <section className="space-y-4" aria-label={`خريطة مقاعد ${vehicleName}`}>
      <p className="text-center text-xs text-muted-foreground">
        {pending > 0 ? `${pending} راكب لم يستكمل الدفع` : 'تم تحصيل أجرة جميع الركاب'}
        {changeDue > 0 ? ` · باقي مستحق على ${changeDue}` : ''}
      </p>

      {/* dir="ltr" keeps the physical layout stable inside the RTL page. */}
      <div dir="ltr" className={`mx-auto w-full ${frame.width}`}>
        <div
          aria-hidden="true"
          className={`border border-b-0 border-border bg-muted/50 ${frame.nose}`}
        />
        <div className={`border border-border bg-card px-3 pb-3 pt-2 shadow-sm ${frame.cabin}`}>
          <p className="mb-2 text-center text-[11px] tracking-wide text-muted-foreground">المقدمة</p>
          <div className="grid gap-2" style={{ gridTemplateColumns }}>
            {layout.rows.map((row) =>
              row.cells.map((cell) => {
                const position = { gridColumn: cell.column + 1, gridRow: row.index + 1 }

                if (cell.kind === 'driver') {
                  return (
                    <div
                      key={`driver-${row.index}`}
                      style={position}
                      role="img"
                      aria-label="مقعد السائق"
                      className="flex h-11 min-w-11 items-center justify-center rounded-md border border-dashed border-border bg-muted/60 text-muted-foreground"
                    >
                      <SteeringWheel className="h-5 w-5" />
                    </div>
                  )
                }

                const { seatNumber } = cell
                if (seatNumber === undefined) return null

                const passenger = bySeat.get(seatNumber)
                const status = getSeatStatus(passenger, costPerPerson)
                const progress = getSeatProgress(passenger, costPerPerson)
                const label = getSeatAriaLabel(seatNumber, passenger, costPerPerson)

                return (
                  <button
                    key={seatNumber}
                    type="button"
                    style={position}
                    onClick={() => passenger && onSelectPassenger(passenger)}
                    disabled={!passenger}
                    aria-label={label}
                    title={label}
                    className={`relative flex h-11 min-w-11 items-center justify-center rounded-md border text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none ${
                      SEAT_STATE_CLASSES[status]
                    } ${passenger ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  >
                    {/* The headrest doubles as the fare meter. */}
                    <span aria-hidden="true" className="absolute inset-x-2 top-1 h-[3px]">
                      <span className="absolute inset-0 rounded-full bg-current opacity-20" />
                      <span
                        className="relative block h-full rounded-full bg-current"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </span>
                    <span className="relative z-10">{seatNumber}</span>
                    {status === 'change-due' && (
                      <ArrowLeftRight
                        aria-hidden="true"
                        className="absolute bottom-0.5 right-0.5 h-3 w-3"
                      />
                    )}
                    {status === 'change-given' && (
                      <Check
                        aria-hidden="true"
                        className="absolute bottom-0.5 right-0.5 h-3 w-3"
                      />
                    )}
                  </button>
                )
              }),
            )}
          </div>
          <p className="mt-2 text-center text-[11px] tracking-wide text-muted-foreground">المؤخرة</p>
        </div>
      </div>

      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {LEGEND.map((status) => (
          <li key={status} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`h-4 w-4 rounded border ${SEAT_STATE_CLASSES[status]}`}
            />
            {SEAT_STATUS_LABELS[status]}
          </li>
        ))}
      </ul>

      {unplaced.length > 0 && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/5 p-3">
          <p className="mb-2 text-xs text-amber-700 dark:text-amber-300">
            مقاعد خارج الخريطة ({unplaced.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {unplaced.map((passenger) => (
              <button
                key={passenger.id}
                type="button"
                onClick={() => onSelectPassenger(passenger)}
                className={`rounded-md border px-3 py-1 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  SEAT_STATE_CLASSES[getSeatStatus(passenger, costPerPerson)]
                }`}
              >
                مقعد {passenger.seatNumber}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function SteeringWheel({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 9.5V3.5M4.3 15.6l6.2-2.4M19.7 15.6l-6.2-2.4" strokeLinecap="round" />
    </svg>
  )
}
