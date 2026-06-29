import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { geocoder } from './services/geocoder';
import { config } from './config';
import { redis } from '@cytaxi/shared';

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .get('/health', () => ({ status: 'ok', service: 'geocoder-service' }))
  .get(
    '/geocode',
    async ({ query }) => {
      const { address } = query;

      if (!address) {
        return { success: false, message: 'Dirección requerida' };
      }

      const result = await geocoder.geocode(address);

      if (!result) {
        return { success: false, message: 'No se pudo geocodificar la dirección' };
      }

      return { success: true, ...result };
    },
    {
      query: { address: 'string' },
      detail: {
        summary: 'Geocodificar una dirección',
        tags: ['Geocoder'],
      },
    }
  )
  .get(
    '/reverse',
    async ({ query }) => {
      const { lat, lon } = query;

      if (!lat || !lon) {
        return { success: false, message: 'Coordenadas requeridas' };
      }

      const result = await geocoder.reverseGeocode(parseFloat(lat), parseFloat(lon));

      if (!result) {
        return { success: false, message: 'No se pudo.reverse geocodificar las coordenadas' };
      }

      return { success: true, ...result };
    },
    {
      query: { lat: 'string', lon: 'string' },
      detail: {
        summary: 'Reverse geocoding (coordenadas a dirección)',
        tags: ['Geocoder'],
      },
    }
  )
  .listen(config.port);

console.log(`🚀 Geocoder Service running on port ${config.port}`);
console.log(`📖 Swagger docs: http://localhost:${config.port}/swagger`);

// Manejar señales de terminación
process.on('SIGINT', async () => {
  console.log('\n🛑 Deteniendo Geocoder Service...');
  await redis.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Deteniendo Geocoder Service...');
  await redis.close();
  process.exit(0);
});
