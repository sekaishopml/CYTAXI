import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { driverRoutes } from './routes/drivers';
import { config } from './config';
import { nats, redis, db } from '@cytaxi/shared';

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .group('/api/drivers', (app) => app.use(driverRoutes))
  .get('/health', () => ({ status: 'ok', service: 'driver-service' }))
  .listen(config.port);

console.log(`🚀 Driver Service running on port ${config.port}`);
console.log(`📖 Swagger docs: http://localhost:${config.port}/swagger`);

// Conectar a servicios
async function init() {
  await nats.connect(config.nats.url);
  console.log('✅ NATS conectado');
}

init().catch(console.error);

// Manejar señales de terminación
process.on('SIGINT', async () => {
  console.log('\n🛑 Deteniendo Driver Service...');
  await nats.close();
  await redis.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Deteniendo Driver Service...');
  await nats.close();
  await redis.close();
  process.exit(0);
});
