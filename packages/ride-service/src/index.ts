import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { rideRoutes } from './routes/rides';
import { config } from './config';
import { nats, redis, db } from '@cytaxi/shared';

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .group('/api/rides', (app) => app.use(rideRoutes))
  .get('/health', () => ({ status: 'ok', service: 'ride-service' }))
  .listen(config.port);

console.log(`🚀 Ride Service running on port ${config.port}`);
console.log(`📖 Swagger docs: http://localhost:${config.port}/swagger`);

// Conectar a servicios
async function init() {
  await nats.connect(config.nats.url);
  console.log('✅ NATS conectado');
}

init().catch(console.error);

// Manejar señales de terminación
process.on('SIGINT', async () => {
  console.log('\n🛑 Deteniendo Ride Service...');
  await nats.close();
  await redis.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Deteniendo Ride Service...');
  await nats.close();
  await redis.close();
  process.exit(0);
});
