import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cytaxi.driver',
  appName: 'CYTAXI Driver',
  webDir: 'build',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Geolocation: {
      backgroundEnable: true,
      backgroundTimeout: 10000,
    },
  },
};

export default config;
