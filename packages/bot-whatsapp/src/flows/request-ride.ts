import { nats, redis, db } from '@cytaxi/shared';
import { generateId } from '@cytaxi/shared';
import { sendWhatsAppMessage } from '../whatsapp/handlers';

export const requestRideFlow = {
  async initiate(sender: string): Promise<void> {
    await redis.set(`flow:${sender}`, 'requesting_ride');
    await sendWhatsAppMessage(
      sender,
      '🚗 *Solicitar Viaje*\n\n📍 Por favor, envía tu ubicación de recogida.\n\nPuedes usar:\n• Botón de ubicación de WhatsApp\n• Escribir tu dirección (ej: "Av. Amazonas y Naciones Unidas")'
    );
  },

  async start(
    sender: string,
    pickupLat: number,
    pickupLon: number
  ): Promise<void> {
    // Guardar ubicación de recogida
    await redis.set(`ride:${sender}:pickup`, {
      lat: pickupLat,
      lon: pickupLon,
    });

    await redis.set(`flow:${sender}`, 'selecting_destination');

    await sendWhatsAppMessage(
      sender,
      `📍 *Ubicación de recogida guardada*\n\nCoordenadas: ${pickupLat.toFixed(4)}, ${pickupLon.toFixed(4)}\n\n🎯 Ahora envía tu destino (ubicación o dirección).`
    );
  },

  async handlePickupLocation(
    sender: string,
    pickupLat: number,
    pickupLon: number
  ): Promise<void> {
    await this.start(sender, pickupLat, pickupLon);
  },

  async handlePickupAddress(sender: string, address: string): Promise<void> {
    // Geocodificar dirección usando el servicio
    const response = await fetch(
      `http://localhost:${process.env.GEOCODER_SERVICE_PORT || 3006}/geocode?address=${encodeURIComponent(address)}`
    );

    if (response.ok) {
      const data = await response.json();
      await redis.set(`ride:${sender}:pickup`, {
        lat: data.lat,
        lon: data.lon,
      });

      await redis.set(`flow:${sender}`, 'selecting_destination');

      await sendWhatsAppMessage(
        sender,
        `📍 *Ubicación confirmada*\n\n${address}\n\n🎯 Ahora envía tu destino (ubicación o dirección).`
      );
    } else {
      await sendWhatsAppMessage(
        sender,
        '❌ No pude encontrar esa dirección. Por favor, intenta con otra o envía tu ubicación exacta.'
      );
    }
  },

  async handleDestination(sender: string, destination: string): Promise<void> {
    // Verificar si es coordenadas o dirección
    const pickupData = await redis.get<{ lat: number; lon: number }>(
      `ride:${sender}:pickup`
    );

    if (!pickupData) {
      await sendWhatsAppMessage(
        sender,
        '❌ Error: No se encontró la ubicación de recogida. Por favor, inicia de nuevo con "Taxi".'
      );
      return;
    }

    // Crear viaje en la base de datos
    const rideId = generateId();
    const ride = await db.createRide({
      id: rideId,
      passengerId: sender,
      pickupLat: pickupData.lat,
      pickupLon: pickupData.lon,
      destinationLat: 0, // TODO: geocodificar destino
      destinationLon: 0,
    });

    // Publicar evento de viaje solicitado
    await nats.publish('ride.requested', {
      type: 'ride.requested',
      rideId,
      passengerId: sender,
      pickup: pickupData,
      destination: { lat: 0, lon: 0 }, // TODO
      timestamp: new Date(),
    });

    // Guardar viaje activo
    await redis.set(`active_ride:${sender}`, rideId);
    await redis.del(`flow:${sender}`);
    await redis.del(`ride:${sender}:pickup`);

    await sendWhatsAppMessage(
      sender,
      `✅ *Viaje Solicitado*\n\nID: ${rideId}\n📍 Recogida: ${pickupData.lat.toFixed(4)}, ${pickupData.lon.toFixed(4)}\n\n🔍 Buscando conductor disponible...\nTe notificaremos cuando sea asignado.`
    );
  },
};
