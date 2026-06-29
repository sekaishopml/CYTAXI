import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { matcher } from './services/matcher';
import { config } from './config';
import { nats, redis } from '@cytaxi/shared';

const app = new Elysia()
  .use(cors())
  .get('/health', () => ({ status: 'ok', service: 'matching-engine' }))
  .listen(config.port);

console.log(`🚀 Matching Engine running on port ${config.port}`);

// Conectar a servicios y escuchar eventos
async function init() {
  await nats.connect(config.nats.url);
  console.log('✅ NATS conectado');

  // Escuchar eventos de viajes solicitados
  await nats.subscribe('ride.requested', async (data: any) => {
    console.log('📩 Ride requested:', data.rideId);
    await matcher.findAndAssignDriver(data);
  });

  console.log('👂 Escuchando eventos de viajes...');
}

init().catch(console.error);

// Manejar señales de terminación
process.on('SIGINT', async () => {
  console.log('\n🛑 Deteniendo Matching Engine...');
  await nats.close();
  await redis.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Deteniendo Matching Engine...');
  await nats.close();
  await redis.close();
  process.exit(0);
});
