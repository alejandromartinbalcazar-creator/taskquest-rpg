import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.taskquest.rpg',
  appName: 'FocusMission',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    LocalNotifications: { smallIcon: 'ic_stat_reminder', iconColor: '#9f7aea' },
  },
};

export default config;
