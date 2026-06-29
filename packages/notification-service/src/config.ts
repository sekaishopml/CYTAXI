export const config = {
  port: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '3005'),
  nats: {
    url: process.env.NATS_URL || 'nats://localhost:4222',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  },
};
