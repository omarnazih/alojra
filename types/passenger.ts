export type Passenger = {
  id: number;
  paid: number;
  changeGiven: boolean;
  seatNumber: number;
  paidBy?: number;
  paidFor?: number[];
  isSpecialPayment?: boolean;
}; 