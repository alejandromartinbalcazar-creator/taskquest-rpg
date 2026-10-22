// Retro Synthesized Audio using Web Audio API (Zero-weight, 100% offline)
// Connected directly to the centralized AudioManager singleton

import { audioManager } from './AudioManager';

class SoundService {
  public setSoundEnabled(enabled: boolean) {
    audioManager.setMuted(!enabled);
  }

  public isEnabled(): boolean {
    return !audioManager.isMuted();
  }

  // Sonido cuando completas un micro-paso (Ding brillante)
  public playMicroStepDing() {
    audioManager.playMicroStepDing();
  }

  // Sonido cuando completas una tarea (Arpegio ascendente brillante C5-E5-G5-C6)
  public playTaskComplete() {
    audioManager.playTaskComplete();
  }

  // Sonido de castigo: El héroe sufre daño por procrastinación (Golpe sordo / alarma)
  public playProcrastinationDamage() {
    audioManager.playPlayerHurt();
  }

  // Sonido de fusión de hechizos (Efecto místico de alquimia)
  public playSpellFusion() {
    if (!this.isEnabled()) return;
    const ctx = audioManager.getContext();
    const dest = audioManager.getSfxDestination();
    if (!ctx || !dest) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(300, now);
    osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.4);

    osc2.frequency.setValueAtTime(450, now);
    osc2.frequency.exponentialRampToValueAtTime(1800, now + 0.4);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(dest);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);

    setTimeout(() => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        gain.disconnect();
      } catch {
        // Safe disconnection
      }
    }, 550);
  }

  // Ataque en combate de mazmorra
  public playAttackSound(isCritical: boolean = false) {
    if (!this.isEnabled()) return;
    const ctx = audioManager.getContext();
    const dest = audioManager.getSfxDestination();
    if (!ctx || !dest) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isCritical ? 'square' : 'sawtooth';
    osc.frequency.setValueAtTime(isCritical ? 700 : 400, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + (isCritical ? 0.3 : 0.15));

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isCritical ? 0.3 : 0.15));

    osc.connect(gain);
    gain.connect(dest);

    const dur = isCritical ? 0.3 : 0.15;
    osc.start(now);
    osc.stop(now + dur);

    setTimeout(() => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        // Safe disconnection
      }
    }, Math.floor((dur + 0.1) * 1000));
  }

  // Subida de nivel (Fanfarria triunfal ceremonial con acordes mayores en varias voces)
  public playLevelUp() {
    audioManager.playLevelUp();
  }

  // Sonido de Deleveling / Fallo Crítico (Crujido de ruptura + tono descendente fúnebre)
  public playDelevelCrackSound() {
    audioManager.playDelevelCrackSound();
  }

  // Sonido de Deuda de Honor Saldada (Redención)
  public playHonorRedeemedSound() {
    if (!this.isEnabled()) return;
    const ctx = audioManager.getContext();
    const dest = audioManager.getSfxDestination();
    if (!ctx || !dest) return;

    const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, idx) => {
      if (!ctx || !dest) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.linearRampToValueAtTime(freq * 1.02, startTime + 0.3);

      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(startTime);
      osc.stop(startTime + 0.35);

      setTimeout(() => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Safe cleanup
        }
      }, Math.floor((idx * 0.12 + 0.45) * 1000));
    });
  }

  // Sonido de Desbloqueo de Hito del Héroe
  public playMilestoneUnlock() {
    audioManager.playMilestoneUnlock();
  }

  // Sonido de Latido de Urgencia (Peligro de vencimiento próximo)
  public playUrgencyWarning() {
    if (!this.isEnabled()) return;
    const ctx = audioManager.getContext();
    const dest = audioManager.getSfxDestination();
    if (!ctx || !dest) return;

    const now = ctx.currentTime;
    [0, 0.18].forEach((offset) => {
      if (!ctx || !dest) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(85, now + offset);
      osc.frequency.exponentialRampToValueAtTime(35, now + offset + 0.14);

      gain.gain.setValueAtTime(0.3, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now + offset);
      osc.stop(now + offset + 0.14);

      setTimeout(() => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Safe cleanup
        }
      }, Math.floor((offset + 0.25) * 1000));
    });
  }
}

export const sound = new SoundService();
