import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { notifier } from './services/notifier';
import { config } from './config';
import { nats, redis } from '@cytaxi/shared';

const app = new Elysia()
  .use(cors())
  .get('/health', () => ({ status: 'ok', service: 'notification-service' }))
  .listen(config.port);

console.log(`🚀 Notification Service running on port ${config.port}`);

// Conectar a servicios y escuchar eventos
async function init() {
  await nats.connect(config.nats.url);
  console.log('✅ NATS conectado');

  // Escuchar eventos de notificaciones
  await nats.subscribe('notification.send', async (data: any) => {
    console.log('📩 Notification request:', data.template);
    await notifier.send(data);
  });

  console.log('👂 Escuchando eventos de notificaciones...');
}

init().catch(console.error);

// Manejar señales de terminación
process.on('SIGINT', async () => {
  console.log('\n🛑 Deteniendo Notification Service...');
  await nats.close();
  await redis.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Deteniendo Notification Service...');
  await nats.close();
  await redis.close();
  process.exit(0);
});
