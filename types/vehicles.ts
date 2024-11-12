export type VehicleType = 'microbus' | 'bus' | 'minibus' | 'taxi' | 'custom';

export interface VehiclePreset {
  type: VehicleType;
  name: string;
  capacity: number;
}

export const vehiclePresets: VehiclePreset[] = [
  { type: 'microbus', name: 'ميكروباص', capacity: 14 },
  { type: 'bus', name: 'باص', capacity: 50 },
  { type: 'taxi', name: 'تاكسي', capacity: 4 },
  { type: 'custom', name: 'مخصص', capacity: 0 },
]; 