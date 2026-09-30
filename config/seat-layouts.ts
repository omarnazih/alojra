import type { VehicleType } from '@/types/vehicles'

/**
 * A seat-map row written as a compact string:
 *   `D` = driver, `S` = passenger seat, `.` = aisle gap.
 *
 * Keeping the aisle as a real column is what makes the diagram read as a
 * vehicle floor instead of a plain grid of buttons.
 */
export type LayoutRow = string

/**
 * Declared cabins per vehicle type. Seat numbers are assigned left-to-right,
 * front-to-back by {@link buildSeatLayout} and always end at the vehicle's
 * capacity, so these rows never carry the numbering themselves.
 */
export const SEAT_LAYOUTS: Record<VehicleType, LayoutRow[]> = {
  // Van: driver and two across the front, then four rows of three (14 fares).
  microbus: ['DSS', 'SSS', 'SSS', 'SSS', 'SSS'],
  // Coach: twelve two-plus-two rows around a centre aisle, then a rear pair (50 fares).
  bus: [
    'SS.SS',
    'SS.SS',
    'SS.SS',
    'SS.SS',
    'SS.SS',
    'SS.SS',
    'SS.SS',
    'SS.SS',
    'SS.SS',
    'SS.SS',
    'SS.SS',
    'SS.SS',
    'SS',
  ],
  // Sedan: driver and one passenger in front, a three-place bench behind (4 fares).
  taxi: ['DS', 'SSS'],
  // Custom vehicles are generated from the seat count the user enters.
  custom: [],
}

export type SeatCellKind = 'seat' | 'driver'

export interface SeatCell {
  kind: SeatCellKind
  /** Present for `seat` cells only; matches `Passenger.seatNumber`. */
  seatNumber?: number
  /** Zero-based column in the cabin grid. */
  column: number
}

export interface SeatRow {
  /** Zero-based row in the cabin grid. */
  index: number
  cells: SeatCell[]
}

export interface SeatLayout {
  rows: SeatRow[]
  /** Total columns, including the aisle. */
  columns: number
  /** Columns that hold no seat in any row; rendered narrow. */
  aisleColumns: number[]
  /** Number of seats the diagram actually shows. */
  seatCount: number
}

/** Builds cabin rows for a custom vehicle: up to two beside the driver, then two-plus-two. */
function customRows(capacity: number): LayoutRow[] {
  if (capacity <= 0) return []

  const rows: LayoutRow[] = []
  let remaining = capacity

  const front = Math.min(2, remaining)
  rows.push(`D${'S'.repeat(front)}`)
  remaining -= front

  while (remaining > 0) {
    const take = Math.min(4, remaining)
    if (take === 4) rows.push('SS.SS')
    else if (take === 3) rows.push('SS.S')
    else rows.push('S'.repeat(take))
    remaining -= take
  }

  return rows
}

function countSeats(rows: LayoutRow[]): number {
  return rows.reduce((total, row) => total + (row.match(/S/g)?.length ?? 0), 0)
}

/** Appends standard rows when a capacity outgrows its declared cabin. */
function withEnoughSeats(rows: LayoutRow[], capacity: number): LayoutRow[] {
  const filled = [...rows]
  while (countSeats(filled) < capacity) {
    filled.push('SS.SS')
  }
  return filled
}

/**
 * Resolves the cabin diagram for a vehicle: declared rows for the built-in
 * models, generated rows for a custom seat count, always numbered `1..capacity`.
 */
export function buildSeatLayout(vehicle: VehicleType, capacity: number): SeatLayout {
  const empty: SeatLayout = { rows: [], columns: 0, aisleColumns: [], seatCount: 0 }
  if (capacity <= 0) return empty

  const source = vehicle === 'custom' ? customRows(capacity) : SEAT_LAYOUTS[vehicle]
  if (source.length === 0) return empty

  const raw = withEnoughSeats(source, capacity)
  const columns = raw.reduce((max, row) => Math.max(max, row.length), 0)

  const aisleColumns: number[] = []
  for (let column = 0; column < columns; column += 1) {
    const holdsSeat = raw.some((row) => row[column] === 'D' || row[column] === 'S')
    if (!holdsSeat) aisleColumns.push(column)
  }

  let seatNumber = 0
  const rows: SeatRow[] = raw.map((row, index) => {
    const cells: SeatCell[] = []
    for (let column = 0; column < row.length; column += 1) {
      const token = row[column]
      if (token === 'D') {
        cells.push({ kind: 'driver', column })
        continue
      }
      if (token !== 'S') continue
      seatNumber += 1
      // Seats declared beyond the vehicle's real capacity are not drawn.
      if (seatNumber > capacity) continue
      cells.push({ kind: 'seat', seatNumber, column })
    }
    return { index, cells }
  })

  return {
    rows,
    columns,
    aisleColumns,
    seatCount: Math.min(seatNumber, capacity),
  }
}
