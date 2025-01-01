import { Bus, Car, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { vehiclePresets, type VehicleType } from '@/types/vehicles';

interface VehicleSelectorProps {
  selectedVehicle: VehicleType;
  onVehicleSelect: (type: VehicleType) => void;
}

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

export function VehicleSelector({ selectedVehicle, onVehicleSelect }: VehicleSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {vehiclePresets.map((vehicle) => (
        <Button
          key={vehicle.type}
          variant={selectedVehicle === vehicle.type ? "default" : "outline"}
          onClick={() => onVehicleSelect(vehicle.type)}
          className="flex items-center justify-center h-12 w-full gap-2 px-3"
        >
          {getVehicleIcon(vehicle.type)}
          <span>{vehicle.name}</span>
        </Button>
      ))}
    </div>
  );
} 