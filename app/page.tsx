'use client';

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { vehiclePresets, type VehicleType } from '../types/vehicles';
import { type Passenger } from '../types/passenger';
import { Footer } from "@/components/footer";
import { Instructions } from "@/components/instructions";
import { Header } from "@/components/header";
import { VehicleSelector } from "@/components/vehicle-selector";
import { TripSummary } from "@/components/trip-summary";
import { PassengerCard } from "@/components/passenger-card";
import { PaymentModal } from "@/components/modals/payment-modal";
import { ChangeModal } from "@/components/modals/change-modal";

const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, properties);
  }
};

const resetState = {
  costPerPerson: 0,
  customCapacity: 0,
  passengers: [],
  paymentAmount: 0,
  selectedPassenger: null
};

const PAYMENT_LIMIT = 10000;

const formatNumber = (value: number): number => {
  return Number(Math.round(value * 100) / 100);
};

export default function Home() {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('microbus');
  const [costPerPerson, setCostPerPerson] = useState<number>(0);
  const [customCapacity, setCustomCapacity] = useState<number>(0);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [isAutoOpened, setIsAutoOpened] = useState(false);
  const [selectedPassengersForPayment, setSelectedPassengersForPayment] = useState<number[]>([]);
  const [changeModalPassenger, setChangeModalPassenger] = useState<Passenger | null>(null);
  const [partialChangeAmount, setPartialChangeAmount] = useState<number>(0);

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
    trackEvent('vehicle_selected', { vehicle_type: type });
    setSelectedVehicle(type);
    initializePassengers(type, costPerPerson);
  };

  const handlePayment = async (passengerId: number) => {
    if (!paymentAmount) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // If special payment, ignore selected passengers
      const isSpecial = selectedPassenger?.isSpecialPayment;
      const effectivePassengers = isSpecial ? [] : selectedPassengersForPayment;
      const totalPassengers = effectivePassengers.length + 1;
      
      const effectiveCostPerPerson = isSpecial ? paymentAmount : costPerPerson;
      const amountPerPerson = formatNumber(Math.min(paymentAmount / totalPassengers, effectiveCostPerPerson));
      const remainingAmount = formatNumber(paymentAmount - (amountPerPerson * totalPassengers));
      
      trackEvent('payment_made', {
        amount: paymentAmount,
        passengers_count: totalPassengers,
        amount_per_person: amountPerPerson,
        remaining_amount: remainingAmount,
        is_special: isSpecial
      });

      setPassengers(prev => prev.map(p => {
        if (p.id === passengerId) {
          return { 
            ...p, 
            paid: formatNumber(amountPerPerson + remainingAmount),
            paidFor: isSpecial ? [] : effectivePassengers,
            isSpecialPayment: isSpecial
          };
        }
        if (!isSpecial && effectivePassengers.includes(p.id)) {
          return { 
            ...p, 
            paid: formatNumber(amountPerPerson),
            paidBy: passengerId 
          };
        }
        return p;
      }));
      
      setPaymentAmount(0);
      setSelectedPassenger(null);
      setSelectedPassengersForPayment([]);
    } catch (err: any) {
      trackEvent('payment_error', { error: err.message });
      setError('حدث خطأ أثناء تسجيل الدفع');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangeGiven = (
    e: React.MouseEvent<Element>,
    passengerId: number, 
    given: boolean
  ) => {
    e.stopPropagation();
    trackEvent('change_given', { passenger_id: passengerId, given });
    setPassengers(prev => prev.map(p => {
      if (p.id === passengerId) {
        return { ...p, changeGiven: given };
      }
      return p;
    }));
  };

  const handleCostChange = (cost: number) => {
    if (cost < 0) return;
    if (cost > PAYMENT_LIMIT) return;
    const validCost = isNaN(cost) ? 0 : formatNumber(cost);
    trackEvent('cost_changed', { new_cost: validCost });
    setCostPerPerson(validCost);
    initializePassengers(selectedVehicle, validCost);
  };

  const handleCustomCapacityChange = (capacity: number) => {
    if (capacity < 0) return;
    const validCapacity = isNaN(capacity) ? 0 : capacity;
    trackEvent('custom_capacity_changed', { new_capacity: validCapacity });
    setCustomCapacity(validCapacity);
    
    // Initialize passengers when capacity changes
    if (validCapacity > 0 && costPerPerson > 0) {
      const newPassengers = Array.from({ length: validCapacity }, (_, index) => ({
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

  const handlePaymentAmountChange = (amount: number) => {
    if (amount < 0) return;
    if (amount > PAYMENT_LIMIT) return;
    setPaymentAmount(isNaN(amount) ? 0 : formatNumber(amount));
  };

  const handleReset = () => {
    trackEvent('app_reset');
    setCostPerPerson(resetState.costPerPerson);
    setCustomCapacity(resetState.customCapacity);
    setPassengers(resetState.passengers);
    setPaymentAmount(resetState.paymentAmount);
    setSelectedPassenger(resetState.selectedPassenger);
  };

  const handleChangeClick = (e: React.MouseEvent, passenger: Passenger) => {
    e.stopPropagation();
    setChangeModalPassenger(passenger);
  };

  const handlePartialChange = (passenger: Passenger, amount: number) => {
    if (!amount || amount <= 0) return;
    
    const totalChange = passenger.paid - costPerPerson;
    const validAmount = Math.min(amount, totalChange);
    
    setPassengers(prev => prev.map(p => {
      if (p.id === passenger.id) {
        const newPaid = p.paid - validAmount;
        return { 
          ...p, 
          paid: formatNumber(newPaid),
          changeGiven: newPaid <= costPerPerson
        };
      }
      return p;
    }));
    
    setPartialChangeAmount(0);
    setChangeModalPassenger(null);
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
        <Header onReset={handleReset} />
        
        <VehicleSelector 
          selectedVehicle={selectedVehicle}
          onVehicleSelect={handleVehicleSelect}
        />

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
            max={PAYMENT_LIMIT}
            step="0.01"
            value={costPerPerson || ''}
            onChange={(e) => handleCostChange(Number(e.target.value))}
            className="h-12"
          />
        </div>

        {selectedVehicle && costPerPerson > 0 && (
          <TripSummary 
            capacity={getCapacity()}
            totalCost={totalCost}
            passengers={passengers}
            costPerPerson={costPerPerson}
          />
        )}

        {selectedVehicle && passengers.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            {passengers.map((passenger) => (
              <PassengerCard
                key={passenger.id}
                passenger={passenger}
                costPerPerson={costPerPerson}
                onPassengerSelect={setSelectedPassenger}
                onChangeClick={handleChangeClick}
                onChangeGiven={handleChangeGiven}
                passengers={passengers}
              />
            ))}
          </div>
        )}

        <PaymentModal
          selectedPassenger={selectedPassenger}
          paymentAmount={paymentAmount}
          costPerPerson={costPerPerson}
          isProcessing={isProcessing}
          error={error}
          selectedPassengersForPayment={selectedPassengersForPayment}
          passengers={passengers}
          onClose={() => setSelectedPassenger(null)}
          onPayment={handlePayment}
          onPaymentAmountChange={handlePaymentAmountChange}
          onPassengerSelectionChange={(checked, passengerId) => {
            setSelectedPassengersForPayment(prev => 
              checked 
                ? [...prev, passengerId]
                : prev.filter(id => id !== passengerId)
            );
          }}
          onSpecialPaymentChange={(checked) => {
            if (selectedPassenger) {
              setSelectedPassenger({
                ...selectedPassenger,
                isSpecialPayment: checked
              });
              if (checked) {
                setSelectedPassengersForPayment([]);
              }
            }
          }}
        />

        <ChangeModal
          passenger={changeModalPassenger}
          costPerPerson={costPerPerson}
          partialChangeAmount={partialChangeAmount}
          onClose={() => {
            setChangeModalPassenger(null);
            setPartialChangeAmount(0);
          }}
          onPartialChange={handlePartialChange}
          onPartialChangeAmountChange={setPartialChangeAmount}
        />
      </main>
      <Footer 
        onInstructionsClick={() => {
          trackEvent('instructions_opened');
          setIsAutoOpened(false);
          setInstructionsOpen(true);
        }} 
      />
    </>
  );
}
