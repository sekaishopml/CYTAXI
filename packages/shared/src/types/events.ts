import { Ride, RideStatus, Location } from './ride';
import { Driver, DriverStatus, DriverLocation } from './driver';

// ===========================================
// RIDE EVENTS
// ===========================================

export interface RideRequestedEvent {
  type: 'ride.requested';
  rideId: string;
  passengerId: string;
  pickup: Location;
  destination: Location;
  pickupAddress?: string;
  destinationAddress?: string;
  timestamp: Date;
}

export interface RideMatchedEvent {
  type: 'ride.matched';
  rideId: string;
  driverId: string;
  driverLocation: Location;
  estimatedArrival: number;
  timestamp: Date;
}

export interface RideAcceptedEvent {
  type: 'ride.accepted';
  rideId: string;
  driverId: string;
  timestamp: Date;
}

export interface RideStartedEvent {
  type: 'ride.started';
  rideId: string;
  driverId: string;
  timestamp: Date;
}

export interface RideCompletedEvent {
  type: 'ride.completed';
  rideId: string;
  driverId: string;
  fare: number;
  distance: number;
  duration: number;
  timestamp: Date;
}

export interface RideCancelledEvent {
  type: 'ride.cancelled';
  rideId: string;
  cancelledBy: 'passenger' | 'driver' | 'system';
  reason?: string;
  timestamp: Date;
}

// ===========================================
// DRIVER EVENTS
// ===========================================

export interface DriverStatusChangedEvent {
  type: 'driver.status_changed';
  driverId: string;
  status: DriverStatus;
  location?: Location;
  timestamp: Date;
}

export interface DriverLocationUpdatedEvent {
  type: 'driver.location_updated';
  driverId: string;
  location: Location;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export interface DriverAvailableEvent {
  type: 'driver.available';
  driverId: string;
  location: Location;
  vehicleType: string;
  rating: number;
  timestamp: Date;
}

// ===========================================
// NOTIFICATION EVENTS
// ===========================================

export interface NotificationEvent {
  type: 'notification.send';
  recipientId: string;
  recipientType: 'passenger' | 'driver' | 'admin';
  channel: 'whatsapp' | 'push' | 'sms';
  template: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

// ===========================================
// EVENT UNION TYPE
// ===========================================

export type DomainEvent =
  | RideRequestedEvent
  | RideMatchedEvent
  | RideAcceptedEvent
  | RideStartedEvent
  | RideCompletedEvent
  | RideCancelledEvent
  | DriverStatusChangedEvent
  | DriverLocationUpdatedEvent
  | DriverAvailableEvent
  | NotificationEvent;

// ===========================================
// NATS SUBJECTS
// ===========================================

export const NATS_SUBJECTS = {
  // Rides
  RIDE_REQUESTED: 'ride.requested',
  RIDE_MATCHED: 'ride.matched',
  RIDE_ACCEPTED: 'ride.accepted',
  RIDE_STARTED: 'ride.started',
  RIDE_COMPLETED: 'ride.completed',
  RIDE_CANCELLED: 'ride.cancelled',

  // Drivers
  DRIVER_STATUS_CHANGED: 'driver.status_changed',
  DRIVER_LOCATION_UPDATED: 'driver.location_updated',
  DRIVER_AVAILABLE: 'driver.available',

  // Notifications
  NOTIFICATION_SEND: 'notification.send',
} as const;
