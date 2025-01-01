import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { type Passenger } from "@/types/passenger";

interface PaymentModalProps {
  selectedPassenger: Passenger | null;
  paymentAmount: number;
  costPerPerson: number;
  isProcessing: boolean;
  error: string | null;
  selectedPassengersForPayment: number[];
  passengers: Passenger[];
  onClose: () => void;
  onPayment: (passengerId: number) => void;
  onPaymentAmountChange: (amount: number) => void;
  onPassengerSelectionChange: (checked: boolean, passengerId: number) => void;
  onSpecialPaymentChange: (checked: boolean) => void;
}

export function PaymentModal({
  selectedPassenger,
  paymentAmount,
  costPerPerson,
  isProcessing,
  error,
  selectedPassengersForPayment,
  passengers,
  onClose,
  onPayment,
  onPaymentAmountChange,
  onPassengerSelectionChange,
  onSpecialPaymentChange,
}: PaymentModalProps) {
  const getTotalRequired = () => {
    if (selectedPassenger?.isSpecialPayment) {
      return paymentAmount;
    }
    return costPerPerson * (selectedPassengersForPayment.length + 1);
  };

  const getPaymentStatus = () => {
    const total = getTotalRequired();
    if (paymentAmount > total) {
      return `البقي للراكب: ${paymentAmount - total} جنية`;
    } else if (paymentAmount < total) {
      return `متبقي: ${total - paymentAmount} جنية`;
    }
    return 'المبلغ مضبوط';
  };

  return (
    <Dialog open={!!selectedPassenger} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-[425px]"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && paymentAmount > 0) {
            selectedPassenger && onPayment(selectedPassenger.id);
          }
          if (e.key === 'Escape') {
            onClose();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>دفع الأجرة - راكب {selectedPassenger?.seatNumber}</DialogTitle>
          <DialogDescription>
            المطلوب: {costPerPerson} جنية
            {selectedPassenger?.paid && (
              <p className="mt-2">
                المدفوع حالياً: {selectedPassenger.paid} جنية
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 space-y-4">
          <div>
            <Label>المبلغ المدفوع</Label>
            <div className="space-y-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount || ''}
                onChange={(e) => onPaymentAmountChange(Number(e.target.value))}
                placeholder="أدخل المبلغ"
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="special-payment"
                  checked={selectedPassenger?.isSpecialPayment}
                  onCheckedChange={onSpecialPaymentChange}
                />
                <Label htmlFor="special-payment">دفع مبلغ مخصص</Label>
              </div>
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2">
              دفع عن الركاب
              {selectedPassenger?.isSpecialPayment && (
                <span className="text-sm text-muted-foreground">(غير متاح مع الدفع المخصص)</span>
              )}
            </Label>
            <div className={`space-y-2 mt-2 max-h-40 overflow-y-auto border rounded-md p-2 ${
              selectedPassenger?.isSpecialPayment ? 'opacity-50 pointer-events-none' : ''
            }`}>
              {passengers
                .filter(p => !p.paid && p.id !== selectedPassenger?.id)
                .map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Checkbox 
                      id={`passenger-${p.id}`}
                      checked={selectedPassengersForPayment.includes(p.id)}
                      onCheckedChange={(checked) => onPassengerSelectionChange(!!checked, p.id)}
                    />
                    <label htmlFor={`passenger-${p.id}`}>راكب {p.seatNumber}</label>
                  </div>
                ))}
            </div>
          </div>

          {paymentAmount > 0 && (
            <div className="p-3 bg-muted rounded-lg space-y-2">
              {!selectedPassenger?.isSpecialPayment && (
                <p>عدد الركاب: {selectedPassengersForPayment.length + 1}</p>
              )}
              <p>الإجمالي المطلوب: {getTotalRequired()} جنية</p>
              <p className={paymentAmount > getTotalRequired() ? 'text-red-500' : 'text-green-500'}>
                {getPaymentStatus()}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 flex flex-col gap-2">
          <Button 
            onClick={() => selectedPassenger && onPayment(selectedPassenger.id)}
            disabled={!paymentAmount || isProcessing || (!selectedPassenger?.isSpecialPayment && paymentAmount < getTotalRequired())}
            className="w-full"
          >
            {isProcessing ? 'جاري التسجيل...' : 'تأكيد الدفع'}
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button variant="outline" className="w-full" onClick={onClose}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 