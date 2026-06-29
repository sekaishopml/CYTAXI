import { WASocket, proto } from '@whiskeysockets/baileys';
import { nats, redis, db } from '@cytaxi/shared';
import { generateId } from '@cytaxi/shared';
import { requestRideFlow } from '../flows/request-ride';

interface MessageContext {
  sock: WASocket;
  message: proto.IWebMessageInfo;
  sender: string;
  text?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  isGroup: boolean;
}

export async function handleMessage(
  sock: WASocket,
  message: proto.IWebMessageInfo
): Promise<void> {
  const ctx = parseMessage(message);
  if (!ctx) return;

  console.log(`📩 Mensaje de ${ctx.sender}: ${ctx.text || 'ubicación'}`);

  // Handle location messages
  if (ctx.location) {
    await handleLocationMessage(ctx);
    return;
  }

  // Handle text messages
  if (ctx.text) {
    await handleTextMessage(ctx);
  }
}

function parseMessage(message: proto.IWebMessageInfo): MessageContext | null {
  const key = message.key;
  if (!key.remoteJid) return null;

  const sender = key.remoteJid;
  const isGroup = sender.endsWith('@g.us');

  if (isGroup) return null; // Ignorar mensajes de grupo

  let text: string | undefined;
  let location: { latitude: number; longitude: number } | undefined;

  const msg = message.message;
  if (msg) {
    if (msg.conversation) {
      text = msg.conversation;
    } else if (msg.extendedTextMessage?.text) {
      text = msg.extendedTextMessage.text;
    } else if (msg.locationMessage) {
      location = {
        latitude: msg.locationMessage.latitudeDegree || 0,
        longitude: msg.locationMessage.longitudeDegree || 0,
      };
    }
  }

  return {
    sock: null as unknown as WASocket,
    message,
    sender,
    text: text?.trim().toLowerCase(),
    location,
    isGroup,
  };
}

async function handleLocationMessage(ctx: MessageContext): Promise<void> {
  if (!ctx.location) return;

  const { latitude, longitude } = ctx.location;

  // Verificar si hay un flujo activo para este usuario
  const activeFlow = await redis.get<string>(`flow:${ctx.sender}`);

  if (activeFlow === 'requesting_ride') {
    // El pasajero está enviando ubicación de recogida
    await requestRideFlow.handlePickupLocation(ctx.sender, latitude, longitude);
  } else {
    // Primera ubicación - iniciar flujo de solicitud
    await requestRideFlow.start(ctx.sender, latitude, longitude);
  }
}

async function handleTextMessage(ctx: MessageContext): Promise<void> {
  const text = ctx.text || '';

  // Comandos principales
  if (text === 'taxi' || text === 'viaje' || text === 'ride') {
    await requestRideFlow.initiate(ctx.sender);
    return;
  }

  if (text === 'cancelar' || text === 'cancel') {
    await handleCancelRequest(ctx.sender);
    return;
  }

  if (text === 'ayuda' || text === 'help') {
    await sendHelpMessage(ctx.sender);
    return;
  }

  if (text === 'estado' || text === 'status') {
    await handleStatusRequest(ctx.sender);
    return;
  }

  // Verificar si hay un flujo activo
  const activeFlow = await redis.get<string>(`flow:${ctx.sender}`);

  if (activeFlow === 'requesting_ride') {
    // El pasajero está enviando dirección como texto
    await requestRideFlow.handlePickupAddress(ctx.sender, ctx.text || '');
  } else if (activeFlow === 'selecting_destination') {
    await requestRideFlow.handleDestination(ctx.sender, ctx.text || '');
  } else {
    // Mensaje no reconocido
    await sendUnknownCommand(ctx.sender);
  }
}

async function handleCancelRequest(sender: string): Promise<void> {
  const activeRide = await redis.get<string>(`active_ride:${sender}`);

  if (activeRide) {
    // Cancelar viaje activo
    await nats.publish('ride.cancelled', {
      rideId: activeRide,
      cancelledBy: 'passenger',
      timestamp: new Date(),
    });

    await redis.del(`active_ride:${sender}`);
    await redis.del(`flow:${sender}`);

    await sendWhatsAppMessage(
      sender,
      '❌ Viaje cancelado. Si necesitas otro viaje, escribe "Taxi".'
    );
  } else {
    await sendWhatsAppMessage(sender, 'No tienes un viaje activo para cancelar.');
  }
}

async function handleStatusRequest(sender: string): Promise<void> {
  const activeRideId = await redis.get<string>(`active_ride:${sender}`);

  if (activeRideId) {
    const ride = await db.getRideById(activeRideId);
    if (ride) {
      const statusMessages: Record<string, string> = {
        matched: '🚗 Buscando conductor...',
        accepted: '✅ Conductor en camino',
        arriving: '📍 Conductor llegando...',
        in_progress: '🛣️ En trayecto al destino',
      };

      await sendWhatsAppMessage(
        sender,
        `${statusMessages[ride.status] || 'Estado: ' + ride.status}\nID: ${ride.id}`
      );
    }
  } else {
    await sendWhatsAppMessage(sender, 'No tienes un viaje activo.');
  }
}

async function sendHelpMessage(sender: string): Promise<void> {
  const help = `🚗 *CYTAXI - Servicio de Transporte*

📝 *Comandos disponibles:*
• *Taxi* - Solicitar un viaje
• *Estado* - Ver estado de tu viaje
• *Cancelar* - Cancelar viaje activo
• *Ayuda* - Mostrar este mensaje

📍 *Cómo solicitar un viaje:*
1. Escribe "Taxi"
2. Envía tu ubicación de recogida
3. Indica tu destino
4. ¡Listo! Un conductor será asignado

💡 *Tip:* Puedes enviar tu ubicación directamente desde WhatsApp para iniciar rápido.`;

  await sendWhatsAppMessage(sender, help);
}

async function sendUnknownCommand(sender: string): Promise<void> {
  await sendWhatsAppMessage(
    sender,
    '🤔 No entendí tu mensaje. Escribe "Ayuda" para ver los comandos disponibles.'
  );
}

export async function sendWhatsAppMessage(
  recipient: string,
  message: string
): Promise<void> {
  // Esto será implementado por el bot de WhatsApp
  console.log(`📤 Enviando mensaje a ${recipient}: ${message}`);
}
