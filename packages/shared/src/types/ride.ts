export interface Ride {
  id: string;
  passengerId: string;
  driverId?: string;
  status: RideStatus;
  pickup: Location;
  destination: Location;
  pickupAddress?: string;
  destinationAddress?: string;
  fare?: number;
  distance?: number;
  duration?: number;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type RideStatus =
  | 'pending'
  | 'requested'
  | 'matched'
  | 'accepted'
  | 'arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Location {
  lat: number;
  lon: number;
}

export interface CreateRideRequest {
  passengerId: string;
  pickup: Location;
  destination: Location;
  pickupAddress?: string;
  destinationAddress?: string;
}

export interface RideMatchedEvent {
  type: 'ride.matched';
  rideId: string;
  driverId: string;
  driverLocation: Location;
  estimatedArrival: number;
}

export interface RideStatusChangedEvent {
  type: 'ride.status_changed';
  rideId: string;
  status: RideStatus;
  driverId?: string;
  location?: Location;
}
