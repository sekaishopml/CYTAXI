import { Elysia, t } from 'elysia';
import { db, nats, generateId } from '@cytaxi/shared';
import { CreateRideRequest } from '@cytaxi/shared';

// Valid state transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  requested: ['matched', 'cancelled'],
  matched: ['accepted', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

// Calculate ride cost based on distance and duration
function calculateCost(distanceKm: number, durationMinutes: number): number {
  const baseRate = 50; // Base rate in local currency
  const perKmRate = 15; // Rate per km
  const perMinuteRate = 2; // Rate per minute

  return baseRate + distanceKm * perKmRate + durationMinutes * perMinuteRate;
}

export const rideRoutes = new Elysia()
  .post(
    '/',
    async ({ body }) => {
      const rideId = generateId();

      const ride = await db.createRide({
        id: rideId,
        passengerId: body.passengerId,
        pickupLat: body.pickup.lat,
        pickupLon: body.pickup.lon,
        destinationLat: body.destination.lat,
        destinationLon: body.destination.lon,
        pickupAddress: body.pickupAddress,
        destinationAddress: body.destinationAddress,
      });

      // Publicar evento de viaje solicitado
      await nats.publish('ride.requested', {
        type: 'ride.requested',
        rideId,
        passengerId: body.passengerId,
        pickup: body.pickup,
        destination: body.destination,
        pickupAddress: body.pickupAddress,
        destinationAddress: body.destinationAddress,
        timestamp: new Date(),
      });

      return {
        success: true,
        ride,
        message: 'Viaje creado exitosamente',
      };
    },
    {
      body: t.Object({
        passengerId: t.String(),
        pickup: t.Object({
          lat: t.Number(),
          lon: t.Number(),
        }),
        destination: t.Object({
          lat: t.Number(),
          lon: t.Number(),
        }),
        pickupAddress: t.Optional(t.String()),
        destinationAddress: t.Optional(t.String()),
      }),
      detail: {
        summary: 'Crear un nuevo viaje',
        tags: ['Rides'],
      },
    }
  )
  .get(
    '/:id',
    async ({ params }) => {
      const ride = await db.getRideById(params.id);

      if (!ride) {
        return { success: false, message: 'Viaje no encontrado' };
      }

      return { success: true, ride };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: 'Obtener un viaje por ID',
        tags: ['Rides'],
      },
    }
  )
  .patch(
    '/:id/status',
    async ({ params, body }) => {
      const ride = await db.getRideById(params.id);

      if (!ride) {
        return { success: false, message: 'Viaje no encontrado' };
      }

      // Validate state transition
      const validNextStates = VALID_TRANSITIONS[ride.status] || [];
      if (!validNextStates.includes(body.status)) {
        return {
          success: false,
          message: `Transición inválida: ${ride.status} → ${body.status}`,
        };
      }

      // Update ride status
      const updatedRide = await db.updateRideStatus(params.id, body.status, body.driverId);

      // Calculate cost if ride is completed
      let cost = null;
      if (body.status === 'completed' && ride.started_at) {
        const durationMs = Date.now() - new Date(ride.started_at).getTime();
        const durationMinutes = Math.ceil(durationMs / 60000);
        const distanceKm = calculateDistance(
          ride.pickup_lat,
          ride.pickup_lon,
          ride.destination_lat,
          ride.destination_lon
        );
        cost = calculateCost(distanceKm, durationMinutes);

        // Update ride with cost and duration
        await db.updateRideCost(params.id, cost, durationMinutes);
      }

      // Publicar evento de cambio de estado
      await nats.publish('ride.status_changed', {
        type: 'ride.status_changed',
        rideId: params.id,
        status: body.status,
        driverId: body.driverId,
        cost,
        timestamp: new Date(),
      });

      // Send specific notifications based on status
      await sendStatusNotifications(params.id, body.status, ride, body.driverId);

      return {
        success: true,
        ride: updatedRide,
        cost,
        message: 'Estado actualizado exitosamente',
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        status: t.String(),
        driverId: t.Optional(t.String()),
      }),
      detail: {
        summary: 'Actualizar estado de un viaje',
        tags: ['Rides'],
      },
    }
  )
  .get(
    '/active',
    async () => {
      const rides = await db.getActiveRides();

      return {
        success: true,
        rides,
        total: rides.length,
      };
    },
    {
      detail: {
        summary: 'Obtener viajes activos',
        tags: ['Rides'],
      },
    }
  );

async function sendStatusNotifications(
  rideId: string,
  status: string,
  ride: any,
  driverId?: string
): Promise<void> {
  switch (status) {
    case 'matched':
      await nats.publish('notification.send', {
        type: 'notification.send',
        recipientId: ride.passenger_id,
        recipientType: 'passenger',
        channel: 'whatsapp',
        template: 'driver_assigned',
        data: { rideId, driverId },
        timestamp: new Date(),
      });
      break;

    case 'accepted':
      await nats.publish('notification.send', {
        type: 'notification.send',
        recipientId: ride.passenger_id,
        recipientType: 'passenger',
        channel: 'whatsapp',
        template: 'driver_on_way',
        data: { rideId, driverId },
        timestamp: new Date(),
      });
      break;

    case 'in_progress':
      await nats.publish('notification.send', {
        type: 'notification.send',
        recipientId: ride.passenger_id,
        recipientType: 'passenger',
        channel: 'whatsapp',
        template: 'ride_started',
        data: { rideId },
        timestamp: new Date(),
      });
      break;

    case 'completed':
      await nats.publish('notification.send', {
        type: 'notification.send',
        recipientId: ride.passenger_id,
        recipientType: 'passenger',
        channel: 'whatsapp',
        template: 'ride_completed',
        data: { rideId },
        timestamp: new Date(),
      });
      break;

    case 'cancelled':
      await nats.publish('notification.send', {
        type: 'notification.send',
        recipientId: ride.passenger_id,
        recipientType: 'passenger',
        channel: 'whatsapp',
        template: 'ride_cancelled',
        data: { rideId },
        timestamp: new Date(),
      });
      break;
  }
}

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
