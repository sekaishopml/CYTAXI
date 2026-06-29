export const config = {
  port: parseInt(process.env.BOT_SERVICE_PORT || '3001'),
  whatsapp: {
    phoneNumber: process.env.WHATSAPP_PHONE_NUMBER || '+593990000000',
    botName: process.env.WHATSAPP_BOT_NAME || 'CYTAXI Bot',
  },
  nats: {
    url: process.env.NATS_URL || 'nats://localhost:4222',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  postgres: {
    url: process.env.DATABASE_URL || 'postgresql://cytaxi:cytaxi_secret@localhost:5432/cytaxi',
  },
};
