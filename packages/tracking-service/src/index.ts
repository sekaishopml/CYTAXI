import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { trackingRoutes } from './routes/tracking';
import { config } from './config';
import { nats, redis } from '@cytaxi/shared';

const app = new Elysia()
  .use(cors())
  .use(trackingRoutes)
  .get('/health', () => ({ status: 'ok', service: 'tracking-service' }))
  .listen(config.port);

console.log(`🚀 Tracking Service running on port ${config.port}`);

// Conectar a servicios
async function init() {
  await nats.connect(config.nats.url);
  console.log('✅ NATS conectado');

  // Escuchar eventos de viaje completado para limpiar tracking
  await nats.subscribe('ride.completed', async (data: any) => {
    console.log(`🧹 Limpiando tracking para viaje completado: ${data.rideId}`);
    const pattern = `tracking:${data.rideId}:*`;
    const keys = await redis.keys(pattern);
    for (const key of keys) {
      await redis.del(key);
    }
  });

  console.log('👂 Tracking Service escuchando eventos...');
}

init().catch(console.error);

// Manejar señales de terminación
process.on('SIGINT', async () => {
  console.log('\n🛑 Deteniendo Tracking Service...');
  await nats.close();
  await redis.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Deteniendo Tracking Service...');
  await nats.close();
  await redis.close();
  process.exit(0);
});
