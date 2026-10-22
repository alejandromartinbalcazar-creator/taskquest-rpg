// haptics.ts — Servicio Háptico Seguro con Soporte para Capacitor y Web Vibration API

export type HapticStrength = 'light' | 'medium' | 'heavy' | 'selection';

class HapticsService {
  private hasVibrate: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      this.hasVibrate = true;
    }
  }

  /**
   * Ejecuta una pulsación háptica ligera (Toque de esfera elemental o UI)
   */
  public light(): void {
    this.vibrate(12);
  }

  /**
   * Ejecuta una pulsación háptica media (Liberación de habilidad cargada, dash o impacto recibido)
   */
  public medium(): void {
    this.vibrate(32);
  }

  /**
   * Ejecuta una pulsación háptica pesada (Cataclismo, explosión AoE mayor o derrota)
   */
  public heavy(): void {
    this.vibrate([45, 30, 60]);
  }

  /**
   * Pulsación sutil de selección o paso por esfera en barrido
   */
  public selection(): void {
    this.vibrate(8);
  }

  private vibrate(pattern: number | number[]): void {
    try {
      // 1. Comprobar si existe Capacitor Haptics nativo en el entorno
      const win = typeof window !== 'undefined' ? (window as unknown as { Capacitor?: { Plugins?: { Haptics?: { impact?: (opts: { style: string }) => Promise<void>; selectionStart?: () => Promise<void> } } } }) : null;
      if (win?.Capacitor?.Plugins?.Haptics) {
        const haptics = win.Capacitor.Plugins.Haptics;
        if (typeof pattern === 'number' && pattern <= 12) {
          haptics.impact?.({ style: 'LIGHT' }).catch(() => {});
          return;
        } else if (typeof pattern === 'number' && pattern <= 35) {
          haptics.impact?.({ style: 'MEDIUM' }).catch(() => {});
          return;
        } else {
          haptics.impact?.({ style: 'HEAVY' }).catch(() => {});
          return;
        }
      }

      // 2. Fallback a la API estándar de vibración del navegador
      if (this.hasVibrate && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Fallback silencioso si el dispositivo o navegador bloquea la vibración
    }
  }
}

export const haptics = new HapticsService();
