'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Bus, Car, Settings } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { vehiclePresets, type VehicleType } from '../types/vehicles';
import { type Passenger } from '../types/passenger';
import { Moon, Sun, RotateCcw } from "lucide-react";
import { useTheme } from "next-themes";
import { Footer } from "@/components/footer";

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
      setPassengers(prev => prev.map(p => {
        if (p.id === passengerId) {
          return { ...p, paid: paymentAmount };
        }
        return p;
      }));
      setPaymentAmount(0);
      setSelectedPassenger(null);
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
    setCostPerPerson(cost);
    initializePassengers(selectedVehicle, cost);
  };

  const handleCustomCapacityChange = (capacity: number) => {
    if (capacity < 0) return;
    setCustomCapacity(capacity);
  };

  const handlePaymentAmountChange = (amount: number) => {
    if (amount < 0) return;
    setPaymentAmount(amount);
  };

  const handleReset = () => {
    setCostPerPerson(resetState.costPerPerson);
    setCustomCapacity(resetState.customCapacity);
    setPassengers(resetState.passengers);
    setPaymentAmount(resetState.paymentAmount);
    setSelectedPassenger(resetState.selectedPassenger);
  };

  return (
    <>
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
          <h1 className="text-3xl font-bold text-center">حاسبة الأجرة</h1>
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
              value={customCapacity}
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
            value={costPerPerson}
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
                <h3 className="text-lg font-semibold">راكب {passenger.seatNumber}</h3>
                <div className="space-y-2">
                  <p>دفع: {passenger.paid} جنية</p>
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

        <Sheet 
          open={!!selectedPassenger} 
          onOpenChange={() => setSelectedPassenger(null)}
        >
          <SheetContent 
            side="right"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && paymentAmount > 0) {
                selectedPassenger && handlePayment(selectedPassenger.id);
              }
              if (e.key === 'Escape') {
                setSelectedPassenger(null);
              }
            }}
          >
            <SheetHeader>
              <SheetTitle>دفع الأجرة - راكب {selectedPassenger?.seatNumber}</SheetTitle>
              <SheetDescription>
                المطلوب: {costPerPerson} جنية
                {selectedPassenger?.paid && (
                  <p className="mt-2">
                    المدفوع حالياً: {selectedPassenger.paid} جنية
                  </p>
                )}
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6">
              <label className="text-sm font-medium mb-2 block">المبلغ المدفوع</label>
              <Input
                type="number"
                min="0"
                value={paymentAmount}
                onChange={(e) => handlePaymentAmountChange(Number(e.target.value))}
                placeholder="أدخل المبلغ"
              />
              
              {paymentAmount > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className={paymentAmount > costPerPerson ? 'text-red-500' : 'text-green-500'}>
                    {paymentAmount > costPerPerson 
                      ? `الباقي للراكب: ${getChangeAmount(paymentAmount)} جنية`
                      : paymentAmount < costPerPerson 
                        ? `متبقي على الراكب: ${costPerPerson - paymentAmount} جنية`
                        : 'المبلغ مضبوط'
                    }
                  </p>
                </div>
              )}
            </div>

            <SheetFooter className="mt-6 flex flex-col gap-2">
              <Button 
                onClick={() => selectedPassenger && handlePayment(selectedPassenger.id)}
                disabled={!paymentAmount || isProcessing}
                className="w-full"
              >
                {isProcessing ? 'جاري التسجيل...' : 'تأكيد الدفع'}
              </Button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <SheetClose asChild>
                <Button variant="outline" className="w-full">
                  إلغاء
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </main>
      <Footer />
    </>
  );
}
