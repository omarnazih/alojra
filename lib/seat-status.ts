import type { Passenger } from '@/types/passenger'

/** How a single seat reads on the vehicle map. */
export type SeatStatus = 'empty' | 'unpaid' | 'partial' | 'settled' | 'change-due' | 'change-given'

export const SEAT_STATUS_LABELS: Record<SeatStatus, string> = {
  empty: 'لا يوجد راكب',
  unpaid: 'لم يدفع',
  partial: 'دفع جزئي',
  settled: 'تم الدفع',
  'change-due': 'باقي مستحق',
  'change-given': 'تم إرجاع الباقي',
}

/**
 * Resolves a seat's payment state.
 *
 * Special payments follow the passenger cards: the app never asks for change on
 * a custom amount, so an overpaid custom fare reads as settled rather than as
 * change owed.
 */
export function getSeatStatus(passenger: Passenger | undefined, costPerPerson: number): SeatStatus {
  if (!passenger) return 'empty'
  if (passenger.paid <= 0) return 'unpaid'

  if (costPerPerson > 0 && passenger.paid < costPerPerson) return 'partial'
  if (costPerPerson > 0 && passenger.paid > costPerPerson) {
    if (passenger.isSpecialPayment) return 'settled'
    return passenger.changeGiven ? 'change-given' : 'change-due'
  }

  return 'settled'
}

/** Share of the fare collected for this seat, clamped to 0..1 for the headrest meter. */
export function getSeatProgress(passenger: Passenger | undefined, costPerPerson: number): number {
  if (!passenger || passenger.paid <= 0) return 0
  if (costPerPerson <= 0) return 1
  return Math.min(passenger.paid / costPerPerson, 1)
}

/** Screen-reader text for one seat, including the amount collected so far. */
export function getSeatAriaLabel(
  seatNumber: number,
  passenger: Passenger | undefined,
  costPerPerson: number,
): string {
  const status = getSeatStatus(passenger, costPerPerson)
  const parts = [`مقعد ${seatNumber}`, SEAT_STATUS_LABELS[status]]

  if (passenger && passenger.paid > 0) {
    parts.push(
      costPerPerson > 0
        ? `دفع ${passenger.paid} من ${costPerPerson} جنية`
        : `دفع ${passenger.paid} جنية`,
    )
  }
  if (status === 'change-due' && passenger) {
    parts.push(`يجب إرجاع ${passenger.paid - costPerPerson} جنية`)
  }

  return parts.join('، ')
}
