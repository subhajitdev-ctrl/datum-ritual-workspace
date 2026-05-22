import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.datum.app',
  appName: 'DATUM',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
