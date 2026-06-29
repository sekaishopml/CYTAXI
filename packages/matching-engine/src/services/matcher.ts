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
  score?: number;
}

const MAX_RETRIES = 3;
const DRIVER_TIMEOUT_MS = 30000; // 30 seconds

export const matcher = {
  async findAndAssignDriver(ride: RideRequest): Promise<void> {
    console.log(`🔍 Buscando conductor para viaje ${ride.rideId}`);

    const triedDrivers: string[] = [];

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`🔄 Intento ${attempt}/${MAX_RETRIES}`);

      // Buscar conductores cercanos en Redis
      const nearbyDrivers = await redis.getNearbyDrivers(
        ride.pickup.lat,
        ride.pickup.lon,
        config.matching.maxRadiusKm
      );

      // Filtrar conductores ya intentados
      const availableDrivers = nearbyDrivers.filter(
        (d) => !triedDrivers.includes(d.id)
      );

      if (availableDrivers.length === 0) {
        console.log(`❌ No hay conductores disponibles para viaje ${ride.rideId}`);
        break;
      }

      console.log(`📍 Encontrados ${availableDrivers.length} conductores candidatos`);

      // Seleccionar el mejor conductor
      const bestDriver = this.selectBestDriver(availableDrivers);

      if (!bestDriver) {
        console.log(`❌ No se pudo seleccionar conductor`);
        continue;
      }

      triedDrivers.push(bestDriver.id);
      console.log(`✅ Conductor seleccionado: ${bestDriver.id} (${bestDriver.distance.toFixed(2)} km)`);

      // Intentar asignar con timeout
      const assigned = await this.tryAssignWithTimeout(ride, bestDriver);

      if (assigned) {
        console.log(`🎉 Viaje ${ride.rideId} asignado exitosamente`);
        return;
      }

      console.log(`⏰ Conductor ${bestDriver.id} no respondió, reintentando...`);
    }

    // Si llegamos aquí, no se pudo asignar
    console.log(`❌ No se pudo asignar conductor para viaje ${ride.rideId} tras ${MAX_RETRIES} intentos`);
    await this.notifyNoDriverAvailable(ride);
  },

  selectBestDriver(drivers: NearbyDriver[]): NearbyDriver | null {
    if (drivers.length === 0) return null;

    // Algoritmo de scoring mejorado
    const scoredDrivers = drivers.map((driver) => ({
      ...driver,
      score: this.calculateScore(driver),
    }));

    // Ordenar por puntuación (mayor a menor)
    scoredDrivers.sort((a, b) => (b.score || 0) - (a.score || 0));

    return scoredDrivers[0];
  },

  calculateScore(driver: NearbyDriver): number {
    // Score basado en distancia (peso 70%) y rating (peso 30%)
    const distanceScore = 1 / (driver.distance + 0.1);
    const ratingScore = 5; // Por defecto 5 estrellas
    return distanceScore * 0.7 + ratingScore * 0.3;
  },

  async tryAssignWithTimeout(ride: RideRequest, driver: NearbyDriver): Promise<boolean> {
    return new Promise(async (resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, DRIVER_TIMEOUT_MS);

      try {
        await this.assignDriver(ride, driver);
        clearTimeout(timeout);
        resolve(true);
      } catch (error) {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  },

  async assignDriver(ride: RideRequest, driver: NearbyDriver): Promise<void> {
    // Actualizar viaje en base de datos
    await db.updateRideStatus(ride.rideId, 'matched', driver.id);

    // Calcular tiempo estimado de llegada
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

  async handleDriverResponse(
    rideId: string,
    driverId: string,
    accepted: boolean
  ): Promise<void> {
    if (accepted) {
      console.log(`✅ Conductor ${driverId} aceptó viaje ${rideId}`);
      await db.updateRideStatus(rideId, 'accepted', driverId);

      await nats.publish('ride.accepted', {
        type: 'ride.accepted',
        rideId,
        driverId,
        timestamp: new Date(),
      });
    } else {
      console.log(`❌ Conductor ${driverId} rechazó viaje ${rideId}`);
      // Buscar otro conductor
      const ride = await db.getRideById(rideId);
      if (ride) {
        await this.findAndAssignDriver({
          rideId,
          passengerId: ride.passenger_id,
          pickup: { lat: ride.pickup_lat, lon: ride.pickup_lon },
          destination: { lat: ride.destination_lat, lon: ride.destination_lon },
        });
      }
    }
  },
};
