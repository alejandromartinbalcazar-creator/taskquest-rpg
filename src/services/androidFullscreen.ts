import { Capacitor, registerPlugin } from '@capacitor/core';

interface FullscreenPlugin { setImmersive(options: { enabled: boolean }): Promise<void>; }
const Fullscreen = registerPlugin<FullscreenPlugin>('Fullscreen');

export async function setDungeonFullscreen(enabled: boolean): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await Fullscreen.setImmersive({ enabled }).catch(() => undefined);
}
