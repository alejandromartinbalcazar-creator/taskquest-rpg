import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.taskquest.rpg',
  appName: 'TaskQuest RPG',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
