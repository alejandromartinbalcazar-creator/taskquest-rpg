// Retro Synthesized Audio using Web Audio API (Zero-weight, 100% offline)

class SoundService {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  // Sonido cuando completas un micro-paso (Ding brillante)
  public playMicroStepDing() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15); // C6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Sonido cuando completas una tarea (Fanfarria corta)
  public playTaskComplete() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }

  // Sonido de castigo: El héroe sufre daño por procrastinación (Golpe sordo / alarma)
  public playProcrastinationDamage() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Sonido de fusión de hechizos (Efecto místico de alquimia)
  public playSpellFusion() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(300, now);
    osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.4);

    osc2.frequency.setValueAtTime(450, now);
    osc2.frequency.exponentialRampToValueAtTime(1800, now + 0.4);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  }

  // Ataque en combate de mazmorra
  public playAttackSound(isCritical: boolean = false) {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isCritical ? 'square' : 'sawtooth';
    osc.frequency.setValueAtTime(isCritical ? 700 : 400, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + (isCritical ? 0.3 : 0.15));

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + (isCritical ? 0.3 : 0.15));

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + (isCritical ? 0.3 : 0.15));
  }

  // Subida de nivel (Fanfarria épica)
  public playLevelUp() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [392, 523.25, 659.25, 783.99, 1046.5]; // G4, C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.1;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + (idx === notes.length - 1 ? 0.6 : 0.2));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + (idx === notes.length - 1 ? 0.6 : 0.2));
    });
  }

  // Sonido de Deleveling / Fallo Crítico (Crujido de ruptura + tono descendente fúnebre)
  public playDelevelCrackSound() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Crujido de rotura de nivel (Sawtooth con filtro paso banda distorsionado)
    const crack = this.ctx.createOscillator();
    const crackGain = this.ctx.createGain();
    crack.type = 'sawtooth';
    crack.frequency.setValueAtTime(800, now);
    crack.frequency.exponentialRampToValueAtTime(110, now + 0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + 0.3);

    crackGain.gain.setValueAtTime(0.5, now);
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    crack.connect(filter);
    filter.connect(crackGain);
    crackGain.connect(this.ctx.destination);
    crack.start(now);
    crack.stop(now + 0.35);

    // 2. Tono descendente fúnebre (Sub-bajo de pérdida)
    const doom = this.ctx.createOscillator();
    const doomGain = this.ctx.createGain();
    doom.type = 'triangle';
    doom.frequency.setValueAtTime(180, now + 0.05);
    doom.frequency.exponentialRampToValueAtTime(32, now + 0.8);

    doomGain.gain.setValueAtTime(0.65, now + 0.05);
    doomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    doom.connect(doomGain);
    doomGain.connect(this.ctx.destination);
    doom.start(now + 0.05);
    doom.stop(now + 0.85);
  }

  // Sonido de Deuda de Honor Saldada (Redención)
  public playHonorRedeemedSound() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.linearRampToValueAtTime(freq * 1.02, startTime + 0.3);

      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  // Sonido de Desbloqueo de Hito del Héroe
  public playMilestoneUnlock() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const chords = [392.0, 493.88, 587.33, 783.99]; // G4, B4, D5, G5 (Tríada dorada)
    chords.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  }

  // Sonido de Latido de Urgencia (Peligro de vencimiento próximo)
  public playUrgencyWarning() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [0, 0.18].forEach((offset) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(85, now + offset);
      osc.frequency.exponentialRampToValueAtTime(35, now + offset + 0.14);

      gain.gain.setValueAtTime(0.3, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.14);
    });
  }
}

export const sound = new SoundService();
