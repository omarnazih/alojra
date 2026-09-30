'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Bus, Car, Settings, User, Moon, Sun, RotateCcw } from "lucide-react";
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
import { useTheme } from "next-themes";
import { Footer } from "@/components/footer";
import { Instructions } from "@/components/instructions";
import { Label } from "@/components/ui/label";
import { SeatMap } from "@/components/seat-map";
import { buildSeatLayout } from "@/config/seat-layouts";
import { ConfirmDialog } from "@/components/confirm-dialog";
import Image from 'next/image';

const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  if (typeof window !== 'undefined') {
    window.gtag?.('event', eventName, properties);
  }
};

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
  const { theme, setTheme } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [isAutoOpened, setIsAutoOpened] = useState(false);
  const [selectedPassengersForPayment, setSelectedPassengersForPayment] = useState<number[]>([]);
  const [changeModalPassenger, setChangeModalPassenger] = useState<Passenger | null>(null);
  const [partialChangeAmount, setPartialChangeAmount] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'map' | 'cards'>('map');
  const [pendingFareChange, setPendingFareChange] = useState<{ from: number; to: number } | null>(null);
  const [pendingVehicleChange, setPendingVehicleChange] = useState<VehicleType | null>(null);

  // Load state from localStorage on mount.
  // Hydration-safe restore: localStorage does not exist during SSR, so a saved
  // trip can only be applied after mount. A lazy useState initializer would render
  // different markup on the client than the server.
  /* eslint-disable react-hooks/set-state-in-effect -- applying persisted state after mount */
  useEffect(() => {
    const savedState = localStorage.getItem('ojraState');
    if (!savedState) return;

    try {
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
    } catch {
      // Corrupt or outdated payload: start from a clean trip instead of crashing.
      localStorage.removeItem('ojraState');
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('ojraState', JSON.stringify({
      selectedVehicle,
      costPerPerson,
      customCapacity,
      passengers
    }));
  }, [selectedVehicle, costPerPerson, customCapacity, passengers]);

  // Check if we should show instructions on mount.
  // Deferred to an effect for the same reason as the restore above: the server
  // cannot know a localStorage preference, and opening the dialog during the
  // first client render would not match the server HTML.
  /* eslint-disable react-hooks/set-state-in-effect -- mount-time localStorage preference */
  useEffect(() => {
    const dontShowAgain = localStorage.getItem('dontShowInstructions');
    if (!dontShowAgain) {
      setInstructionsOpen(true);
      setIsAutoOpened(true);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleDontShowAgain = (checked: boolean) => {
    if (checked) {
      localStorage.setItem('dontShowInstructions', 'true');
    } else {
      localStorage.removeItem('dontShowInstructions');
    }
  };

  const capacity = useMemo(() => {
    const preset = vehiclePresets.find(v => v.type === selectedVehicle);
    return selectedVehicle === 'custom' ? customCapacity : preset?.capacity || 0;
  }, [selectedVehicle, customCapacity]);

  const seatLayout = useMemo(
    () => buildSeatLayout(selectedVehicle, capacity),
    [selectedVehicle, capacity],
  );

  const totalCost = costPerPerson * capacity;

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
    if (pendingVehicleChange) {
      setPendingVehicleChange(type);
      return;
    }
    if (passengers.some(p => p.paid > 0) && type !== selectedVehicle) {
      setPendingVehicleChange(type);
      return;
    }
    applyVehicleChange(type);
  };

  const applyVehicleChange = (type: VehicleType) => {
    trackEvent('vehicle_selected', { vehicle_type: type });
    setSelectedVehicle(type);
    initializePassengers(type, costPerPerson);
    setPendingVehicleChange(null);
  };

  const cancelVehicleChange = () => setPendingVehicleChange(null);

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
    } catch (err: unknown) {
      trackEvent('payment_error', { error: err instanceof Error ? err.message : String(err) });
      setError('حدث خطأ أثناء تسجيل الدفع');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangeGiven = (passengerId: number, given: boolean) => {
    trackEvent('change_given', { passenger_id: passengerId, given });
    setPassengers(prev => prev.map(p => {
      if (p.id === passengerId) {
        return { ...p, changeGiven: given };
      }
      return p;
    }));
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

  const handleCostChange = (cost: number) => {
    if (cost < 0) return;
    if (cost > PAYMENT_LIMIT) return;
    const validCost = isNaN(cost) ? 0 : formatNumber(cost);

    // If the user is already editing inside the confirmation dialog, update the pending value.
    if (pendingFareChange) {
      setPendingFareChange({ ...pendingFareChange, to: validCost });
      setCostPerPerson(validCost);
      return;
    }

    // Guard fare changes that would alter existing payments.
    if (passengers.length > 0 && passengers.some(p => p.paid > 0) && validCost !== costPerPerson) {
      setPendingFareChange({ from: costPerPerson, to: validCost });
      setCostPerPerson(validCost);
      return;
    }

    applyFareChange(validCost);
  };

  const applyFareChange = (validCost: number) => {
    trackEvent('cost_changed', { new_cost: validCost });
    setCostPerPerson(validCost);
    initializePassengers(selectedVehicle, validCost);
    setPendingFareChange(null);
  };

  const confirmFareChangeKeepPayments = () => {
    if (!pendingFareChange) return;
    trackEvent('cost_changed_keep_payments', { new_cost: pendingFareChange.to });
    setCostPerPerson(pendingFareChange.to);
    setPendingFareChange(null);
  };

  const confirmFareChangeResetPayments = () => {
    if (!pendingFareChange) return;
    applyFareChange(pendingFareChange.to);
  };

  const cancelFareChange = () => {
    if (!pendingFareChange) return;
    setCostPerPerson(pendingFareChange.from);
    setPendingFareChange(null);
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

  const getTotalRequired = () => {
    if (selectedPassenger?.isSpecialPayment) {
      return formatNumber(paymentAmount);
    }
    return formatNumber(costPerPerson * (selectedPassengersForPayment.length + 1));
  };

  const getPaymentStatus = () => {
    const total = getTotalRequired();
    if (paymentAmount > total) {
      return `البقي للراكب: ${formatNumber(paymentAmount - total)} جنية`;
    } else if (paymentAmount < total) {
      return `متبقي: ${formatNumber(total - paymentAmount)} جنية`;
    }
    return 'المبلغ مضبوط';
  };

  const getTotalChange = () => {
    return formatNumber(passengers.reduce((sum, passenger) => {
      const change = passenger.paid > costPerPerson ? passenger.paid - costPerPerson : 0;
      return sum + (passenger.changeGiven ? 0 : change);
    }, 0));
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
        <div className="flex justify-between items-center mb-8 relative p-4 rounded-lg bg-gradient-to-r from-primary/10 via-transparent to-primary/10 overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_25%,rgba(68,68,68,.2)_50%,transparent_50%,transparent_75%,rgba(68,68,68,.2)_75%)] bg-[length:10px_10px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_50%,rgba(255,255,255,0.1),transparent)]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            aria-label="بدء رحلة جديدة"
            title="بدء رحلة جديدة"
            className="h-10 w-10 rounded-full relative z-10"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 relative z-10">
            <div className="relative w-40 h-16">
              <Image
                src="/logo-light.png"
                alt="حاسبة الأجرة"
                fill
                sizes="160px"
                className="object-contain dark:hidden [&>*]:!whitespace-nowrap"
                priority
              />
              <Image
                src="/logo-dark.png"
                alt="حاسبة الأجرة"
                fill
                sizes="160px"
                className="object-contain hidden dark:block [&>*]:!whitespace-nowrap"
                priority
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newTheme = theme === 'dark' ? 'light' : 'dark';
              trackEvent('theme_changed', { new_theme: newTheme });
              setTheme(newTheme);
            }}
            aria-label="تبديل المظهر"
            title="تبديل المظهر"
            className="h-10 w-10 rounded-full relative z-10"
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
            max={PAYMENT_LIMIT}
            step="0.01"
            value={costPerPerson || ''}
            onChange={(e) => handleCostChange(Number(e.target.value))}
            className="h-12"
          />
        </div>

        {selectedVehicle && costPerPerson === 0 && (
          <Card className="mb-6 p-8 text-center">
            <Bus className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <h3 className="mb-1 text-lg font-semibold">ابدأ رحلة جديدة</h3>
            <p className="text-sm text-muted-foreground">
              اختر نوع المركبة وأدخل الأجرة للراكب الواحد لتوليد خريطة المقاعد.
            </p>
          </Card>
        )}

        {selectedVehicle && costPerPerson > 0 && (
          <Card className="mb-6 overflow-hidden">
            <div className="grid grid-cols-3 gap-4 p-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">عدد الركاب</p>
                <p className="text-2xl font-bold tabular-nums">{capacity}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إجمالي الأجرة</p>
                <p className="text-2xl font-bold tabular-nums">{formatNumber(totalCost)} ج</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">تم تحصيل</p>
                <p className="text-2xl font-bold tabular-nums text-green-600">{getTotalPaid()} ج</p>
              </div>
            </div>
            <div className="h-2 w-full bg-muted-foreground/20" aria-hidden="true">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{
                  width: `${totalCost > 0 ? Math.min((passengers.reduce((sum, p) => sum + (p.paid >= costPerPerson ? costPerPerson : p.paid), 0) / totalCost) * 100, 100) : 0}%`,
                }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 bg-muted p-3 text-sm">
              <span className={getRemainingTotal() > 0 ? 'font-medium text-red-600' : 'font-medium text-green-600'}>
                المتبقي: {getRemainingTotal()} ج
              </span>
              <span className={getTotalChange() > 0 ? 'font-medium text-yellow-600' : 'font-medium text-green-600'}>
                مجموع الباقي: {getTotalChange()} ج
              </span>
            </div>
          </Card>
        )}

        {selectedVehicle && passengers.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-center">
              <div
                role="group"
                aria-label="طريقة عرض الركاب"
                className="inline-flex rounded-lg border bg-muted p-1"
              >
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  aria-pressed={viewMode === 'map'}
                  onClick={() => {
                    trackEvent('view_mode_changed', { view_mode: 'map' });
                    setViewMode('map');
                  }}
                >
                  خريطة المقاعد
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  aria-pressed={viewMode === 'cards'}
                  onClick={() => {
                    trackEvent('view_mode_changed', { view_mode: 'cards' });
                    setViewMode('cards');
                  }}
                >
                  بطاقات الركاب
                </Button>
              </div>
            </div>

            {viewMode === 'map' ? (
              <SeatMap
                layout={seatLayout}
                passengers={passengers}
                costPerPerson={costPerPerson}
                vehicle={selectedVehicle}
                vehicleName={
                  vehiclePresets.find(v => v.type === selectedVehicle)?.name ??
                  (selectedVehicle === 'custom' ? 'مخصص' : '')
                }
                onSelectPassenger={setSelectedPassenger}
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {passengers.map((passenger) => {
                  const isPaid = passenger.paid >= costPerPerson;
                  const isPartial = passenger.paid > 0 && passenger.paid < costPerPerson;
                  const hasChangeDue = passenger.paid > costPerPerson && !passenger.changeGiven;
                  return (
                    <Card
                      key={passenger.id}
                      className={`overflow-hidden ${isPaid ? 'border-green-500' : 'border-gray-200'}`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedPassenger(passenger)}
                        className="flex w-full items-center justify-between gap-2 p-4 text-right transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`راكب ${passenger.seatNumber}، ${isPaid ? 'تم الدفع' : isPartial ? 'دفع جزئي' : 'لم يدفع'}، ${passenger.paid} جنية`}
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          <span className="text-lg font-semibold">راكب {passenger.seatNumber}</span>
                        </div>
                        <span className="text-sm font-medium">{passenger.paid} جنية</span>
                      </button>
                      <div className="space-y-2 px-4 pb-4">
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
                        {passenger.paid < costPerPerson && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setSelectedPassenger(passenger)}
                          >
                            تسجيل دفع
                          </Button>
                        )}
                        {hasChangeDue && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                            onClick={() => setChangeModalPassenger(passenger)}
                          >
                            إرجاع {formatNumber(passenger.paid - costPerPerson)} جنية
                          </Button>
                        )}
                        {passenger.paid > costPerPerson && (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`change-${passenger.id}`}
                              checked={passenger.changeGiven}
                              onCheckedChange={(checked) => handleChangeGiven(passenger.id, checked === true)}
                            />
                            <label htmlFor={`change-${passenger.id}`} className="text-sm">
                              تم إعطاء الباقي
                            </label>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <Dialog 
          open={!!selectedPassenger} 
          onOpenChange={(open) => !open && setSelectedPassenger(null)}
        >
          <DialogContent 
            className="sm:max-w-[425px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && paymentAmount > 0 && selectedPassenger) {
                handlePayment(selectedPassenger.id);
              }
              if (e.key === 'Escape') {
                setSelectedPassenger(null);
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>دفع الأجرة - راكب {selectedPassenger?.seatNumber}</DialogTitle>
              <DialogDescription>
                <span className="block">المطلوب: {costPerPerson} جنية</span>
                {selectedPassenger?.paid ? (
                  <span className="mt-2 block">
                    المدفوع حالياً: {selectedPassenger.paid} جنية
                  </span>
                ) : null}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-6 space-y-4">
              <div>
                <Label>المبلغ المدفوع</Label>
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="0"
                    max={PAYMENT_LIMIT}
                    step="0.01"
                    value={paymentAmount || ''}
                    onChange={(e) => handlePaymentAmountChange(Number(e.target.value))}
                    placeholder="أدخل المبلغ"
                  />
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="special-payment"
                      checked={selectedPassenger?.isSpecialPayment}
                      onCheckedChange={(checked) => {
                        if (selectedPassenger) {
                          setSelectedPassenger({
                            ...selectedPassenger,
                            isSpecialPayment: !!checked
                          });
                          // Clear selected passengers when switching to special payment
                          if (checked) {
                            setSelectedPassengersForPayment([]);
                          }
                        }
                      }}
                    />
                    <Label htmlFor="special-payment">دفع مبلغ مخصص</Label>
                  </div>
                </div>
                {paymentAmount > 0 && paymentAmount < getTotalRequired() && !selectedPassenger?.isSpecialPayment && (
                  <p className="text-sm text-red-500 mt-2">
                    يجب إدخال المبلغ المطلوب ({getTotalRequired()} جنية) أو أكثر
                  </p>
                )}
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
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Checkbox 
                      id="select-all"
                      checked={selectedPassengersForPayment.length === passengers.filter(p => !p.paid && p.id !== selectedPassenger?.id).length}
                      onCheckedChange={(checked) => {
                        if (selectedPassenger?.isSpecialPayment) return;
                        if (checked) {
                          const allUnpaidIds = passengers
                            .filter(p => !p.paid && p.id !== selectedPassenger?.id)
                            .map(p => p.id);
                          setSelectedPassengersForPayment(allUnpaidIds);
                        } else {
                          setSelectedPassengersForPayment([]);
                        }
                      }}
                      disabled={selectedPassenger?.isSpecialPayment}
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
                            if (selectedPassenger?.isSpecialPayment) return;
                            setSelectedPassengersForPayment(prev => 
                              checked 
                                ? [...prev, p.id]
                                : prev.filter(id => id !== p.id)
                            );
                          }}
                          disabled={selectedPassenger?.isSpecialPayment}
                        />
                        <label htmlFor={`passenger-${p.id}`}>راكب {p.seatNumber}</label>
                      </div>
                    ))}
                </div>
              </div>

              {paymentAmount > 0 && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  {!selectedPassenger?.isSpecialPayment && (
                    <p>
                      عدد الركاب: {selectedPassengersForPayment.length + 1}
                    </p>
                  )}
                  <p>
                    الإجمالي المطلوب: {getTotalRequired()} جنية
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
                disabled={
                  !paymentAmount || 
                  isProcessing || 
                  (!selectedPassenger?.isSpecialPayment && paymentAmount < getTotalRequired())
                }
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

        <Dialog 
          open={!!changeModalPassenger} 
          onOpenChange={(open) => !open && setChangeModalPassenger(null)}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>الباقي للراكب {changeModalPassenger?.seatNumber}</DialogTitle>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <p className="text-xl font-bold text-center">
                المبلغ المتبقي: {changeModalPassenger && formatNumber(changeModalPassenger.paid - costPerPerson)} جنية
              </p>
              
              <div className="space-y-2">
                <Label>المبلغ المراد إرجاعه</Label>
                <Input
                  type="number"
                  min="0"
                  max={changeModalPassenger ? changeModalPassenger.paid - costPerPerson : 0}
                  step="0.01"
                  value={partialChangeAmount || ''}
                  onChange={(e) => setPartialChangeAmount(Number(e.target.value))}
                  placeholder="أدخل المبلغ"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col gap-2">
              <Button 
                onClick={() => changeModalPassenger && handlePartialChange(changeModalPassenger, partialChangeAmount)}
                disabled={!partialChangeAmount || partialChangeAmount <= 0}
                className="w-full"
              >
                تم إرجاع {partialChangeAmount || 0} جنية
              </Button>
              <Button 
                onClick={() => {
                  if (changeModalPassenger) {
                    handlePartialChange(
                      changeModalPassenger,
                      changeModalPassenger.paid - costPerPerson
                    );
                  }
                }}
                className="w-full"
              >
                تم إرجاع كل الباقي
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setChangeModalPassenger(null);
                  setPartialChangeAmount(0);
                }}
                className="w-full"
              >
                إغلاق
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <ConfirmDialog
          open={!!pendingFareChange}
          title="تغيير الأجرة"
          description={
            <span>
              هناك مدفوعات مسجلة بالفعل. إذا استمررت، سيتم إعادة حساب حالة كل راكب بناءً على الأجرة الجديدة (
              <strong>{pendingFareChange?.to} جنية</strong>).
            </span>
          }
          actions={[
            { label: 'إلغاء', variant: 'outline', onClick: cancelFareChange },
            { label: 'تصفير المدفوعات', variant: 'destructive', onClick: confirmFareChangeResetPayments },
            { label: 'الاحتفاظ بالمدفوعات', onClick: confirmFareChangeKeepPayments },
          ]}
          onCancel={cancelFareChange}
        />

        <ConfirmDialog
          open={!!pendingVehicleChange}
          title="تغيير المركبة"
          description="سيتم مسح جميع المدفوعات عند تغيير نوع المركبة لأن عدد المقاعد سيختلف. هل تريد المتابعة؟"
          actions={[
            { label: 'إلغاء', variant: 'outline', onClick: cancelVehicleChange },
            { label: 'متابعة', onClick: () => pendingVehicleChange && applyVehicleChange(pendingVehicleChange) },
          ]}
          onCancel={cancelVehicleChange}
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
