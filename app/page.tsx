'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Bus, Car, Settings, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { vehiclePresets, type VehicleType } from '../types/vehicles';
import { type Passenger } from '../types/passenger';
import { Moon, Sun, RotateCcw, Info } from "lucide-react";
import { useTheme } from "next-themes";
import { Footer } from "@/components/footer";
import { Instructions } from "@/components/instructions";
import { Label } from "@/components/ui/label";

const getVehicleIcon = (type: VehicleType) => {
  switch (type) {
    case 'microbus':
      return <Car className="ml-2 h-5 w-5" />;
    case 'bus':
      return <Bus className="ml-2 h-5 w-5" />;
    case 'taxi':
      return <Car className="ml-2 h-5 w-5" />;
    case 'custom':
      return <Settings className="ml-2 h-5 w-5" />;
    default:
      return null;
  }
};

const resetState = {
  costPerPerson: 0,
  customCapacity: 0,
  passengers: [],
  paymentAmount: 0,
  selectedPassenger: null
};

export default function Home() {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('microbus');
  const [costPerPerson, setCostPerPerson] = useState<number>(0);
  const [customCapacity, setCustomCapacity] = useState<number>(0);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const { theme, setTheme } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [isAutoOpened, setIsAutoOpened] = useState(false);
  const [selectedPassengersForPayment, setSelectedPassengersForPayment] = useState<number[]>([]);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('ojraState');
    if (savedState) {
      const { 
        selectedVehicle: savedVehicle,
        costPerPerson: savedCost,
        customCapacity: savedCapacity,
        passengers: savedPassengers 
      } = JSON.parse(savedState);
      
      setSelectedVehicle(savedVehicle);
      setCostPerPerson(savedCost);
      setCustomCapacity(savedCapacity);
      setPassengers(savedPassengers);
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('ojraState', JSON.stringify({
      selectedVehicle,
      costPerPerson,
      customCapacity,
      passengers
    }));
  }, [selectedVehicle, costPerPerson, customCapacity, passengers]);

  // Check if we should show instructions on mount
  useEffect(() => {
    const dontShowAgain = localStorage.getItem('dontShowInstructions');
    if (!dontShowAgain) {
      setInstructionsOpen(true);
      setIsAutoOpened(true);
    }
  }, []);

  const handleDontShowAgain = (checked: boolean) => {
    if (checked) {
      localStorage.setItem('dontShowInstructions', 'true');
    } else {
      localStorage.removeItem('dontShowInstructions');
    }
  };

  const getCapacity = () => {
    const preset = vehiclePresets.find(v => v.type === selectedVehicle);
    return selectedVehicle === 'custom' ? customCapacity : preset?.capacity || 0;
  };

  const totalCost = costPerPerson * getCapacity();

  const initializePassengers = (vehicleType: VehicleType, cost: number) => {
    const preset = vehiclePresets.find(v => v.type === vehicleType);
    const capacity = vehicleType === 'custom' ? customCapacity : preset?.capacity || 0;
    
    if (capacity > 0 && cost > 0) {
      const newPassengers = Array.from({ length: capacity }, (_, index) => ({
        id: index + 1,
        paid: 0,
        changeGiven: false,
        seatNumber: index + 1
      }));
      setPassengers(newPassengers);
    } else {
      setPassengers([]);
    }
  };

  const handleVehicleSelect = (type: VehicleType) => {
    setSelectedVehicle(type);
    initializePassengers(type, costPerPerson);
  };

  const handlePayment = async (passengerId: number) => {
    if (!paymentAmount) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const totalPassengers = selectedPassengersForPayment.length + 1;
      const amountPerPerson = Math.min(paymentAmount / totalPassengers, costPerPerson);
      const remainingAmount = paymentAmount - (amountPerPerson * totalPassengers);
      
      setPassengers(prev => prev.map(p => {
        if (p.id === passengerId) {
          return { 
            ...p, 
            paid: amountPerPerson + remainingAmount,
            paidFor: selectedPassengersForPayment 
          };
        }
        if (selectedPassengersForPayment.includes(p.id)) {
          return { 
            ...p, 
            paid: amountPerPerson,
            paidBy: passengerId 
          };
        }
        return p;
      }));
      
      setPaymentAmount(0);
      setSelectedPassenger(null);
      setSelectedPassengersForPayment([]);
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدفع');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangeGiven = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>, 
    passengerId: number, 
    given: boolean
  ) => {
    e.stopPropagation(); // Prevent card click when clicking checkbox
    setPassengers(prev => prev.map(p => {
      if (p.id === passengerId) {
        return { ...p, changeGiven: given };
      }
      return p;
    }));
  };

  const getChangeAmount = (paid: number) => {
    return paid - costPerPerson;
  };

  const getTotalPaid = () => {
    return passengers.reduce((sum, passenger) => {
      const effectivePaid = passenger.paid >= costPerPerson ? costPerPerson : passenger.paid;
      return sum + effectivePaid;
    }, 0);
  };

  const getRemainingTotal = () => {
    return totalCost - getTotalPaid();
  };

  const handleCostChange = (cost: number) => {
    if (cost < 0) return;
    const validCost = isNaN(cost) ? 0 : cost;
    setCostPerPerson(validCost);
    initializePassengers(selectedVehicle, validCost);
  };

  const handleCustomCapacityChange = (capacity: number) => {
    if (capacity < 0) return;
    setCustomCapacity(isNaN(capacity) ? 0 : capacity);
  };

  const handlePaymentAmountChange = (amount: number) => {
    if (amount < 0) return;
    setPaymentAmount(isNaN(amount) ? 0 : amount);
  };

  const handleReset = () => {
    setCostPerPerson(resetState.costPerPerson);
    setCustomCapacity(resetState.customCapacity);
    setPassengers(resetState.passengers);
    setPaymentAmount(resetState.paymentAmount);
    setSelectedPassenger(resetState.selectedPassenger);
  };

  const getTotalRequired = () => {
    return costPerPerson * (selectedPassengersForPayment.length + 1);
  };

  const getPaymentStatus = () => {
    const total = getTotalRequired();
    if (paymentAmount > total) {
      return `الباقي للراكب: ${paymentAmount - total} جنية`;
    } else if (paymentAmount < total) {
      return `متبقي: ${total - paymentAmount} جنية`;
    }
    return 'المبلغ مضبوط';
  };

  return (
    <>
      <Instructions 
        open={instructionsOpen} 
        onOpenChange={(open) => {
          setInstructionsOpen(open);
          if (!open) setIsAutoOpened(false);
        }}
        onDontShowAgain={handleDontShowAgain}
        isAutoOpened={isAutoOpened}
      />
      <main className="container mx-auto p-4 pb-20 max-w-3xl">
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            className="h-10 w-10 rounded-full"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsAutoOpened(false);
                setInstructionsOpen(true);
              }}
              className="h-10 w-10 rounded-full"
            >
              <Info className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold text-center">حاسبة الأجرة</h1>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-10 w-10 rounded-full"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {vehiclePresets.map((vehicle) => (
            <Button
              key={vehicle.type}
              variant={selectedVehicle === vehicle.type ? "default" : "outline"}
              onClick={() => handleVehicleSelect(vehicle.type)}
              className="flex items-center justify-center h-12 w-full gap-2 px-3"
            >
              {getVehicleIcon(vehicle.type)}
              <span>{vehicle.name}</span>
            </Button>
          ))}
        </div>

        {selectedVehicle === 'custom' && (
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium">عدد الركاب</label>
            <Input
              type="number"
              min="0"
              value={customCapacity || ''}
              onChange={(e) => handleCustomCapacityChange(Number(e.target.value))}
              className="h-12"
            />
          </div>
        )}

        <div className="mb-8">
          <label className="block mb-2 text-sm font-medium">الأجرة للراكب الواحد</label>
          <Input
            type="number"
            min="0"
            value={costPerPerson || ''}
            onChange={(e) => handleCostChange(Number(e.target.value))}
            className="h-12"
          />
        </div>

        {selectedVehicle && costPerPerson > 0 && (
          <Card className="p-4 mb-6 bg-muted">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold">إجمالي الأجرة</h3>
                <p className="text-2xl font-bold">{totalCost} جنية</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">المتبقي</h3>
                <p className={`text-2xl font-bold ${getRemainingTotal() > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {getRemainingTotal()} جنية
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">تم تحصيل</h3>
                <p className="text-2xl font-bold text-green-500">{getTotalPaid()} جنية</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">عدد الركاب</h3>
                <p className="text-2xl font-bold">{getCapacity()}</p>
              </div>
            </div>
          </Card>
        )}

        {selectedVehicle && passengers.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            {passengers.map((passenger) => (
              <Card 
                key={passenger.id}
                className={`p-4 cursor-pointer ${
                  passenger.paid ? 'border-green-500' : 'border-gray-200'
                }`}
                onClick={() => setSelectedPassenger(passenger)}
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
                  {passenger.paid > 0 && !passenger.changeGiven && (
                    <p className={passenger.paid > costPerPerson ? 'text-red-500' : 'text-green-500'}>
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
                      onClick={(e) => handleChangeGiven(e, passenger.id, !passenger.changeGiven)}
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
            ))}
          </div>
        )}

        <Dialog 
          open={!!selectedPassenger} 
          onOpenChange={(open) => !open && setSelectedPassenger(null)}
        >
          <DialogContent 
            className="sm:max-w-[425px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && paymentAmount > 0) {
                selectedPassenger && handlePayment(selectedPassenger.id);
              }
              if (e.key === 'Escape') {
                setSelectedPassenger(null);
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
                <Input
                  type="number"
                  min="0"
                  value={paymentAmount || ''}
                  onChange={(e) => handlePaymentAmountChange(Number(e.target.value))}
                  placeholder="أدخل المبلغ"
                />
              </div>

              <div>
                <Label>دفع عن الركاب</Label>
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Checkbox 
                      id="select-all"
                      checked={selectedPassengersForPayment.length === passengers.filter(p => !p.paid && p.id !== selectedPassenger?.id).length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const allUnpaidIds = passengers
                            .filter(p => !p.paid && p.id !== selectedPassenger?.id)
                            .map(p => p.id);
                          setSelectedPassengersForPayment(allUnpaidIds);
                        } else {
                          setSelectedPassengersForPayment([]);
                        }
                      }}
                    />
                    <label htmlFor="select-all">تحديد الكل</label>
                  </div>
                  {passengers
                    .filter(p => !p.paid && p.id !== selectedPassenger?.id)
                    .map(p => (
                      <div key={p.id} className="flex items-center gap-2">
                        <Checkbox 
                          id={`passenger-${p.id}`}
                          checked={selectedPassengersForPayment.includes(p.id)}
                          onCheckedChange={(checked) => {
                            setSelectedPassengersForPayment(prev => 
                              checked 
                                ? [...prev, p.id]
                                : prev.filter(id => id !== p.id)
                            );
                          }}
                        />
                        <label htmlFor={`passenger-${p.id}`}>راكب {p.seatNumber}</label>
                      </div>
                    ))}
                </div>
              </div>

              {paymentAmount > 0 && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <p>
                    عدد الركاب: {selectedPassengersForPayment.length + 1}
                  </p>
                  <p>
                    الإجمالي المطلوب: {costPerPerson * (selectedPassengersForPayment.length + 1)} جنية
                  </p>
                  <p className={paymentAmount > getTotalRequired() ? 'text-red-500' : 'text-green-500'}>
                    {getPaymentStatus()}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="mt-6 flex flex-col gap-2">
              <Button 
                onClick={() => selectedPassenger && handlePayment(selectedPassenger.id)}
                disabled={!paymentAmount || isProcessing}
                className="w-full"
              >
                {isProcessing ? 'جاري التسجيل...' : 'تأكيد الدفع'}
              </Button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setSelectedPassenger(null)}
              >
                إلغاء
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </>
  );
}
