import { Elysia, t } from 'elysia';
import { db, nats, redis, generateId } from '@cytaxi/shared';

export const driverRoutes = new Elysia()
  .post(
    '/register',
    async ({ body }) => {
      const driverId = generateId();

      const driver = await db.createDriver({
        id: driverId,
        name: body.name,
        phone: body.phone,
        email: body.email,
        vehiclePlate: body.vehicle.plate,
        vehicleBrand: body.vehicle.brand,
        vehicleModel: body.vehicle.model,
        vehicleYear: body.vehicle.year,
        vehicleColor: body.vehicle.color,
        vehicleType: body.vehicle.type,
        licenseNumber: body.documents.license,
        insuranceNumber: body.documents.insurance,
      });

      return {
        success: true,
        driver,
        message: 'Conductor registrado exitosamente',
      };
    },
    {
      body: t.Object({
        name: t.String(),
        phone: t.String(),
        email: t.Optional(t.String()),
        vehicle: t.Object({
          plate: t.String(),
          brand: t.String(),
          model: t.String(),
          year: t.Number(),
          color: t.String(),
          type: t.Union([
            t.Literal('sedan'),
            t.Literal('suv'),
            t.Literal('van'),
            t.Literal('motorcycle'),
          ]),
        }),
        documents: t.Object({
          license: t.String(),
          insurance: t.String(),
        }),
      }),
      detail: {
        summary: 'Registrar un nuevo conductor',
        tags: ['Drivers'],
      },
    }
  )
  .get(
    '/:id',
    async ({ params }) => {
      const driver = await db.getDriverById(params.id);

      if (!driver) {
        return { success: false, message: 'Conductor no encontrado' };
      }

      return { success: true, driver };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: 'Obtener un conductor por ID',
        tags: ['Drivers'],
      },
    }
  )
  .patch(
    '/:id/status',
    async ({ params, body }) => {
      const driver = await db.updateDriverStatus(params.id, body.status);

      if (!driver) {
        return { success: false, message: 'Conductor no encontrado' };
      }

      // Actualizar ubicación en Redis si se proporciona
      if (body.location) {
        await redis.addDriverLocation(params.id, body.location.lat, body.location.lon);
      }

      // Publicar evento de cambio de estado
      await nats.publish('driver.status_changed', {
        type: 'driver.status_changed',
        driverId: params.id,
        status: body.status,
        location: body.location,
        timestamp: new Date(),
      });

      return {
        success: true,
        driver,
        message: 'Estado actualizado exitosamente',
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        status: t.Union([
          t.Literal('offline'),
          t.Literal('online'),
          t.Literal('busy'),
          t.Literal('on_trip'),
        ]),
        location: t.Optional(
          t.Object({
            lat: t.Number(),
            lon: t.Number(),
          })
        ),
      }),
      detail: {
        summary: 'Actualizar estado del conductor',
        tags: ['Drivers'],
      },
    }
  )
  .patch(
    '/:id/location',
    async ({ params, body }) => {
      // Actualizar ubicación en Redis
      await redis.addDriverLocation(params.id, body.lat, body.lon);

      // Publicar evento de ubicación actualizada
      await nats.publish('driver.location_updated', {
        type: 'driver.location_updated',
        driverId: params.id,
        location: { lat: body.lat, lon: body.lon },
        heading: body.heading,
        speed: body.speed,
        timestamp: new Date(),
      });

      return {
        success: true,
        message: 'Ubicación actualizada exitosamente',
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        lat: t.Number(),
        lon: t.Number(),
        heading: t.Optional(t.Number()),
        speed: t.Optional(t.Number()),
      }),
      detail: {
        summary: 'Actualizar ubicación del conductor',
        tags: ['Drivers'],
      },
    }
  )
  .get(
    '/available',
    async () => {
      const drivers = await db.getAvailableDrivers();

      return {
        success: true,
        drivers,
        total: drivers.length,
      };
    },
    {
      detail: {
        summary: 'Obtener conductores disponibles',
        tags: ['Drivers'],
      },
    }
  );
