import { Card } from "@/components/ui/card";
import { type Passenger } from '@/types/passenger';

interface TripSummaryProps {
  capacity: number;
  totalCost: number;
  passengers: Passenger[];
  costPerPerson: number;
}

export function TripSummary({ capacity, totalCost, passengers, costPerPerson }: TripSummaryProps) {
  const formatNumber = (value: number): number => {
    return Number(Math.round(value * 100) / 100);
  };

  const getTotalPaid = () => {
    return formatNumber(passengers.reduce((sum, passenger) => {
      const effectivePaid = passenger.paid >= costPerPerson ? costPerPerson : passenger.paid;
      return sum + effectivePaid;
    }, 0));
  };

  const getRemainingTotal = () => {
    return formatNumber(totalCost - getTotalPaid());
  };

  const getTotalChange = () => {
    return formatNumber(passengers.reduce((sum, passenger) => {
      const change = passenger.paid > costPerPerson ? passenger.paid - costPerPerson : 0;
      return sum + (passenger.changeGiven ? 0 : change);
    }, 0));
  };

  return (
    <Card className="p-4 mb-6 bg-muted">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold">عدد الركاب</h3>
          <p className="text-2xl font-bold">{capacity}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold">إجمالي الأجرة</h3>
          <p className="text-2xl font-bold">{formatNumber(totalCost)} جنية</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold">تم تحصيل</h3>
          <p className="text-2xl font-bold text-green-500">{getTotalPaid()} جنية</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold">المتبقي</h3>
          <p className={`text-2xl font-bold ${getRemainingTotal() > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {getRemainingTotal()} جنية
          </p>
        </div>
        <div>
          <h3 className="text-lg font-semibold">مجموع الباقي</h3>
          <p className={`text-2xl font-bold ${getTotalChange() > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
            {getTotalChange()} جنية
          </p>
        </div>
      </div>
    </Card>
  );
} 