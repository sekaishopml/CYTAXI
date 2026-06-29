import { Elysia } from 'elysia';
import { redis, nats, db } from '@cytaxi/shared';
import { config } from '../config';

interface DriverLocation {
  driverId: string;
  rideId: string;
  lat: number;
  lon: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
}

export const trackingRoutes = new Elysia()
  .post('/api/tracking/location', async ({ body }) => {
    const { driverId, rideId, lat, lon, speed, heading } = body as DriverLocation;

    if (!driverId || !rideId || lat === undefined || lon === undefined) {
      return { error: 'driverId, rideId, lat, lon are required' }, 400;
    }

    const locationData = {
      driverId,
      rideId,
      lat,
      lon,
      speed: speed || 0,
      heading: heading || 0,
      timestamp: new Date(),
    };

    // Store in Redis with TTL
    const key = `tracking:${rideId}:${driverId}`;
    await redis.set(key, JSON.stringify(locationData), config.tracking.locationTTL);

    // Update driver location in GEO
    await redis.updateDriverLocation(driverId, lat, lon);

    // Publish tracking event
    await nats.publish('tracking.updated', {
      type: 'tracking.updated',
      rideId,
      driverId,
      location: { lat, lon },
      speed,
      heading,
      timestamp: new Date(),
    });

    return { success: true, message: 'Location updated' };
  })
  .get('/api/tracking/:rideId', async ({ params }) => {
    const { rideId } = params;

    // Get all driver locations for this ride from Redis
    const pattern = `tracking:${rideId}:*`;
    const keys = await redis.keys(pattern);

    if (keys.length === 0) {
      return { rideId, locations: [], message: 'No tracking data yet' };
    }

    const locations = [];
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        locations.push(JSON.parse(data));
      }
    }

    return { rideId, locations };
  })
  .get('/api/tracking/:rideId/eta', async ({ params }) => {
    const { rideId } = params;

    // Get ride info from PostgreSQL
    const ride = await db.getRideById(rideId);

    if (!ride) {
      return { error: 'Ride not found' }, 404;
    }

    // Get driver location from Redis
    const pattern = `tracking:${rideId}:*`;
    const keys = await redis.keys(pattern);

    if (keys.length === 0) {
      return { 
        rideId, 
        driverLocation: null,
        destination: { lat: parseFloat(ride.destination_lat), lon: parseFloat(ride.destination_lon) },
        distance: null,
        etaMinutes: null,
        message: 'Driver location not available yet'
      };
    }

    // Get the most recent location
    const latestKey = keys[keys.length - 1];
    const trackingData = await redis.get(latestKey);

    if (!trackingData) {
      return { error: 'Driver location not available' }, 404;
    }

    const driverLocation = JSON.parse(trackingData);

    // Calculate distance to destination
    const distance = calculateDistance(
      driverLocation.lat,
      driverLocation.lon,
      parseFloat(ride.destination_lat),
      parseFloat(ride.destination_lon)
    );

    // Estimate time (assuming average speed of 30 km/h in city)
    const avgSpeedKmh = 30;
    const etaMinutes = Math.ceil((distance / avgSpeedKmh) * 60);

    return {
      rideId,
      driverLocation: { lat: driverLocation.lat, lon: driverLocation.lon },
      destination: { lat: parseFloat(ride.destination_lat), lon: parseFloat(ride.destination_lon) },
      distance: distance.toFixed(2),
      etaMinutes,
    };
  });

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
