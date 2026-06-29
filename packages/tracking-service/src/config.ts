export const config = {
  port: parseInt(process.env.TRACKING_PORT || '3007'),
  nats: {
    url: process.env.NATS_URL || 'nats://localhost:4223',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6380',
  },
  tracking: {
    locationTTL: 300, // 5 minutes
    updateInterval: 5, // 5 seconds
  },
};
