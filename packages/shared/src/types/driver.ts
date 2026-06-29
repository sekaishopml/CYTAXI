export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  vehicle: Vehicle;
  documents: DriverDocuments;
  status: DriverStatus;
  rating: number;
  totalTrips: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  type: VehicleType;
}

export type VehicleType = 'sedan' | 'suv' | 'van' | 'motorcycle';

export interface DriverDocuments {
  license: string;
  insurance: string;
  registration?: string;
  idCard?: string;
}

export type DriverStatus = 'offline' | 'online' | 'busy' | 'on_trip';

export interface DriverLocation {
  driverId: string;
  lat: number;
  lon: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export interface RegisterDriverRequest {
  name: string;
  phone: string;
  email?: string;
  vehicle: Vehicle;
  documents: DriverDocuments;
}

export interface UpdateDriverStatusRequest {
  status: DriverStatus;
  location?: {
    lat: number;
    lon: number;
  };
}
