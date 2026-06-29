export const config = {
  port: parseInt(process.env.RIDE_SERVICE_PORT || '3002'),
  nats: {
    url: process.env.NATS_URL || 'nats://localhost:4223',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6380',
  },
  postgres: {
    url: process.env.DATABASE_URL || 'postgresql://cytaxi:cytaxi_secret@localhost:5433/cytaxi',
  },
};
