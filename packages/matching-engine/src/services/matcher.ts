import { redis, nats, db, calculateDistance } from '@cytaxi/shared';
import { config } from '../config';

interface RideRequest {
  rideId: string;
  passengerId: string;
  pickup: { lat: number; lon: number };
  destination: { lat: number; lon: number };
}

interface NearbyDriver {
  id: string;
  distance: number;
  lat: number;
  lon: number;
}

export const matcher = {
  async findAndAssignDriver(ride: RideRequest): Promise<void> {
    console.log(`🔍 Buscando conductor para viaje ${ride.rideId}`);

    // Buscar conductores cercanos en Redis
    const nearbyDrivers = await redis.getNearbyDrivers(
      ride.pickup.lat,
      ride.pickup.lon,
      config.matching.maxRadiusKm
    );

    if (nearbyDrivers.length === 0) {
      console.log(`❌ No se encontraron conductores cercanos para viaje ${ride.rideId}`);
      await this.notifyNoDriverAvailable(ride);
      return;
    }

    console.log(`📍 Encontrados ${nearbyDrivers.length} conductores cercanos`);

    // Seleccionar el conductor más cercano (algoritmo simple)
    const bestDriver = this.selectBestDriver(nearbyDrivers);

    if (!bestDriver) {
      console.log(`❌ No se pudo seleccionar conductor para viaje ${ride.rideId}`);
      await this.notifyNoDriverAvailable(ride);
      return;
    }

    console.log(`✅ Conductor seleccionado: ${bestDriver.id} (${bestDriver.distance.toFixed(2)} km)`);

    // Asignar conductor al viaje
    await this.assignDriver(ride, bestDriver);
  },

  selectBestDriver(drivers: NearbyDriver[]): NearbyDriver | null {
    if (drivers.length === 0) return null;

    // Algoritmo de scoring simple
    // Puntuación = distancia inversa (más cercano = mejor puntuación)
    const scoredDrivers = drivers.map((driver) => ({
      ...driver,
      score: 1 / (driver.distance + 0.1), // Evitar división por cero
    }));

    // Ordenar por puntuación (mayor a menor)
    scoredDrivers.sort((a, b) => b.score - a.score);

    // Retornar el mejor
    return scoredDrivers[0];
  },

  async assignDriver(ride: RideRequest, driver: NearbyDriver): Promise<void> {
    try {
      // Actualizar viaje en base de datos
      await db.updateRideStatus(ride.rideId, 'matched', driver.id);

      // Calcular tiempo estimado de llegada (simplificado)
      const estimatedArrival = Math.ceil(driver.distance * 2); // ~2 min por km

      // Publicar evento de viaje asignado
      await nats.publish('ride.matched', {
        type: 'ride.matched',
        rideId: ride.rideId,
        driverId: driver.id,
        driverLocation: { lat: driver.lat, lon: driver.lon },
        estimatedArrival,
        timestamp: new Date(),
      });

      // Notificar al conductor
      await this.notifyDriver(driver.id, ride, estimatedArrival);

      // Notificar al pasajero
      await this.notifyPassenger(ride.passengerId, driver, estimatedArrival);

      console.log(`📤 Notificaciones enviadas para viaje ${ride.rideId}`);
    } catch (error) {
      console.error(`❌ Error al asignar conductor:`, error);
    }
  },

  async notifyDriver(
    driverId: string,
    ride: RideRequest,
    estimatedArrival: number
  ): Promise<void> {
    await nats.publish('notification.send', {
      type: 'notification.send',
      recipientId: driverId,
      recipientType: 'driver',
      channel: 'push',
      template: 'ride_offer',
      data: {
        rideId: ride.rideId,
        pickup: ride.pickup,
        destination: ride.destination,
        estimatedArrival,
      },
      timestamp: new Date(),
    });
  },

  async notifyPassenger(
    passengerId: string,
    driver: NearbyDriver,
    estimatedArrival: number
  ): Promise<void> {
    await nats.publish('notification.send', {
      type: 'notification.send',
      recipientId: passengerId,
      recipientType: 'passenger',
      channel: 'whatsapp',
      template: 'driver_assigned',
      data: {
        driverId: driver.id,
        driverLocation: { lat: driver.lat, lon: driver.lon },
        estimatedArrival,
      },
      timestamp: new Date(),
    });
  },

  async notifyNoDriverAvailable(ride: RideRequest): Promise<void> {
    await nats.publish('notification.send', {
      type: 'notification.send',
      recipientId: ride.passengerId,
      recipientType: 'passenger',
      channel: 'whatsapp',
      template: 'no_driver_available',
      data: {
        rideId: ride.rideId,
      },
      timestamp: new Date(),
    });
  },
};
