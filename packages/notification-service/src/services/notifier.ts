import { nats, redis } from '@cytaxi/shared';

interface NotificationRequest {
  recipientId: string;
  recipientType: 'passenger' | 'driver' | 'admin';
  channel: 'whatsapp' | 'push' | 'sms';
  template: string;
  data: Record<string, unknown>;
}

const templates: Record<string, (data: Record<string, unknown>) => string> = {
  ride_offer: (data) =>
    `🚗 *Nuevo Viaje Disponible*\n\n` +
    `📍 Recogida: ${data.pickup?.lat?.toFixed(4)}, ${data.pickup?.lon?.toFixed(4)}\n` +
    `🎯 Destino: ${data.destination?.lat?.toFixed(4)}, ${data.destination?.lon?.toFixed(4)}\n` +
    `⏱️ Tiempo estimado: ${data.estimatedArrival} min\n\n` +
    `¿Aceptas este viaje? Responde "Sí" o "No"`,

  driver_assigned: (data) =>
    `✅ *Conductor Asignado*\n\n` +
    `👨‍✈️ Conductor: ${data.driverId}\n` +
    `📍 Ubicación: ${data.driverLocation?.lat?.toFixed(4)}, ${data.driverLocation?.lon?.toFixed(4)}\n` +
    `⏱️ Tiempo de llegada: ${data.estimatedArrival} min\n\n` +
    `El conductor está en camino.`,

  no_driver_available: () =>
    `❌ *Sin Conductores Disponibles*\n\n` +
    `Lo sentimos, no hay conductores disponibles en este momento.\n` +
    `Por favor, intenta de nuevo en unos minutos.`,

  ride_started: (data) =>
    `🛣️ *Viaje Iniciado*\n\n` +
    `Tu viaje ha comenzado.\n` +
    `Destino: ${data.destination?.lat?.toFixed(4)}, ${data.destination?.lon?.toFixed(4)}\n` +
    `Duración estimada: ${data.estimatedDuration} min`,

  ride_completed: (data) =>
    `🎉 *Viaje Completado*\n\n` +
    `Has llegado a tu destino.\n` +
    `💰 Tarifa: $${data.fare?.toFixed(2)}\n` +
    `📏 Distancia: ${data.distance?.toFixed(2)} km\n` +
    `⏱️ Duración: ${data.duration} min\n\n` +
    `¡Gracias por usar CYTAXI!`,

  ride_cancelled: (data) =>
    `❌ *Viaje Cancelado*\n\n` +
    `Tu viaje ha sido cancelado.\n` +
    `Razón: ${data.reason || 'No especificada'}\n\n` +
    `Si necesitas otro viaje, escribe "Taxi".`,
};

export const notifier = {
  async send(notification: NotificationRequest): Promise<void> {
    const { recipientId, recipientType, channel, template, data } = notification;

    console.log(`📤 Enviando notificación ${template} a ${recipientId} via ${channel}`);

    // Obtener template del mensaje
    const messageTemplate = templates[template];
    if (!messageTemplate) {
      console.error(`❌ Template no encontrado: ${template}`);
      return;
    }

    const message = messageTemplate(data);

    // Enviar según el canal
    switch (channel) {
      case 'whatsapp':
        await this.sendWhatsApp(recipientId, message);
        break;
      case 'push':
        await this.sendPush(recipientId, recipientType, message);
        break;
      case 'sms':
        await this.sendSMS(recipientId, message);
        break;
      default:
        console.error(`❌ Canal no soportado: ${channel}`);
    }

    // Registrar notificación en caché
    await this.logNotification(notification);
  },

  async sendWhatsApp(recipientId: string, message: string): Promise<void> {
    // Aquí se integraría con el bot de WhatsApp
    // Por ahora, solo registramos
    console.log(`📱 WhatsApp a ${recipientId}: ${message.substring(0, 50)}...`);

    // Enviar evento al bot de WhatsApp para que envíe el mensaje
    await nats.publish('whatsapp.send', {
      to: recipientId,
      message,
      timestamp: new Date(),
    });
  },

  async sendPush(
    recipientId: string,
    recipientType: string,
    message: string
  ): Promise<void> {
    // Aquí se integraría con Firebase Cloud Messaging
    console.log(`🔔 Push a ${recipientId}: ${message.substring(0, 50)}...`);

    // TODO: Implementar Firebase Admin SDK
    // const admin = require('firebase-admin');
    // await admin.messaging().send({ token: recipientId, notification: { body: message } });
  },

  async sendSMS(recipientId: string, message: string): Promise<void> {
    // Aquí se integraría con un proveedor de SMS
    console.log(`💬 SMS a ${recipientId}: ${message.substring(0, 50)}...`);
  },

  async logNotification(notification: NotificationRequest): Promise<void> {
    const key = `notifications:${notification.recipientId}`;
    await redis.set(key, notification, 86400); // 24 horas
  },
};
