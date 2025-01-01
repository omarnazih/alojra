import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { type Passenger } from "@/types/passenger";

interface ChangeModalProps {
  passenger: Passenger | null;
  costPerPerson: number;
  partialChangeAmount: number;
  onClose: () => void;
  onPartialChange: (passenger: Passenger, amount: number) => void;
  onPartialChangeAmountChange: (amount: number) => void;
}

export function ChangeModal({
  passenger,
  costPerPerson,
  partialChangeAmount,
  onClose,
  onPartialChange,
  onPartialChangeAmountChange,
}: ChangeModalProps) {
  if (!passenger) return null;
  
  const totalChange = passenger.paid - costPerPerson;

  return (
    <Dialog open={!!passenger} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>الباقي للراكب {passenger.seatNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <p className="text-xl font-bold text-center">
            المبلغ المتبقي: {totalChange} جنية
          </p>
          
          <div className="space-y-2">
            <Label>المبلغ المراد إرجاعه</Label>
            <Input
              type="number"
              min="0"
              max={totalChange}
              step="0.01"
              value={partialChangeAmount || ''}
              onChange={(e) => onPartialChangeAmountChange(Number(e.target.value))}
              placeholder="أدخل المبلغ"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2">
          <Button 
            onClick={() => onPartialChange(passenger, partialChangeAmount)}
            disabled={!partialChangeAmount || partialChangeAmount <= 0}
            className="w-full"
          >
            تم إرجاع {partialChangeAmount || 0} جنية
          </Button>
          <Button 
            onClick={() => onPartialChange(passenger, totalChange)}
            className="w-full"
          >
            تم إرجاع كل الباقي
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 