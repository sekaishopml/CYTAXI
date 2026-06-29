import { Elysia } from 'elysia';
import { staticPlugin } from '@elysiajs/static';
import { join } from 'path';

const app = new Elysia()
  .use(
    staticPlugin({
      assets: join(import.meta.dir, '.'),
      prefix: '/',
    })
  )
  .get('/', async () => {
    const file = Bun.file(join(import.meta.dir, 'index.html'));
    return new Response(file);
  })
  .listen(3008);

console.log(`🚀 PWA Ubicación running on port 3008`);
console.log(`📱 Access at http://localhost:3008`);

process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo PWA Ubicación...');
  process.exit(0);
});
