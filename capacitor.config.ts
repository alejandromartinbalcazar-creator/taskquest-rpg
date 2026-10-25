import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.taskquest.rpg',
  appName: 'FocusMission',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
