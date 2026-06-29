export const config = {
  port: parseInt(process.env.GEOCODER_SERVICE_PORT || '3006'),
  nominatim: {
    baseUrl: process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org',
    userAgent: process.env.NOMINATIM_USER_AGENT || 'CYTAXI/1.0',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
};
