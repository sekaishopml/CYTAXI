import { bot } from './whatsapp/connection';
import { nats, redis, db } from '@cytaxi/shared';
import { config } from './config';

async function main() {
  console.log('🚀 Iniciando Bot de WhatsApp...');

  try {
    // Conectar a servicios
    await nats.connect(config.nats.url);
    console.log('✅ NATS conectado');

    // Iniciar bot de WhatsApp
    await bot.start();
    console.log('✅ Bot de WhatsApp iniciado');

    console.log(`\n🤖 CYTAXI Bot está listo y escuchando mensajes`);
    console.log(`📱 Número: ${config.whatsapp.phoneNumber}`);
    console.log(`📛 Nombre: ${config.whatsapp.botName}`);
  } catch (error) {
    console.error('❌ Error al iniciar el bot:', error);
    process.exit(1);
  }
}

// Manejar señales de terminación
process.on('SIGINT', async () => {
  console.log('\n🛑 Deteniendo bot...');
  await bot.disconnect();
  await nats.close();
  await redis.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Deteniendo bot...');
  await bot.disconnect();
  await nats.close();
  await redis.close();
  process.exit(0);
});

main();
