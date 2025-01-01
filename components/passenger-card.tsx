import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { User, ArrowLeftRight } from "lucide-react";
import { type Passenger } from '@/types/passenger';

interface PassengerCardProps {
  passenger: Passenger;
  costPerPerson: number;
  onPassengerSelect: (passenger: Passenger) => void;
  onChangeClick: (e: React.MouseEvent, passenger: Passenger) => void;
  onChangeGiven: (e: React.MouseEvent<Element>, passengerId: number, given: boolean) => void;
  passengers: Passenger[];
}

export function PassengerCard({ 
  passenger, 
  costPerPerson, 
  onPassengerSelect, 
  onChangeClick,
  onChangeGiven,
  passengers
}: PassengerCardProps) {
  return (
    <Card 
      key={passenger.id}
      className={`p-4 cursor-pointer ${
        passenger.paid ? 'border-green-500' : 'border-gray-200'
      }`}
      onClick={() => onPassengerSelect(passenger)}
    >
      <div className="flex items-center gap-2 mb-2">
        <User className="h-5 w-5" />
        <h3 className="text-lg font-semibold">راكب {passenger.seatNumber}</h3>
      </div>
      <div className="space-y-2">
        <p>دفع: {passenger.paid} جنية</p>
        {passenger.paidBy && (
          <p className="text-sm text-muted-foreground">
            دفع عنه راكب {passengers.find(p => p.id === passenger.paidBy)?.seatNumber}
          </p>
        )}
        {passenger.paidFor && passenger.paidFor.length > 0 && (
          <p className="text-sm text-muted-foreground">
            دفع عن: {passenger.paidFor.map(id => passengers.find(p => p.id === id)?.seatNumber).join(', ')}
          </p>
        )}
        {passenger.paid > 0 && !passenger.changeGiven && !passenger.isSpecialPayment && (
          <p 
            className={`
              ${passenger.paid > costPerPerson ? 'text-red-500' : 'text-green-500'}
              cursor-pointer hover:underline flex items-center gap-2 
              transition-all duration-200 hover:scale-105
              rounded-md py-1 px-1 hover:bg-muted
            `}
            onClick={(e) => passenger.paid > costPerPerson && onChangeClick(e, passenger)}
          >
            <ArrowLeftRight className="h-4 w-4" />
            {passenger.paid > costPerPerson 
              ? `يجب إرجاع: ${passenger.paid - costPerPerson} جنية`
              : passenger.paid < costPerPerson
                ? `متبقي: ${costPerPerson - passenger.paid} جنية`
                : 'تم الدفع بالكامل'
            }
          </p>
        )}
        {passenger.paid > costPerPerson && (
          <div 
            className="flex items-center gap-2"
            onClick={(e) => onChangeGiven(e, passenger.id, !passenger.changeGiven)}
          >
            <Checkbox 
              id={`change-${passenger.id}`}
              checked={passenger.changeGiven}
            />
            <label htmlFor={`change-${passenger.id}`}>تم إعطاء الباقي</label>
          </div>
        )}
      </div>
    </Card>
  );
} 