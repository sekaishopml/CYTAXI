export const config = {
  port: parseInt(process.env.MATCHING_SERVICE_PORT || '3004'),
  nats: {
    url: process.env.NATS_URL || 'nats://localhost:4222',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  matching: {
    maxRadiusKm: 10,
    maxDriversToNotify: 5,
    driverTimeoutSeconds: 30,
  },
};
