import { Elysia, t } from 'elysia';
import { db, nats, generateId } from '@cytaxi/shared';
import { CreateRideRequest } from '@cytaxi/shared';

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
      const ride = await db.updateRideStatus(params.id, body.status, body.driverId);

      if (!ride) {
        return { success: false, message: 'Viaje no encontrado' };
      }

      // Publicar evento de cambio de estado
      await nats.publish('ride.status_changed', {
        type: 'ride.status_changed',
        rideId: params.id,
        status: body.status,
        driverId: body.driverId,
        timestamp: new Date(),
      });

      return {
        success: true,
        ride,
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
