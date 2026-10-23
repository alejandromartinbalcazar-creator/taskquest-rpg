// Sintetizador Web Audio API Procedural de Alta Fidelidad para Magia Elemental
import { audioManager } from '../../services/AudioManager';

class ElementalSoundEngine {
  private ctx: AudioContext | null = null;

  public get isMuted(): boolean {
    return audioManager.isMuted();
  }

  public set isMuted(val: boolean) {
    audioManager.setMuted(val);
  }

  private initCtx() {
    this.ctx = audioManager.getContext();
  }

  private get dest(): AudioNode {
    return audioManager.getSfxDestination() || (this.ctx ? this.dest : audioManager.ensureContext()!.destination);
  }

  public setMuted(muted: boolean) {
    audioManager.setMuted(muted);
  }

  // Toque tÃ¡ctil al seleccionar un elemento
  public playElementSelect(element: 'fire' | 'lightning' | 'ice' | 'earth') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    const freqs: Record<string, number> = {
      fire: 240,
      lightning: 580,
      ice: 820,
      earth: 160,
    };

    osc.type = element === 'lightning' ? 'sawtooth' : element === 'ice' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freqs[element] || 440, now);
    osc.frequency.exponentialRampToValueAtTime((freqs[element] || 440) * 1.3, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Hechizo BÃ¡sico / Chispa
  public playBasicSpark() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Fuego Puro / Proyectil Ãgneo (ModulaciÃ³n por filtro pasabanda + sub-bajo senoidal)
  public playFireShot() {
    audioManager.playFireShot();
  }

  // Rayo Puro / Descarga Voltaica (Diente de sierra FM rÃ¡pida + crackle)
  public playLightningBolt() {
    audioManager.playLightningBolt();
  }

  // Hielo Puro / Fragmento Glacial (InarmÃ³nicos senoidales cristalinos)
  public playIceShard() {
    audioManager.playIceShard();
  }

  // Tierra Pura / PeÃ±asco (Sub-grave triangular + ruido sÃ­smico filtrado)
  public playEarthToss() {
    audioManager.playEarthToss();
  }

  // 1. Choque TÃ©rmico (ExplosiÃ³n + Siseo de Vapor)
  public playThermalShock() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Golpe sÃ³nico grave
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.3);

    // Siseo de vapor a alta frecuencia
    const steam = this.ctx.createOscillator();
    const steamGain = this.ctx.createGain();
    steam.type = 'sine';
    steam.frequency.setValueAtTime(1200, now + 0.05);
    steam.frequency.linearRampToValueAtTime(1800, now + 0.28);
    steamGain.gain.setValueAtTime(0.12, now + 0.05);
    steamGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    steam.connect(steamGain);
    steamGain.connect(this.dest);
    steam.start(now + 0.05);
    steam.stop(now + 0.35);
  }

  // 2. ErupciÃ³n de Magma (Fisura SubterrÃ¡nea)
  public playMagmaEruption() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // 3. Campo de Cristales Energizados (Resonancia ElÃ©ctrica)
  public playCrystalField() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [520, 650, 780].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      osc.frequency.linearRampToValueAtTime(freq * 1.2, now + 0.25);

      gain.gain.setValueAtTime(0.1, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + 0.3);
    });
  }

  // 4. Tormenta CriogÃ©nica
  public playCryoStorm() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.linearRampToValueAtTime(440, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.35);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  // 5. PrisiÃ³n de Permafrost
  public playPermafrostPrison() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.3);

    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  // 6. Tornado de Plasma (Lanzamiento)
  public playExplosiveOverload() {
    this.playPlasmaTornadoLaunch(false);
  }

  // CATACLISMO ELEMENTAL (Supremo)
  public playCataclysm() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // RÃ¡faga armÃ³nica descendente
    [120, 240, 360, 480].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.8, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.7);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now);
      osc.stop(now + 0.75);
    });
  }

  // DaÃ±o al enemigo
  public playEnemyHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // DaÃ±o al jugador (Thud sordo y contundente con caÃ­da de tono)
  public playPlayerHurt() {
    audioManager.playPlayerHurt();
  }

  // Victoria
  public playVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.2, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.28);
    });
  }

  // Desbloqueo de Puerta / Sala Despejada
  public playDoorOpen() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [330, 440, 660].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.15, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.25);
    });
  }

  // Apertura de Cofre de Reliquias
  public playRelicChestOpen() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523, 659, 784, 1046].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.2, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.35);
    });
  }

  // Rugido / Entrada de Jefe
  public playBossIntro() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.25);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.8);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.85);
  }

  // Choque de Basalto contra Pilar
  public playBasaltCrash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.45);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Ruptura de Permafrost (Fragmentos de Hielo y Roca - DelegaciÃ³n)
  public playLegacyPermafrostShatter() {
    this.playPermafrostShatter(false);
  }

  // Aliento de Fuego del DragÃ³n
  public playDragonBreath() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(130, now + 0.6);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.65);
  }

  // Esquiva RÃ¡pida (Dash / Glide)
  public playDash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Sonido sutil de enfriamiento activo (cooldown tick)
  public playCooldownWarning() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Inicio de Carga de Hechizo (Hold continuo con aceleraciÃ³n de LFO)
  public playChargeStart() {
    audioManager.startCharge();
  }

  // Hechizo Totalmente Cargado (Destello acÃºstico de liberaciÃ³n / flash)
  public playChargeReady() {
    audioManager.playChargeRelease();
  }

  // ExplosiÃ³n de Ãrea / DetonaciÃ³n Contundente
  public playAoEExplosion() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.32);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  // PUZLE DE RUEDA ELEMENTAL Y PUERTA DE HIERRO
  // Giro de la Rueda Dentada con crujido de escarcha y piedra
  public playWheelTurn(progress: number = 0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Frecuencia base sube conforme el engranaje avanza hacia el 100%
    const baseFreq = 160 + progress * 240;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, now + 0.12);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.Q.setValueAtTime(2.5, now);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.12);

    // Tintineo de cristal gÃ©lido
    const iceOsc = this.ctx.createOscillator();
    const iceGain = this.ctx.createGain();
    iceOsc.type = 'sine';
    iceOsc.frequency.setValueAtTime(900 + Math.random() * 400, now);
    iceGain.gain.setValueAtTime(0.06, now);
    iceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    iceOsc.connect(iceGain);
    iceGain.connect(this.dest);
    iceOsc.start(now);
    iceOsc.stop(now + 0.08);
  }

  // Ã‰xito al 100% del Puzle de la Rueda (Acorde triunfal de cristales de hielo)
  public playWheelComplete() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const freqs = [523.25, 659.25, 783.99, 1046.5]; // Acorde C Mayor brillante
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.2, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.45);
      osc.connect(gain);
      gain.connect(this.dest);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.45);
    });
  }

  // Apertura de la Colosal Puerta de Hierro (Chirrido de rejas y cadenas)
  public playGateOpen() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Retumbar grave de cadenas y mecanismos
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.linearRampToValueAtTime(45, now + 0.6);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.6);

    // Chirrido metÃ¡lico de rejas
    const metalOsc = this.ctx.createOscillator();
    const metalGain = this.ctx.createGain();
    metalOsc.type = 'sawtooth';
    metalOsc.frequency.setValueAtTime(320, now + 0.05);
    metalOsc.frequency.linearRampToValueAtTime(180, now + 0.55);
    metalGain.gain.setValueAtTime(0.12, now + 0.05);
    metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    metalOsc.connect(metalGain);
    metalGain.connect(this.dest);
    metalOsc.start(now + 0.05);
    metalOsc.stop(now + 0.55);
  }

  // GESTIÃ“N DE SONIDO CONTINUO PARA ATAQUES CANALIZADOS (FUEGO Y HIELO)
  private activeStreamType: 'fire' | 'ice' | null = null;
  private streamOsc1: OscillatorNode | null = null;
  private streamOsc2: OscillatorNode | null = null;
  private streamGain: GainNode | null = null;
  private streamFilter: BiquadFilterNode | null = null;

  public startContinuousStream(type: 'fire' | 'ice') {
    if (this.isMuted) return;
    if (this.activeStreamType === type && this.streamGain) return;
    this.stopContinuousStream();

    this.initCtx();
    if (!this.ctx) return;

    this.activeStreamType = type;
    const now = this.ctx.currentTime;
    this.streamGain = this.ctx.createGain();
    this.streamGain.gain.setValueAtTime(0.001, now);

    if (type === 'fire') {
      // Rugido abrasador continuo de llamas
      this.streamFilter = this.ctx.createBiquadFilter();
      this.streamFilter.type = 'lowpass';
      this.streamFilter.frequency.setValueAtTime(420, now);

      this.streamOsc1 = this.ctx.createOscillator();
      this.streamOsc1.type = 'sawtooth';
      this.streamOsc1.frequency.setValueAtTime(95, now);

      this.streamOsc2 = this.ctx.createOscillator();
      this.streamOsc2.type = 'triangle';
      this.streamOsc2.frequency.setValueAtTime(140, now);

      this.streamOsc1.connect(this.streamFilter);
      this.streamOsc2.connect(this.streamFilter);
      this.streamFilter.connect(this.streamGain);

      this.streamGain.gain.linearRampToValueAtTime(0.18, now + 0.06);

      this.streamOsc1.start(now);
      this.streamOsc2.start(now);
    } else {
      // Silbido criogÃ©nico de ventisca y zumbido helado
      this.streamFilter = this.ctx.createBiquadFilter();
      this.streamFilter.type = 'bandpass';
      this.streamFilter.frequency.setValueAtTime(780, now);
      this.streamFilter.Q.setValueAtTime(2.0, now);

      this.streamOsc1 = this.ctx.createOscillator();
      this.streamOsc1.type = 'sine';
      this.streamOsc1.frequency.setValueAtTime(540, now);

      this.streamOsc2 = this.ctx.createOscillator();
      this.streamOsc2.type = 'triangle';
      this.streamOsc2.frequency.setValueAtTime(820, now);

      this.streamOsc1.connect(this.streamFilter);
      this.streamOsc2.connect(this.streamFilter);
      this.streamFilter.connect(this.streamGain);

      this.streamGain.gain.linearRampToValueAtTime(0.14, now + 0.06);

      this.streamOsc1.start(now);
      this.streamOsc2.start(now);
    }

    this.streamGain.connect(this.dest);
  }

  public stopContinuousStream() {
    if (!this.streamGain || !this.ctx) {
      this.activeStreamType = null;
      return;
    }
    const now = this.ctx.currentTime;
    const g = this.streamGain;
    const osc1 = this.streamOsc1;
    const osc2 = this.streamOsc2;

    try {
      g.gain.linearRampToValueAtTime(0.0001, now + 0.05);
      setTimeout(() => {
        try {
          osc1?.stop();
          osc2?.stop();
          osc1?.disconnect();
          osc2?.disconnect();
          g.disconnect();
        } catch {
          // Ya detenido
        }
      }, 60);
    } catch {
      // Ya desconectado
    }

    this.activeStreamType = null;
    this.streamOsc1 = null;
    this.streamOsc2 = null;
    this.streamGain = null;
    this.streamFilter = null;
  }

  // Golpe periÃ³dico de daÃ±o del chorro
  public playContinuousTick(type: 'fire' | 'ice') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'fire') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.05);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(860, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    }

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // --- PILAR ÍGNEO / IGNICIÓN A DISTANCIA (FUEGO + FUEGO) ---

  // 1. Fase 1: Conjuración de la runa (silbido sutil de viento caliente en 150 ms)
  public playInfernalCrownIgnition() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.18);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.linearRampToValueAtTime(950, now + 0.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // 2. Fase 2: Detonación del Pilar (explosión de combustión sorda senoidal 110 Hz -> 35 Hz)
  public playInfernalCrownDetonation() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-bajo sordo de combustión descendente (110 Hz -> 35 Hz)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.32);

    subGain.gain.setValueAtTime(0.42, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    subOsc.connect(subGain);
    subGain.connect(this.dest);
    subOsc.start(now);
    subOsc.stop(now + 0.45);

    // Resonador de estallido volcánico en bajas frecuencias
    const blastOsc = this.ctx.createOscillator();
    const blastGain = this.ctx.createGain();
    blastOsc.type = 'triangle';
    blastOsc.frequency.setValueAtTime(140, now);
    blastOsc.frequency.exponentialRampToValueAtTime(40, now + 0.38);

    blastGain.gain.setValueAtTime(0.32, now);
    blastGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    blastOsc.connect(blastGain);
    blastGain.connect(this.dest);
    blastOsc.start(now);
    blastOsc.stop(now + 0.38);
  }

  // --- SOBRECARGA VOLTAICA (RAYO + RAYO) ---

  // 1. Zumbido progresivo de acumulaciÃ³n elÃ©ctrica
  public playVoltaicChargeHum(ratio: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    const startFreq = 120 + ratio * 340;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq + 50, now + 0.08);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400 + ratio * 850, now);
    filter.Q.setValueAtTime(3.0, now);

    const vol = 0.04 + ratio * 0.12;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.dest);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // 2. Resonancia y chispazo de Carga MÃ¡xima alcanzada
  public playVoltaicMaxChargeReady() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Tono armÃ³nico agudo de sobrecarga
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.18);
    gain1.gain.setValueAtTime(0.24, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(this.dest);
    osc1.start(now);
    osc1.stop(now + 0.22);

    // Chispazo de arco estÃ¡tico
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1250, now);
    osc2.frequency.linearRampToValueAtTime(380, now + 0.12);
    gain2.gain.setValueAtTime(0.18, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc2.connect(gain2);
    gain2.connect(this.dest);
    osc2.start(now);
    osc2.stop(now + 0.12);
  }

  // 3. LiberaciÃ³n de la descarga principal
  public playVoltaicDischarge(isMaxCharge: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(isMaxCharge ? 1250 : 850, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + (isMaxCharge ? 0.28 : 0.18));

    gain.gain.setValueAtTime(isMaxCharge ? 0.38 : 0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isMaxCharge ? 0.28 : 0.18));

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + (isMaxCharge ? 0.28 : 0.18));
  }

  // 4. Salto de rayo en cadena (Chain Zap)
  public playVoltaicChainZap(jumpIndex: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    // Escala ascendente para dar sensaciÃ³n de salto encadenado rÃ¡pido
    const baseFreq = 650 + (jumpIndex % 6) * 120;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // 5. Trueno colosal celestial (Impacto de carga mÃ¡xima y remate final)
  public playVoltaicThunderFinish() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-grave de trueno
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.45);
    subGain.gain.setValueAtTime(0.42, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    subOsc.connect(subGain);
    subGain.connect(this.dest);
    subOsc.start(now);
    subOsc.stop(now + 0.45);

    // Chasis de distorsiÃ³n elÃ©ctrica
    const crackOsc = this.ctx.createOscillator();
    const crackGain = this.ctx.createGain();
    crackOsc.type = 'sawtooth';
    crackOsc.frequency.setValueAtTime(750, now);
    crackOsc.frequency.exponentialRampToValueAtTime(90, now + 0.35);
    crackGain.gain.setValueAtTime(0.3, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    crackOsc.connect(crackGain);
    crackGain.connect(this.dest);
    crackOsc.start(now);
    crackOsc.stop(now + 0.35);
  }

  // ==========================================
  // ERUPCIÃ“N GLACIAL (HIELO + HIELO)
  // ==========================================

  // 1. InvocaciÃ³n / Desate de la falla glacial
  public playGlacialEruptionCast(isCharged: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Rugido subterrÃ¡neo de permafrost fracturado
    const rumbleOsc = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumbleOsc.type = 'triangle';
    rumbleOsc.frequency.setValueAtTime(isCharged ? 95 : 120, now);
    rumbleOsc.frequency.exponentialRampToValueAtTime(35, now + 0.38);

    rumbleGain.gain.setValueAtTime(isCharged ? 0.35 : 0.25, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    rumbleOsc.connect(rumbleGain);
    rumbleGain.connect(this.dest);
    rumbleOsc.start(now);
    rumbleOsc.stop(now + 0.38);

    // Silbido de viento polar gÃ©lido
    const windOsc = this.ctx.createOscillator();
    const windGain = this.ctx.createGain();
    windOsc.type = 'sine';
    windOsc.frequency.setValueAtTime(420, now);
    windOsc.frequency.linearRampToValueAtTime(880, now + 0.12);
    windOsc.frequency.exponentialRampToValueAtTime(260, now + 0.3);

    windGain.gain.setValueAtTime(0.18, now);
    windGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    windOsc.connect(windGain);
    windGain.connect(this.dest);
    windOsc.start(now);
    windOsc.stop(now + 0.3);
  }

  // 2. Ruptura y emersiÃ³n de cada pÃºa de hielo gigante (escalonado)
  public playGlacialSpikeErupt(index: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Golpe sordo de tierra rompiÃ©ndose
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(160 - Math.min(60, index * 8), now);
    thudOsc.frequency.exponentialRampToValueAtTime(40, now + 0.14);

    thudGain.gain.setValueAtTime(0.24, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    thudOsc.connect(thudGain);
    thudGain.connect(this.dest);
    thudOsc.start(now);
    thudOsc.stop(now + 0.14);

    // Resonancia de cristal afilado en escala creciente
    const crystalOsc = this.ctx.createOscillator();
    const crystalGain = this.ctx.createGain();
    crystalOsc.type = 'sine';
    const crystalFreq = 520 + (index % 8) * 85;
    crystalOsc.frequency.setValueAtTime(crystalFreq, now);
    crystalOsc.frequency.exponentialRampToValueAtTime(crystalFreq * 1.5, now + 0.08);

    crystalGain.gain.setValueAtTime(0.18, now);
    crystalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    crystalOsc.connect(crystalGain);
    crystalGain.connect(this.dest);
    crystalOsc.start(now);
    crystalOsc.stop(now + 0.12);
  }

  // 3. Impacto de congelaciÃ³n instantÃ¡nea (bloque de hielo sÃ³lido)
  public playGlacialFreezeImpact() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'square';
    snapOsc.frequency.setValueAtTime(980, now);
    snapOsc.frequency.exponentialRampToValueAtTime(220, now + 0.16);

    snapGain.gain.setValueAtTime(0.22, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    snapOsc.connect(snapGain);
    snapGain.connect(this.dest);
    snapOsc.start(now);
    snapOsc.stop(now + 0.16);
  }

  // 4. Estallido y fragmentaciÃ³n de las pÃºas glaciales (Shatter final)
  public playGlacialShatter() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Cascada de fragmentos de hielo y cuarzo cristalino
    [1200, 1650, 2100].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.02);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.35, now + 0.22);

      gain.gain.setValueAtTime(0.14, now + idx * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.02);
      osc.stop(now + 0.24);
    });
  }

  // ==========================================
  // PUÃ‘O TECTÃ“NICO (TIERRA + TIERRA)
  // ==========================================

  // 1. Advertencia y rugido sÃ­smico subterrÃ¡neo
  public playTectonicRumble(isCharged: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(isCharged ? 70 : 85, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.24);

    gain.gain.setValueAtTime(isCharged ? 0.32 : 0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  // 2. Emergencia violenta y golpe ascendente (Uppercut telÃºrico)
  public playTectonicFistUppercut(isCharged: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-impacto percusivo pesado (grave)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(180, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

    subGain.gain.setValueAtTime(isCharged ? 0.48 : 0.38, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    subOsc.connect(subGain);
    subGain.connect(this.dest);
    subOsc.start(now);
    subOsc.stop(now + 0.35);

    // Ruptura de roca sÃ³lida y empuje ascendente
    const crackOsc = this.ctx.createOscillator();
    const crackGain = this.ctx.createGain();
    crackOsc.type = 'square';
    crackOsc.frequency.setValueAtTime(260, now);
    crackOsc.frequency.exponentialRampToValueAtTime(65, now + 0.22);

    crackGain.gain.setValueAtTime(isCharged ? 0.28 : 0.2, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    crackOsc.connect(crackGain);
    crackGain.connect(this.dest);
    crackOsc.start(now);
    crackOsc.stop(now + 0.22);
  }

  // 3. Colapso del puÃ±o en escombros (Ãpice y desprendimiento)
  public playTectonicCollapse() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    [180, 140, 95].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);
      osc.frequency.exponentialRampToValueAtTime(35, now + idx * 0.03 + 0.18);

      gain.gain.setValueAtTime(0.18, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.18);
    });
  }

  // 4. Desmoronamiento de escombros temporales en polvo
  public playTectonicCrumble() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.2);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // ==========================================
  // RAYO CRIOGÃ‰NICO (HIELO + RAYO)
  // ==========================================

  // 1. Disparo / IgniciÃ³n del haz plasma-gÃ©lido
  public playCryoBeamStart(isCharged: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Chispa elÃ©ctrica inicial aguda
    const oscZ = this.ctx.createOscillator();
    const gainZ = this.ctx.createGain();
    oscZ.type = 'sawtooth';
    oscZ.frequency.setValueAtTime(isCharged ? 920 : 740, now);
    oscZ.frequency.exponentialRampToValueAtTime(140, now + 0.16);

    gainZ.gain.setValueAtTime(isCharged ? 0.32 : 0.22, now);
    gainZ.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    oscZ.connect(gainZ);
    gainZ.connect(this.dest);
    oscZ.start(now);
    oscZ.stop(now + 0.16);

    // Silbido gÃ©lido de viento polar
    const oscW = this.ctx.createOscillator();
    const gainW = this.ctx.createGain();
    oscW.type = 'sine';
    oscW.frequency.setValueAtTime(isCharged ? 1100 : 880, now);
    oscW.frequency.linearRampToValueAtTime(440, now + 0.2);

    gainW.gain.setValueAtTime(0.18, now);
    gainW.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    oscW.connect(gainW);
    gainW.connect(this.dest);
    oscW.start(now);
    oscW.stop(now + 0.2);
  }

  // 2. Pulso / Zumbido continuo durante la emisiÃ³n (hielo + plasma voltaico)
  public playCryoBeamHum(isCharged: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Zumbido elÃ©ctrico
    const oscE = this.ctx.createOscillator();
    const gainE = this.ctx.createGain();
    oscE.type = 'sawtooth';
    oscE.frequency.setValueAtTime(isCharged ? 480 : 360, now);
    oscE.frequency.linearRampToValueAtTime(isCharged ? 520 : 400, now + 0.08);

    gainE.gain.setValueAtTime(isCharged ? 0.16 : 0.11, now);
    gainE.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    oscE.connect(gainE);
    gainE.connect(this.dest);
    oscE.start(now);
    oscE.stop(now + 0.09);

    // Resonancia de cristal gÃ©lido
    const oscI = this.ctx.createOscillator();
    const gainI = this.ctx.createGain();
    oscI.type = 'triangle';
    oscI.frequency.setValueAtTime(isCharged ? 880 : 720, now);
    oscI.frequency.exponentialRampToValueAtTime(320, now + 0.08);

    gainI.gain.setValueAtTime(0.12, now);
    gainI.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    oscI.connect(gainI);
    gainI.connect(this.dest);
    oscI.start(now);
    oscI.stop(now + 0.08);
  }

  // 3. Salto de arco elÃ©ctrico a enemigo adyacente
  public playCryoBeamArcJump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.07);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  // 4. DetenciÃ³n y disipaciÃ³n del haz
  public playCryoBeamEnd() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.14);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  // =========================================================================
  // BOMBARDEO VOLCÃNICO (FUEGO + TIERRA: RUGIDO SUBTERRÃNEO, COLUMNAS Y BOMBAS)
  // =========================================================================

  // 1. Rugido sÃ­smico y fractura magmÃ¡tica subterrÃ¡nea
  public playVolcanicRumble(isCharged: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Oscilador grave de sub-graves
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isCharged ? 95 : 78, now);
    osc.frequency.exponentialRampToValueAtTime(26, now + 0.38);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(160, now);
    filter.frequency.exponentialRampToValueAtTime(45, now + 0.38);

    gain.gain.setValueAtTime(isCharged ? 0.36 : 0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.38);

    // Segundo oscilador con modulaciÃ³n de vibraciÃ³n para emular crujido de tierra
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(55, now);
    osc2.frequency.linearRampToValueAtTime(30, now + 0.28);

    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(110, now);

    gain2.gain.setValueAtTime(isCharged ? 0.20 : 0.14, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.30);

    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(this.dest);
    osc2.start(now);
    osc2.stop(now + 0.30);
  }

  // 2. ErupciÃ³n violenta de columna de magma y gÃ©iser de fuego
  public playMagmaGeyser() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.28);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380, now);
    filter.Q.setValueAtTime(2.2, now);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.28);

    // Ruido sibilante de vapor/lava hirviente
    const bufferSize = this.ctx.sampleRate * 0.24;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.45;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(650, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(140, now + 0.24);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.dest);
    noise.start(now);
    noise.stop(now + 0.24);
  }

  // 3. Impacto y salpicadura pesada de bomba de lava (Lava Splat)
  public playLavaSplat() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.16);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.16);

    // PequeÃ±o chisporroteo viscoso
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(noiseGain);
    noiseGain.connect(this.dest);
    noise.start(now);
    noise.stop(now + 0.12);
  }

  // =========================================================================
  // VÃ“RTICE DE CHOQUE TÃ‰RMICO (FUEGO + HIELO: EXPANSIÃ“N DE VAPOR Y DETONACIÃ“N)
  // =========================================================================

  // 1. ExpansiÃ³n explosiva de la onda de vapor y choque tÃ©rmico
  public playThermalShockBlast(isCharged: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // A. Golpe sÃ³nico grave de descompresiÃ³n
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isCharged ? 160 : 130, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.32);

    gain.gain.setValueAtTime(isCharged ? 0.38 : 0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.32);

    // B. RÃ¡faga expansiva de vapor sibilante a alta presiÃ³n (White noise con bandpass dinÃ¡mico)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.34);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.45;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(isCharged ? 1200 : 950, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(320, now + 0.34);
    noiseFilter.Q.setValueAtTime(1.8, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isCharged ? 0.28 : 0.20, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.dest);
    noise.start(now);
    noise.stop(now + 0.34);
  }

  // 2. Fractura reactiva y detonaciÃ³n crÃ­tica sobre enemigo congelado
  public playThermalShatterCrit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Quiebre cristalino de hielo de alta frecuencia
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.18);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.18);

    // DetonaciÃ³n sÃ³nica por vaporizaciÃ³n sÃºbita interna
    const pop = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    pop.type = 'sine';
    pop.frequency.setValueAtTime(260, now);
    pop.frequency.exponentialRampToValueAtTime(65, now + 0.15);

    popGain.gain.setValueAtTime(0.26, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    pop.connect(popGain);
    popGain.connect(this.dest);
    pop.start(now);
    pop.stop(now + 0.15);
  }

  // =========================================================================
  // JAULA DE PILARES CONDUCTORES (RAYO + TIERRA)
  // =========================================================================

  // 1. ErupciÃ³n telÃºrica de monolitos conductores y activaciÃ³n de cuarzo resonante
  public playConductivePillarErupt(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-golpe telÃºrico de impacto en el suelo
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(isCharged ? 130 : 160, now);
    thud.frequency.exponentialRampToValueAtTime(35, now + 0.28);

    thudGain.gain.setValueAtTime(isCharged ? 0.42 : 0.32, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    thud.connect(thudGain);
    thudGain.connect(this.dest);
    thud.start(now);
    thud.stop(now + 0.28);

    // Resonancia de cuarzo piezoelÃ©ctrico escalonada
    [480, 720, 960].forEach((freq, idx) => {
      const delay = idx * 0.045;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + delay);
      osc.frequency.linearRampToValueAtTime(freq * 1.35, now + delay + 0.2);

      gain.gain.setValueAtTime(isCharged ? 0.15 : 0.1, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.22);
    });
  }

  // 2. Chispazo / descarga de alta tensiÃ³n al cruzar la valla electrificada
  public playConductiveFenceZap() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Chispa rÃ¡pida cortante tipo taser/arco voltaico
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(980, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.09);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // 3. ImplosiÃ³n final de sobrecarga y colapso gravitatorio/elÃ©ctrico
  public playConductiveCageImplosion(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Descenso y compresiÃ³n rÃ¡pida de frecuencia inward
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(isCharged ? 320 : 260, now);
    subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.26);

    subGain.gain.setValueAtTime(isCharged ? 0.5 : 0.38, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    subOsc.connect(subGain);
    subGain.connect(this.dest);
    subOsc.start(now);
    subOsc.stop(now + 0.26);

    // Crujido elÃ©ctrico y fractura de roca en el instante del colapso
    const crack = this.ctx.createOscillator();
    const crackGain = this.ctx.createGain();
    crack.type = 'sawtooth';
    crack.frequency.setValueAtTime(isCharged ? 1100 : 850, now + 0.04);
    crack.frequency.exponentialRampToValueAtTime(80, now + 0.22);

    crackGain.gain.setValueAtTime(isCharged ? 0.35 : 0.25, now + 0.04);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    crack.connect(crackGain);
    crackGain.connect(this.dest);
    crack.start(now + 0.04);
    crack.stop(now + 0.22);
  }

  // =========================================================================
  // PRISIÃ“N DE PERMAFROST (HIELO + TIERRA)
  // =========================================================================

  // 1. ErupciÃ³n telÃºrica de monolitos y cristalizaciÃ³n de permafrost
  public playPermafrostErupt(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-golpe sÃ­smico de emergencia de roca
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(isCharged ? 110 : 140, now);
    thud.frequency.exponentialRampToValueAtTime(30, now + 0.26);

    thudGain.gain.setValueAtTime(isCharged ? 0.38 : 0.28, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    thud.connect(thudGain);
    thudGain.connect(this.dest);
    thud.start(now);
    thud.stop(now + 0.26);

    // Crujido agudo de congelaciÃ³n y permafrost
    const iceCrack = this.ctx.createOscillator();
    const iceGain = this.ctx.createGain();
    iceCrack.type = 'sawtooth';
    iceCrack.frequency.setValueAtTime(isCharged ? 1150 : 920, now);
    iceCrack.frequency.exponentialRampToValueAtTime(340, now + 0.2);

    iceGain.gain.setValueAtTime(isCharged ? 0.25 : 0.18, now);
    iceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    iceCrack.connect(iceGain);
    iceGain.connect(this.dest);
    iceCrack.start(now);
    iceCrack.stop(now + 0.2);
  }

  // 2. Bloqueo e interceptaciÃ³n de proyectil contra el permafrost
  public playPermafrostBlock() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Golpe sordo de absorciÃ³n
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.1);

    // Chink cristalino de impacto en hielo duro
    const chink = this.ctx.createOscillator();
    const chinkGain = this.ctx.createGain();
    chink.type = 'sine';
    chink.frequency.setValueAtTime(1750, now);
    chink.frequency.exponentialRampToValueAtTime(650, now + 0.08);

    chinkGain.gain.setValueAtTime(0.18, now);
    chinkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    chink.connect(chinkGain);
    chinkGain.connect(this.dest);
    chink.start(now);
    chink.stop(now + 0.08);
  }

  // 3. FragmentaciÃ³n explosiva y detonaciÃ³n de metralla de hielo y roca
  public playPermafrostShatter(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Estallido de hielo a alta frecuencia
    const shatter = this.ctx.createOscillator();
    const shatterGain = this.ctx.createGain();
    shatter.type = 'sawtooth';
    shatter.frequency.setValueAtTime(isCharged ? 1600 : 1300, now);
    shatter.frequency.exponentialRampToValueAtTime(220, now + 0.22);

    shatterGain.gain.setValueAtTime(isCharged ? 0.38 : 0.28, now);
    shatterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    shatter.connect(shatterGain);
    shatterGain.connect(this.dest);
    shatter.start(now);
    shatter.stop(now + 0.22);

    // Onda sÃ³nica de choque telÃºrica
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(isCharged ? 220 : 180, now);
    boom.frequency.exponentialRampToValueAtTime(35, now + 0.25);

    boomGain.gain.setValueAtTime(isCharged ? 0.45 : 0.32, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    boom.connect(boomGain);
    boomGain.connect(this.dest);
    boom.start(now);
    boom.stop(now + 0.25);
  }

  // =========================================================================
  // TORNADO DE PLASMA (FUEGO + RAYO)
  // =========================================================================

  // 1. Lanzamiento del torbellino acelerado de fuego y electricidad
  public playPlasmaTornadoLaunch(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Rugido de vÃ³rtice Ã­gneo de aire caliente
    const whoosh = this.ctx.createOscillator();
    const whooshGain = this.ctx.createGain();
    whoosh.type = 'sawtooth';
    whoosh.frequency.setValueAtTime(isCharged ? 380 : 310, now);
    whoosh.frequency.exponentialRampToValueAtTime(140, now + 0.35);

    whooshGain.gain.setValueAtTime(isCharged ? 0.36 : 0.26, now);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    whoosh.connect(whooshGain);
    whooshGain.connect(this.dest);
    whoosh.start(now);
    whoosh.stop(now + 0.35);

    // Zumbido elÃ©ctrico de alta frecuencia de plasma
    const zap = this.ctx.createOscillator();
    const zapGain = this.ctx.createGain();
    zap.type = 'sawtooth';
    zap.frequency.setValueAtTime(isCharged ? 880 : 720, now);
    zap.frequency.linearRampToValueAtTime(isCharged ? 1240 : 1050, now + 0.28);

    zapGain.gain.setValueAtTime(isCharged ? 0.2 : 0.14, now);
    zapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    zap.connect(zapGain);
    zapGain.connect(this.dest);
    zap.start(now);
    zap.stop(now + 0.28);
  }

  // 2. IonizaciÃ³n y desintegraciÃ³n de proyectiles hostiles absorbidos
  public playPlasmaDisintegrate() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const zap = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    zap.type = 'sawtooth';
    zap.frequency.setValueAtTime(1450, now);
    zap.frequency.exponentialRampToValueAtTime(260, now + 0.09);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    zap.connect(gain);
    gain.connect(this.dest);
    zap.start(now);
    zap.stop(now + 0.09);
  }

  // 3. ImplosiÃ³n y detonaciÃ³n terminal masiva de plasma
  public playPlasmaTornadoDetonate(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-bajo de implosiÃ³n y compresiÃ³n tÃ©rmica
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(isCharged ? 280 : 220, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.3);

    subGain.gain.setValueAtTime(isCharged ? 0.52 : 0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    subOsc.connect(subGain);
    subGain.connect(this.dest);
    subOsc.start(now);
    subOsc.stop(now + 0.3);

    // ExplosiÃ³n de plasma de alta tensiÃ³n
    const blast = this.ctx.createOscillator();
    const blastGain = this.ctx.createGain();
    blast.type = 'sawtooth';
    blast.frequency.setValueAtTime(isCharged ? 1150 : 880, now + 0.03);
    blast.frequency.exponentialRampToValueAtTime(65, now + 0.28);

    blastGain.gain.setValueAtTime(isCharged ? 0.42 : 0.3, now + 0.03);
    blastGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    blast.connect(blastGain);
    blastGain.connect(this.dest);
    blast.start(now + 0.03);
    blast.stop(now + 0.28);
  }

  // Siseo de vapor al golpear una barrera de fuego con magia de hielo
  public playFireExtinguishSizzle() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.16);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.6));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3400, now);
      filter.frequency.exponentialRampToValueAtTime(1600, now + 0.15);
      filter.Q.setValueAtTime(3.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.dest);

      noise.start(now);
      noise.stop(now + 0.16);
    } catch {
      // Fallback con oscilador si buffers no estÃ¡n permitidos
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.dest);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  }

  // Triunfante disipaciÃ³n de la barrera de fuego (vapor profundo + campanada armÃ³nica)
  public playFireBarrierExtinguished() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Gran exhalaciÃ³n de vapor
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.8));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2800, now);
      filter.frequency.exponentialRampToValueAtTime(450, now + 0.45);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.dest);
      noise.start(now);
      noise.stop(now + 0.45);
    } catch {
      // Silencioso fallback
    }

    // 2. Acorde cristalino de triunfo
    const freqs = [587.33, 880, 1174.66]; // Re mayor cristalino
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = idx * 0.04;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0.12, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.5);
      osc.connect(gain);
      gain.connect(this.dest);
      osc.start(now + delay);
      osc.stop(now + delay + 0.5);
    });
  }

  // DaÃ±o por quemadura al tocar fÃ­sicamente la barrera de fuego
  public playFireBurnHurt() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // LLUVIA DEL INFIERNO (ðŸ”¥ðŸ”¥ðŸ”¥)
  // 1. InvocaciÃ³n cÃ³smica y columna Ã­gnea vertical
  public playHellRainCast(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Resonancia sub-grave de apertura de portal cÃ³smico
    const drone = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    drone.type = 'sawtooth';
    drone.frequency.setValueAtTime(isCharged ? 95 : 120, now);
    drone.frequency.exponentialRampToValueAtTime(45, now + 0.45);

    droneGain.gain.setValueAtTime(isCharged ? 0.38 : 0.28, now);
    droneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    drone.connect(droneGain);
    droneGain.connect(this.dest);
    drone.start(now);
    drone.stop(now + 0.45);

    // Rugido ascendente de fuego
    const whoosh = this.ctx.createOscillator();
    const whooshGain = this.ctx.createGain();
    whoosh.type = 'triangle';
    whoosh.frequency.setValueAtTime(180, now);
    whoosh.frequency.exponentialRampToValueAtTime(isCharged ? 880 : 640, now + 0.35);

    whooshGain.gain.setValueAtTime(0.3, now);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    whoosh.connect(whooshGain);
    whooshGain.connect(this.dest);
    whoosh.start(now);
    whoosh.stop(now + 0.38);
  }

  // 2. Silbido aÃ©reo de reentrada del meteorito cayendo a gran velocidad
  public playHellMeteorWhistle() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const whistle = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(1400, now);
    whistle.frequency.exponentialRampToValueAtTime(320, now + 0.18);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    whistle.connect(gain);
    gain.connect(this.dest);
    whistle.start(now);
    whistle.stop(now + 0.18);
  }

  // 3. Impacto detonante y fractura sÃ­smica de roca volcÃ¡nica
  public playHellMeteorExplosion(isColossal: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-bass sÃ­smico
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(isColossal ? 140 : 180, now);
    thud.frequency.exponentialRampToValueAtTime(28, now + (isColossal ? 0.38 : 0.25));

    thudGain.gain.setValueAtTime(isColossal ? 0.55 : 0.4, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + (isColossal ? 0.38 : 0.25));

    thud.connect(thudGain);
    thudGain.connect(this.dest);
    thud.start(now);
    thud.stop(now + (isColossal ? 0.38 : 0.25));

    // Estallido de roca volcÃ¡nica y fuego
    const blast = this.ctx.createOscillator();
    const blastGain = this.ctx.createGain();
    blast.type = 'sawtooth';
    blast.frequency.setValueAtTime(isColossal ? 520 : 680, now);
    blast.frequency.exponentialRampToValueAtTime(45, now + (isColossal ? 0.32 : 0.22));

    blastGain.gain.setValueAtTime(isColossal ? 0.45 : 0.32, now);
    blastGain.gain.exponentialRampToValueAtTime(0.001, now + (isColossal ? 0.32 : 0.22));

    blast.connect(blastGain);
    blastGain.connect(this.dest);
    blast.start(now);
    blast.stop(now + (isColossal ? 0.32 : 0.22));
  }

  // 4. Chisporroteo y burbujeo del magma fundido en el crÃ¡ter
  public playMagmaCraterSizzle() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320 + Math.random() * 80, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // =========================================================================
  // SONIDOS DE TORMENTA CELESTIAL (RAYO + RAYO + RAYO - âš¡âš¡âš¡)
  // =========================================================================

  // 1. InvocaciÃ³n de la tempestad e ionizaciÃ³n atmosfÃ©rica
  public playCelestialStormCast(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-bass electromagnÃ©tico
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(55, now);
    sub.frequency.exponentialRampToValueAtTime(75, now + 0.22);
    subGain.gain.setValueAtTime(isCharged ? 0.35 : 0.24, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    sub.connect(subGain);
    subGain.connect(this.dest);
    sub.start(now);
    sub.stop(now + 0.22);

    // IonizaciÃ³n ascendente de alta tensiÃ³n
    const surge = this.ctx.createOscillator();
    const surgeGain = this.ctx.createGain();
    surge.type = 'sawtooth';
    surge.frequency.setValueAtTime(isCharged ? 220 : 280, now);
    surge.frequency.exponentialRampToValueAtTime(isCharged ? 980 : 850, now + 0.24);
    surgeGain.gain.setValueAtTime(isCharged ? 0.25 : 0.18, now);
    surgeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    surge.connect(surgeGain);
    surgeGain.connect(this.dest);
    surge.start(now);
    surge.stop(now + 0.24);
  }

  // 2. Impacto fulminante de relÃ¡mpago vertical y trueno seco
  public playCelestialLightningStrike(isColossal: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Chasquido de alta tensiÃ³n (Snap)
    const snap = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snap.type = 'sawtooth';
    snap.frequency.setValueAtTime(isColossal ? 2600 : 2200, now);
    snap.frequency.exponentialRampToValueAtTime(80, now + (isColossal ? 0.05 : 0.035));
    snapGain.gain.setValueAtTime(isColossal ? 0.45 : 0.3, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + (isColossal ? 0.05 : 0.035));
    snap.connect(snapGain);
    snapGain.connect(this.dest);
    snap.start(now);
    snap.stop(now + (isColossal ? 0.05 : 0.035));

    // Trueno seco (Crack)
    const crack = this.ctx.createOscillator();
    const crackGain = this.ctx.createGain();
    crack.type = 'triangle';
    crack.frequency.setValueAtTime(isColossal ? 450 : 380, now);
    crack.frequency.exponentialRampToValueAtTime(35, now + (isColossal ? 0.24 : 0.16));
    crackGain.gain.setValueAtTime(isColossal ? 0.5 : 0.35, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + (isColossal ? 0.24 : 0.16));
    crack.connect(crackGain);
    crackGain.connect(this.dest);
    crack.start(now);
    crack.stop(now + (isColossal ? 0.24 : 0.16));

    // Estruendo sub-grave sÃ­smico
    const rumble = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(isColossal ? 130 : 100, now);
    rumble.frequency.exponentialRampToValueAtTime(25, now + (isColossal ? 0.38 : 0.22));
    rumbleGain.gain.setValueAtTime(isColossal ? 0.6 : 0.4, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + (isColossal ? 0.38 : 0.22));
    rumble.connect(rumbleGain);
    rumbleGain.connect(this.dest);
    rumble.start(now);
    rumble.stop(now + (isColossal ? 0.38 : 0.22));
  }

  // 3. Chisporroteo y zumbido residual de estÃ¡tica en charcos ionizados
  public playIonizedPuddleBuzz() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420 + Math.random() * 120, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.065);
    gain.gain.setValueAtTime(0.065, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    osc.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  // 4. DetonaciÃ³n electromagnÃ©tica terminal de sobrecarga
  public playCelestialTerminalDetonation() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Onda sÃ³nica electromagnÃ©tica
    const blast = this.ctx.createOscillator();
    const blastGain = this.ctx.createGain();
    blast.type = 'sawtooth';
    blast.frequency.setValueAtTime(620, now);
    blast.frequency.exponentialRampToValueAtTime(32, now + 0.35);
    blastGain.gain.setValueAtTime(0.5, now);
    blastGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    blast.connect(blastGain);
    blastGain.connect(this.dest);
    blast.start(now);
    blast.stop(now + 0.35);

    // Resonancia subgrave
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(140, now);
    boom.frequency.exponentialRampToValueAtTime(20, now + 0.45);
    boomGain.gain.setValueAtTime(0.65, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    boom.connect(boomGain);
    boomGain.connect(this.dest);
    boom.start(now);
    boom.stop(now + 0.45);
  }

  // =========================================================================
  // SONIDOS DE GLACIAR DEVASTADOR (HIELO + HIELO + HIELO - â„ï¸â„ï¸â„ï¸)
  // =========================================================================

  // 1. InvocaciÃ³n de ventisca y pulso de frÃ­o absoluto
  public playGlacierCast(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Viento gÃ©lido envolvente
    const wind = this.ctx.createOscillator();
    const windGain = this.ctx.createGain();
    wind.type = 'triangle';
    wind.frequency.setValueAtTime(isCharged ? 380 : 440, now);
    wind.frequency.exponentialRampToValueAtTime(120, now + 0.28);
    windGain.gain.setValueAtTime(isCharged ? 0.35 : 0.24, now);
    windGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    wind.connect(windGain);
    windGain.connect(this.dest);
    wind.start(now);
    wind.stop(now + 0.28);

    // Tintineo de escarcha Ã¡rtica
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(isCharged ? 1350 : 1150, now);
    chime.frequency.exponentialRampToValueAtTime(550, now + 0.22);
    chimeGain.gain.setValueAtTime(0.18, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    chime.connect(chimeGain);
    chimeGain.connect(this.dest);
    chime.start(now);
    chime.stop(now + 0.22);
  }

  // 2. Impacto de monolito de hielo prismÃ¡tico en el suelo
  public playIceMonolithImpact() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Golpe contundente y peso sÃ­smico
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(170, now);
    thud.frequency.exponentialRampToValueAtTime(32, now + 0.24);
    thudGain.gain.setValueAtTime(0.45, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    thud.connect(thudGain);
    thudGain.connect(this.dest);
    thud.start(now);
    thud.stop(now + 0.24);

    // Crujido de hielo fracturado y fragmentaciÃ³n vÃ­trea
    const shatter = this.ctx.createOscillator();
    const shatterGain = this.ctx.createGain();
    shatter.type = 'sawtooth';
    shatter.frequency.setValueAtTime(840 + Math.random() * 120, now);
    shatter.frequency.exponentialRampToValueAtTime(90, now + 0.18);
    shatterGain.gain.setValueAtTime(0.32, now);
    shatterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    shatter.connect(shatterGain);
    shatterGain.connect(this.dest);
    shatter.start(now);
    shatter.stop(now + 0.18);
  }

  // 3. ErupciÃ³n radial masiva de agujas glaciares (Remate)
  public playGlacialEruptionBurst(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Retumbar telÃºrico del permafrost quebrado
    const rumble = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(isCharged ? 95 : 120, now);
    rumble.frequency.exponentialRampToValueAtTime(22, now + (isCharged ? 0.45 : 0.35));
    rumbleGain.gain.setValueAtTime(isCharged ? 0.6 : 0.45, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + (isCharged ? 0.45 : 0.35));
    rumble.connect(rumbleGain);
    rumbleGain.connect(this.dest);
    rumble.start(now);
    rumble.stop(now + (isCharged ? 0.45 : 0.35));

    // Desgarro violento de pÃºas de hielo
    const spike = this.ctx.createOscillator();
    const spikeGain = this.ctx.createGain();
    spike.type = 'sawtooth';
    spike.frequency.setValueAtTime(isCharged ? 650 : 540, now);
    spike.frequency.exponentialRampToValueAtTime(55, now + (isCharged ? 0.38 : 0.28));
    spikeGain.gain.setValueAtTime(isCharged ? 0.5 : 0.38, now);
    spikeGain.gain.exponentialRampToValueAtTime(0.001, now + (isCharged ? 0.38 : 0.28));
    spike.connect(spikeGain);
    spikeGain.connect(this.dest);
    spike.start(now);
    spike.stop(now + (isCharged ? 0.38 : 0.28));

    // Resonancia de congelaciÃ³n cristalina
    const freezeChord = [880, 1108.7, 1318.5]; // Acorde brillante
    freezeChord.forEach((freq, idx) => {
      if (!this.ctx) return;
      const fOsc = this.ctx.createOscillator();
      const fGain = this.ctx.createGain();
      fOsc.type = 'triangle';
      fOsc.frequency.setValueAtTime(freq, now + 0.04 * idx);
      fGain.gain.setValueAtTime(0.14, now + 0.04 * idx);
      fGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      fOsc.connect(fGain);
      fGain.connect(this.dest);
      fOsc.start(now + 0.04 * idx);
      fOsc.stop(now + 0.35);
    });
  }

  // 4. Pulso suave de congelaciÃ³n y escarcha
  public playFrostSlowPulse() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const ping = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    ping.type = 'sine';
    ping.frequency.setValueAtTime(1250 + Math.random() * 200, now);
    ping.frequency.exponentialRampToValueAtTime(650, now + 0.08);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    ping.connect(gain);
    gain.connect(this.dest);
    ping.start(now);
    ping.stop(now + 0.08);
  }

  // =========================================================================
  // BARRERA TELÃšRICA (TIERRA + TIERRA + TIERRA)
  // =========================================================================

  // 1. InvocaciÃ³n de la Barrera TelÃºrica (Ruptura del suelo y emergencia de los 3 monolitos)
  public playTelluricCast(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-golpe y resonancia sÃ­smica de elevaciÃ³n
    const rumble = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumble.type = 'triangle';
    rumble.frequency.setValueAtTime(isCharged ? 130 : 160, now);
    rumble.frequency.exponentialRampToValueAtTime(32, now + (isCharged ? 0.38 : 0.28));
    rumbleGain.gain.setValueAtTime(isCharged ? 0.55 : 0.42, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + (isCharged ? 0.38 : 0.28));
    rumble.connect(rumbleGain);
    rumbleGain.connect(this.dest);
    rumble.start(now);
    rumble.stop(now + (isCharged ? 0.38 : 0.28));

    // Crujido de roca sedimentaria desgajÃ¡ndose del suelo
    const crack = this.ctx.createOscillator();
    const crackGain = this.ctx.createGain();
    crack.type = 'sawtooth';
    crack.frequency.setValueAtTime(isCharged ? 420 : 350, now);
    crack.frequency.exponentialRampToValueAtTime(75, now + 0.22);
    crackGain.gain.setValueAtTime(isCharged ? 0.38 : 0.28, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    crack.connect(crackGain);
    crackGain.connect(this.dest);
    crack.start(now);
    crack.stop(now + 0.22);

    // VÃ³rtice gravitatorio de polvo y atracciÃ³n orbital
    const noiseLen = isCharged ? 0.32 : 0.24;
    const bufferSize = Math.floor(this.ctx.sampleRate * noiseLen);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(260, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + noiseLen);
    filter.Q.setValueAtTime(2.2, now);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isCharged ? 0.32 : 0.22, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.dest);
    noise.start(now);
    noise.stop(now + noiseLen);
  }

  // 2. IntercepciÃ³n y desvÃ­o de proyectil hostil por una roca orbital
  public playTelluricDeflect() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Golpe seco contundente de piedra densa
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(260, now);
    thud.frequency.exponentialRampToValueAtTime(70, now + 0.12);
    thudGain.gain.setValueAtTime(0.4, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    thud.connect(thudGain);
    thudGain.connect(this.dest);
    thud.start(now);
    thud.stop(now + 0.12);

    // Chasquido de chispas y rechazo cinÃ©tico
    const snap = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snap.type = 'sawtooth';
    snap.frequency.setValueAtTime(950, now);
    snap.frequency.exponentialRampToValueAtTime(140, now + 0.08);
    snapGain.gain.setValueAtTime(0.25, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    snap.connect(snapGain);
    snapGain.connect(this.dest);
    snap.start(now);
    snap.stop(now + 0.08);
  }

  // 3. DetonaciÃ³n contundente masiva de roca al impactar y pulverizarse contra enemigo
  public playTelluricRockDetonation(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-bass sÃ­smico de aplastamiento
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(isCharged ? 175 : 150, now);
    sub.frequency.exponentialRampToValueAtTime(24, now + (isCharged ? 0.36 : 0.26));
    subGain.gain.setValueAtTime(isCharged ? 0.65 : 0.48, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + (isCharged ? 0.36 : 0.26));
    sub.connect(subGain);
    subGain.connect(this.dest);
    sub.start(now);
    sub.stop(now + (isCharged ? 0.36 : 0.26));

    // TrituraciÃ³n violenta de fragmentos de roca
    const crush = this.ctx.createOscillator();
    const crushGain = this.ctx.createGain();
    crush.type = 'sawtooth';
    crush.frequency.setValueAtTime(isCharged ? 680 : 540, now);
    crush.frequency.exponentialRampToValueAtTime(45, now + 0.22);
    crushGain.gain.setValueAtTime(isCharged ? 0.45 : 0.34, now);
    crushGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    crush.connect(crushGain);
    crushGain.connect(this.dest);
    crush.start(now);
    crush.stop(now + 0.22);

    // Resonancia de runa telÃºrica dorada estallando
    if (isCharged) {
      const runeChime = this.ctx.createOscillator();
      const runeGain = this.ctx.createGain();
      runeChime.type = 'triangle';
      runeChime.frequency.setValueAtTime(880, now + 0.02);
      runeChime.frequency.exponentialRampToValueAtTime(220, now + 0.24);
      runeGain.gain.setValueAtTime(0.24, now + 0.02);
      runeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      runeChime.connect(runeGain);
      runeGain.connect(this.dest);
      runeChime.start(now + 0.02);
      runeChime.stop(now + 0.24);
    }
  }

  // 4. Desmoronamiento pacÃ­fico de rocas al expirar los 20 segundos o consumirse la durabilidad
  public playTelluricCrumble() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const noiseLen = 0.22;
    const bufferSize = Math.floor(this.ctx.sampleRate * noiseLen);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + noiseLen);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.dest);
    noise.start(now);
    noise.stop(now + noiseLen);
  }

  // =========================================================================
  // VOLCÃN DE OBSIDIANA (FUEGO + HIELO + TIERRA: ERUPCIÃ“N Y CUCHILLAS VÃTREAS)
  // =========================================================================

  // 1. InvocaciÃ³n y fractura tÃ©rmica subterrÃ¡nea (presiÃ³n de vapor y magma ascendente)
  public playObsidianCast(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Resonancia telÃºrica profunda
    const rumble = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(isCharged ? 70 : 85, now);
    rumble.frequency.exponentialRampToValueAtTime(isCharged ? 180 : 210, now + 0.35);

    const rumbleFilter = this.ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(140, now);
    rumbleFilter.frequency.linearRampToValueAtTime(450, now + 0.35);

    rumbleGain.gain.setValueAtTime(isCharged ? 0.38 : 0.28, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

    rumble.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(this.dest);
    rumble.start(now);
    rumble.stop(now + 0.38);

    // Escape de vapor a alta presiÃ³n
    const noiseLen = 0.28;
    const bufferSize = Math.floor(this.ctx.sampleRate * noiseLen);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(2600, now + noiseLen);
    filter.Q.setValueAtTime(3.0, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.dest);
    noise.start(now);
    noise.stop(now + noiseLen);
  }

  // 2. DetonaciÃ³n piroclÃ¡stica explosiva (choque de magma y descompresiÃ³n)
  public playObsidianEruptionBurst(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-golpe sÃ­smico explosivo
    const blast = this.ctx.createOscillator();
    const blastGain = this.ctx.createGain();
    blast.type = 'triangle';
    blast.frequency.setValueAtTime(isCharged ? 160 : 180, now);
    blast.frequency.exponentialRampToValueAtTime(38, now + 0.4);

    blastGain.gain.setValueAtTime(isCharged ? 0.6 : 0.48, now);
    blastGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    blast.connect(blastGain);
    blastGain.connect(this.dest);
    blast.start(now);
    blast.stop(now + 0.42);

    // Crack cerÃ¡mico volcÃ¡nico
    const crackLen = 0.25;
    const crackBuff = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * crackLen), this.ctx.sampleRate);
    const cd = crackBuff.getChannelData(0);
    for (let i = 0; i < cd.length; i++) {
      cd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.05));
    }
    const crackSource = this.ctx.createBufferSource();
    crackSource.buffer = crackBuff;
    const crackFilter = this.ctx.createBiquadFilter();
    crackFilter.type = 'highpass';
    crackFilter.frequency.setValueAtTime(600, now);

    const crackGain = this.ctx.createGain();
    crackGain.gain.setValueAtTime(0.35, now);
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + crackLen);

    crackSource.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.dest);
    crackSource.start(now);
    crackSource.stop(now + crackLen);
  }

  // 3. VitrificaciÃ³n tÃ©rmica instantÃ¡nea (siseo extremo del choque tÃ©rmico + cristalizaciÃ³n)
  public playObsidianVitrifyHiss() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Siseo de choque tÃ©rmico (quench)
    const hissLen = 0.32;
    const hissBuff = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * hissLen), this.ctx.sampleRate);
    const hd = hissBuff.getChannelData(0);
    for (let i = 0; i < hd.length; i++) {
      hd[i] = Math.random() * 2 - 1;
    }
    const hissSource = this.ctx.createBufferSource();
    hissSource.buffer = hissBuff;
    const hissFilter = this.ctx.createBiquadFilter();
    hissFilter.type = 'bandpass';
    hissFilter.frequency.setValueAtTime(3200, now);
    hissFilter.frequency.exponentialRampToValueAtTime(800, now + hissLen);
    hissFilter.Q.setValueAtTime(4.0, now);

    const hissGain = this.ctx.createGain();
    hissGain.gain.setValueAtTime(0.32, now);
    hissGain.gain.exponentialRampToValueAtTime(0.001, now + hissLen);

    hissSource.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(this.dest);
    hissSource.start(now);
    hissSource.stop(now + hissLen);

    // Tono vÃ­treo metÃ¡lico agudo
    const ping = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    ping.type = 'sine';
    ping.frequency.setValueAtTime(1850, now);
    ping.frequency.exponentialRampToValueAtTime(950, now + 0.22);
    pingGain.gain.setValueAtTime(0.2, now);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    ping.connect(pingGain);
    pingGain.connect(this.dest);
    ping.start(now);
    ping.stop(now + 0.22);
  }

  // 4. Tick cortante al pisar las cuchillas de obsidiana
  public playObsidianSliceTick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const slice = this.ctx.createOscillator();
    const sliceGain = this.ctx.createGain();
    slice.type = 'triangle';
    slice.frequency.setValueAtTime(2200, now);
    slice.frequency.exponentialRampToValueAtTime(650, now + 0.05);

    sliceGain.gain.setValueAtTime(0.22, now);
    sliceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    slice.connect(sliceGain);
    sliceGain.connect(this.dest);
    slice.start(now);
    slice.stop(now + 0.05);
  }

  // 5. Ruptura vÃ­trea y desintegraciÃ³n del campo de obsidiana
  public playObsidianShatter() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Acordes de cristal resquebrajÃ¡ndose
    const frequencies = [1350, 1850, 2400, 3200];
    frequencies.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.025);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.45, now + idx * 0.025 + 0.22);

      gain.gain.setValueAtTime(0.12, now + idx * 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.025 + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.025);
      osc.stop(now + idx * 0.025 + 0.22);
    });

    // Crujido de grava vÃ­trea
    const shatterLen = 0.24;
    const buff = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * shatterLen), this.ctx.sampleRate);
    const data = buff.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.06));
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buff;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    const sgain = this.ctx.createGain();
    sgain.gain.setValueAtTime(0.25, now);
    sgain.gain.exponentialRampToValueAtTime(0.001, now + shatterLen);

    source.connect(filter);
    filter.connect(sgain);
    sgain.connect(this.dest);
    source.start(now);
    source.stop(now + shatterLen);
  }

  // =========================================================================
  // PRISIÃ“N CONDUCTORA (RAYO + HIELO + TIERRA: PILARES CRIOTÃ‰CNICOS E IMPLOSIÃ“N)
  // =========================================================================

  // 1. InvocaciÃ³n y emergencia telÃºrica-crioconductora de los pilares
  public playConductivePrisonCast(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-golpe de emergencia telÃºrica
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(isCharged ? 110 : 130, now);
    thud.frequency.exponentialRampToValueAtTime(35, now + 0.32);

    thudGain.gain.setValueAtTime(isCharged ? 0.5 : 0.4, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    thud.connect(thudGain);
    thudGain.connect(this.dest);
    thud.start(now);
    thud.stop(now + 0.32);

    // Chispazo de igniciÃ³n de alta tensiÃ³n
    const zap = this.ctx.createOscillator();
    const zapGain = this.ctx.createGain();
    zap.type = 'sawtooth';
    zap.frequency.setValueAtTime(750, now);
    zap.frequency.exponentialRampToValueAtTime(2200, now + 0.22);

    zapGain.gain.setValueAtTime(0.28, now);
    zapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    const zapFilter = this.ctx.createBiquadFilter();
    zapFilter.type = 'highpass';
    zapFilter.frequency.setValueAtTime(500, now);

    zap.connect(zapFilter);
    zapFilter.connect(zapGain);
    zapGain.connect(this.dest);
    zap.start(now);
    zap.stop(now + 0.24);

    // Resonancia de cristal gÃ©lido
    const ice = this.ctx.createOscillator();
    const iceGain = this.ctx.createGain();
    ice.type = 'sine';
    ice.frequency.setValueAtTime(1400, now + 0.05);
    ice.frequency.exponentialRampToValueAtTime(900, now + 0.3);

    iceGain.gain.setValueAtTime(0.2, now + 0.05);
    iceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    ice.connect(iceGain);
    iceGain.connect(this.dest);
    ice.start(now + 0.05);
    ice.stop(now + 0.3);
  }

  // 2. Descarga perimetral al tocar la valla de relÃ¡mpagos
  public playConductivePrisonPerimeterShock() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.07);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(3.5, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  // 3. Impacto absorbido por un pilar criotÃ©cnico
  public playConductivePrisonPillarHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Golpe sordo de roca
    const rock = this.ctx.createOscillator();
    const rGain = this.ctx.createGain();
    rock.type = 'triangle';
    rock.frequency.setValueAtTime(220, now);
    rock.frequency.exponentialRampToValueAtTime(70, now + 0.12);
    rGain.gain.setValueAtTime(0.3, now);
    rGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    rock.connect(rGain);
    rGain.connect(this.dest);
    rock.start(now);
    rock.stop(now + 0.12);

    // Resonancia de hielo quebrÃ¡ndose
    const ice = this.ctx.createOscillator();
    const iGain = this.ctx.createGain();
    ice.type = 'sine';
    ice.frequency.setValueAtTime(1800, now);
    ice.frequency.exponentialRampToValueAtTime(1100, now + 0.14);
    iGain.gain.setValueAtTime(0.18, now);
    iGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    ice.connect(iGain);
    iGain.connect(this.dest);
    ice.start(now);
    ice.stop(now + 0.14);
  }

  // 4. ImplosiÃ³n reactiva terminal y colapso de la prisiÃ³n
  public playConductivePrisonImplosion(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. TensiÃ³n de succiÃ³n hacia el centro (inward tension)
    const suck = this.ctx.createOscillator();
    const suckGain = this.ctx.createGain();
    suck.type = 'sine';
    suck.frequency.setValueAtTime(280, now);
    suck.frequency.exponentialRampToValueAtTime(950, now + 0.16);
    suckGain.gain.setValueAtTime(0.15, now);
    suckGain.gain.linearRampToValueAtTime(0.35, now + 0.16);
    suckGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    suck.connect(suckGain);
    suckGain.connect(this.dest);
    suck.start(now);
    suck.stop(now + 0.18);

    // 2. DetonaciÃ³n violenta en el epicentro (magna explosiÃ³n electro-gÃ©lida)
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'triangle';
    boom.frequency.setValueAtTime(isCharged ? 180 : 160, now + 0.16);
    boom.frequency.exponentialRampToValueAtTime(32, now + 0.16 + 0.42);

    boomGain.gain.setValueAtTime(isCharged ? 0.65 : 0.5, now + 0.16);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16 + 0.42);

    boom.connect(boomGain);
    boomGain.connect(this.dest);
    boom.start(now + 0.16);
    boom.stop(now + 0.16 + 0.42);

    // 3. Ruido de metralla de hielo y roca
    const shatLen = 0.32;
    const buff = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * shatLen), this.ctx.sampleRate);
    const data = buff.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buff;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(700, now + 0.16);

    const sGain = this.ctx.createGain();
    sGain.gain.setValueAtTime(isCharged ? 0.45 : 0.35, now + 0.16);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16 + shatLen);

    source.connect(filter);
    filter.connect(sGain);
    sGain.connect(this.dest);
    source.start(now + 0.16);
    source.stop(now + 0.16 + shatLen);
  }

  // =========================================================================
  // NÃšCLEO DE SOBRECARGA (FUEGO + RAYO + TIERRA: ARTEFACTO ESCALABLE Y SUPERNOVA)
  // =========================================================================

  // 1. Lanzamiento y anclaje del artefacto magnÃ©tico
  public playOverloadCoreDeploy(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Silbido magnÃ©tico descendente
    const whistle = this.ctx.createOscillator();
    const wGain = this.ctx.createGain();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(isCharged ? 950 : 800, now);
    whistle.frequency.exponentialRampToValueAtTime(180, now + 0.18);
    wGain.gain.setValueAtTime(0.25, now);
    wGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    whistle.connect(wGain);
    wGain.connect(this.dest);
    whistle.start(now);
    whistle.stop(now + 0.18);

    // Impacto sordo telÃºrico al anclarse
    const thud = this.ctx.createOscillator();
    const tGain = this.ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(isCharged ? 140 : 160, now + 0.15);
    thud.frequency.exponentialRampToValueAtTime(40, now + 0.35);
    tGain.gain.setValueAtTime(isCharged ? 0.45 : 0.35, now + 0.15);
    tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    thud.connect(tGain);
    tGain.connect(this.dest);
    thud.start(now + 0.15);
    thud.stop(now + 0.35);
  }

  // 2. Pulso radial periÃ³dico de daÃ±o y calor (escala con nivel 1, 2 y 3)
  public playOverloadCorePulse(level: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const baseFreq = level === 1 ? 320 : (level === 2 ? 520 : 780);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = level >= 2 ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.35, now + 0.08);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(level === 3 ? 2400 : (level === 2 ? 1500 : 900), now);

    gain.gain.setValueAtTime(level === 3 ? 0.28 : (level === 2 ? 0.22 : 0.16), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.dest);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // 3. Alarma electromagnÃ©tica al alcanzar el Nivel 3 (Masa CrÃ­tica)
  public playOverloadCoreCriticalAlarm() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const alarm = this.ctx.createOscillator();
    const aGain = this.ctx.createGain();
    alarm.type = 'sine';
    alarm.frequency.setValueAtTime(880, now);
    alarm.frequency.linearRampToValueAtTime(1320, now + 0.12);
    aGain.gain.setValueAtTime(0.2, now);
    aGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    alarm.connect(aGain);
    aGain.connect(this.dest);
    alarm.start(now);
    alarm.stop(now + 0.14);
  }

  // 4. DetonaciÃ³n masiva de supernova geolÃ³gica (escala segÃºn nivel 1, 2 o 3 y si fue cargado)
  public playOverloadCoreDetonation(level: number, isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. ImplosiÃ³n previa instantÃ¡nea (80ms)
    const suck = this.ctx.createOscillator();
    const suckGain = this.ctx.createGain();
    suck.type = 'sine';
    suck.frequency.setValueAtTime(140, now);
    suck.frequency.exponentialRampToValueAtTime(800, now + 0.08);
    suckGain.gain.setValueAtTime(0.2, now);
    suckGain.gain.linearRampToValueAtTime(0.35, now + 0.08);
    suckGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    suck.connect(suckGain);
    suckGain.connect(this.dest);
    suck.start(now);
    suck.stop(now + 0.09);

    // 2. Estallido sÃ­smico colosal (detonaciÃ³n de magma y relÃ¡mpago)
    const boomStart = now + 0.08;
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'triangle';
    const startFreq = level === 3 ? 200 : (level === 2 ? 160 : 130);
    boom.frequency.setValueAtTime(startFreq, boomStart);
    boom.frequency.exponentialRampToValueAtTime(28, boomStart + 0.45);

    const mult = level === 3 ? 0.75 : (level === 2 ? 0.58 : 0.42);
    boomGain.gain.setValueAtTime(isCharged ? mult * 1.15 : mult, boomStart);
    boomGain.gain.exponentialRampToValueAtTime(0.001, boomStart + 0.45);

    boom.connect(boomGain);
    boomGain.connect(this.dest);
    boom.start(boomStart);
    boom.stop(boomStart + 0.45);

    // 3. Crack voltaico de plasma
    const snapLen = level === 3 ? 0.35 : 0.22;
    const snapBuff = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * snapLen), this.ctx.sampleRate);
    const sd = snapBuff.getChannelData(0);
    for (let i = 0; i < sd.length; i++) {
      sd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.07));
    }
    const snapSource = this.ctx.createBufferSource();
    snapSource.buffer = snapBuff;
    const snapFilter = this.ctx.createBiquadFilter();
    snapFilter.type = 'bandpass';
    snapFilter.frequency.setValueAtTime(1400, boomStart);

    const snapGain = this.ctx.createGain();
    snapGain.gain.setValueAtTime(level === 3 ? 0.45 : 0.3, boomStart);
    snapGain.gain.exponentialRampToValueAtTime(0.001, boomStart + snapLen);

    snapSource.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(this.dest);
    snapSource.start(boomStart);
    snapSource.stop(boomStart + snapLen);
  }

  // =========================================================================
  // SONIDOS DE TORMENTA DE PLASMA GLACIAL (FUEGO + RAYO + HIELO - ðŸŒªï¸â„ï¸âš¡)
  // =========================================================================

  // 1. Lanzamiento del vÃ³rtice tri-elemental (Fuego, Hielo y Rayo entrelazados)
  public playGlacialPlasmaStormLaunch(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // A. Silbido gÃ©lido de viento polar
    const noiseLen = isCharged ? 0.35 : 0.25;
    const noiseBuff = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * noiseLen), this.ctx.sampleRate);
    const nd = noiseBuff.getChannelData(0);
    for (let i = 0; i < nd.length; i++) {
      nd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuff;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(isCharged ? 1900 : 1600, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(750, now + noiseLen);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isCharged ? 0.32 : 0.24, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.dest);
    noiseSource.start(now);
    noiseSource.stop(now + noiseLen);

    // B. VÃ³rtice de plasma Ã­gneo ardiente
    const fireOsc = this.ctx.createOscillator();
    const fireGain = this.ctx.createGain();
    fireOsc.type = 'sawtooth';
    fireOsc.frequency.setValueAtTime(isCharged ? 320 : 260, now);
    fireOsc.frequency.exponentialRampToValueAtTime(140, now + 0.3);
    const fireFilter = this.ctx.createBiquadFilter();
    fireFilter.type = 'lowpass';
    fireFilter.frequency.setValueAtTime(650, now);
    fireGain.gain.setValueAtTime(isCharged ? 0.28 : 0.2, now);
    fireGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    fireOsc.connect(fireFilter);
    fireFilter.connect(fireGain);
    fireGain.connect(this.dest);
    fireOsc.start(now);
    fireOsc.stop(now + 0.3);

    // C. Arco elÃ©ctrico inicial de igniciÃ³n
    const zapOsc = this.ctx.createOscillator();
    const zapGain = this.ctx.createGain();
    zapOsc.type = 'square';
    zapOsc.frequency.setValueAtTime(isCharged ? 980 : 820, now);
    zapOsc.frequency.exponentialRampToValueAtTime(340, now + 0.15);
    zapGain.gain.setValueAtTime(isCharged ? 0.22 : 0.16, now);
    zapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    zapOsc.connect(zapGain);
    zapGain.connect(this.dest);
    zapOsc.start(now);
    zapOsc.stop(now + 0.15);
  }

  // 2. Chispazo / arco elÃ©ctrico entre objetivos encadenados en trÃ¡nsito
  public playGlacialPlasmaArcZap() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const zap = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    zap.type = 'sawtooth';
    zap.frequency.setValueAtTime(1200 + Math.random() * 300, now);
    zap.frequency.exponentialRampToValueAtTime(450, now + 0.05);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    zap.connect(gain);
    gain.connect(this.dest);
    zap.start(now);
    zap.stop(now + 0.05);
  }

  // 3. ImplosiÃ³n de vacÃ­o gravitatorio (succiÃ³n violenta hacia el centro)
  public playGlacialPlasmaImplosion(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Descenso gravitatorio inverso
    const suck = this.ctx.createOscillator();
    const suckGain = this.ctx.createGain();
    suck.type = 'sine';
    suck.frequency.setValueAtTime(isCharged ? 580 : 480, now);
    suck.frequency.exponentialRampToValueAtTime(60, now + 0.18);

    suckGain.gain.setValueAtTime(0.08, now);
    suckGain.gain.linearRampToValueAtTime(isCharged ? 0.45 : 0.35, now + 0.15);
    suckGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

    suck.connect(suckGain);
    suckGain.connect(this.dest);
    suck.start(now);
    suck.stop(now + 0.19);
  }

  // 4. DetonaciÃ³n expansiva y remate centrÃ­fugo (estallido tÃ©rmico + dispersiÃ³n gÃ©lida)
  public playGlacialPlasmaDetonation(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // A. Sub-bass tÃ©rmico masivo
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'triangle';
    boom.frequency.setValueAtTime(isCharged ? 180 : 150, now);
    boom.frequency.exponentialRampToValueAtTime(32, now + 0.38);

    boomGain.gain.setValueAtTime(isCharged ? 0.65 : 0.48, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    boom.connect(boomGain);
    boomGain.connect(this.dest);
    boom.start(now);
    boom.stop(now + 0.38);

    // B. Crujido de estallido de hielo y escarcha
    const shatter = this.ctx.createOscillator();
    const shatterGain = this.ctx.createGain();
    shatter.type = 'sawtooth';
    shatter.frequency.setValueAtTime(isCharged ? 2800 : 2300, now);
    shatter.frequency.exponentialRampToValueAtTime(520, now + 0.26);

    const shatterFilter = this.ctx.createBiquadFilter();
    shatterFilter.type = 'bandpass';
    shatterFilter.frequency.setValueAtTime(2200, now);

    shatterGain.gain.setValueAtTime(isCharged ? 0.35 : 0.25, now);
    shatterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    shatter.connect(shatterFilter);
    shatterFilter.connect(shatterGain);
    shatterGain.connect(this.dest);
    shatter.start(now);
    shatter.stop(now + 0.26);
  }

  // =========================================================================
  // CATACLISMO ELEMENTAL (FUEGO + RAYO + HIELO + TIERRA: SECUENCIA DE 4 FASES)
  // =========================================================================

  // 0. ConjuraciÃ³n Inicial (SintonÃ­a Tetra-Elemental)
  public playCataclysmCast(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Acorde tetra-elemental armonizado
    const freqs = [110, 220, 330, 440];
    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(f * 1.05, now + 0.35);

      gain.gain.setValueAtTime(isCharged ? 0.12 : 0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.dest);
      osc.start(now);
      osc.stop(now + 0.38);
    });
  }

  // 1. Fase 1: Fisura TectÃ³nica (Tierra - Estruendo sÃ­smico sordo y fractura)
  public playCataclysmPhase1Earth(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-bajo sÃ­smico de fractura
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(isCharged ? 65 : 55, now);
    sub.frequency.exponentialRampToValueAtTime(20, now + 0.55);

    subGain.gain.setValueAtTime(isCharged ? 0.6 : 0.45, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    sub.connect(subGain);
    subGain.connect(this.dest);
    sub.start(now);
    sub.stop(now + 0.55);

    // Crujido tectÃ³nico de placas rocosas
    const crack = this.ctx.createOscillator();
    const crackGain = this.ctx.createGain();
    crack.type = 'triangle';
    crack.frequency.setValueAtTime(isCharged ? 140 : 110, now);
    crack.frequency.exponentialRampToValueAtTime(35, now + 0.45);

    crackGain.gain.setValueAtTime(isCharged ? 0.35 : 0.25, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    crack.connect(crackGain);
    crackGain.connect(this.dest);
    crack.start(now);
    crack.stop(now + 0.45);
  }

  // 2. Fase 2: ErupciÃ³n Ãgnea (Fuego - Columnas de magma rugiente)
  public playCataclysmPhase2Fire(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Rugido de magma presurizado
    const roar = this.ctx.createOscillator();
    const roarGain = this.ctx.createGain();
    roar.type = 'sawtooth';
    roar.frequency.setValueAtTime(80, now);
    roar.frequency.linearRampToValueAtTime(isCharged ? 220 : 180, now + 0.25);
    roar.frequency.exponentialRampToValueAtTime(45, now + 0.55);

    const roarFilter = this.ctx.createBiquadFilter();
    roarFilter.type = 'lowpass';
    roarFilter.frequency.setValueAtTime(isCharged ? 480 : 380, now);

    roarGain.gain.setValueAtTime(isCharged ? 0.5 : 0.38, now);
    roarGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    roar.connect(roarFilter);
    roarFilter.connect(roarGain);
    roarGain.connect(this.dest);
    roar.start(now);
    roar.stop(now + 0.55);
  }

  // 3. Fase 3: Onda Polar de Cero Absoluto (Hielo - CongelaciÃ³n instantÃ¡nea y caÃ­da acÃºstica)
  public playCataclysmPhase3Ice(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Ping cristalino agudo de congelaciÃ³n absoluta
    const ping = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    ping.type = 'sine';
    ping.frequency.setValueAtTime(isCharged ? 3200 : 2600, now);
    ping.frequency.exponentialRampToValueAtTime(620, now + 0.35);

    pingGain.gain.setValueAtTime(isCharged ? 0.4 : 0.3, now);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    ping.connect(pingGain);
    pingGain.connect(this.dest);
    ping.start(now);
    ping.stop(now + 0.35);

    // Hiss de vapor polar y escarcha
    const chill = this.ctx.createOscillator();
    const chillGain = this.ctx.createGain();
    chill.type = 'triangle';
    chill.frequency.setValueAtTime(isCharged ? 1800 : 1400, now);
    chill.frequency.linearRampToValueAtTime(300, now + 0.45);

    chillGain.gain.setValueAtTime(isCharged ? 0.22 : 0.16, now);
    chillGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    chill.connect(chillGain);
    chillGain.connect(this.dest);
    chill.start(now);
    chill.stop(now + 0.45);
  }

  // 4. Fase 4: RelÃ¡mpago TitÃ¡nico y DetonaciÃ³n Radial (Rayo - Trueno colosal y shatter)
  public playCataclysmPhase4Lightning(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // A. Azote del rayo celeste vertical (transiente de alta energÃ­a)
    const bolt = this.ctx.createOscillator();
    const boltGain = this.ctx.createGain();
    bolt.type = 'sawtooth';
    bolt.frequency.setValueAtTime(isCharged ? 1600 : 1200, now);
    bolt.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    boltGain.gain.setValueAtTime(isCharged ? 0.75 : 0.55, now);
    boltGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    bolt.connect(boltGain);
    boltGain.connect(this.dest);
    bolt.start(now);
    bolt.stop(now + 0.22);

    // B. ExplosiÃ³n sub-bajo devastadora (sub-bass 35Hz que sacude la arena)
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'triangle';
    boom.frequency.setValueAtTime(isCharged ? 120 : 95, now);
    boom.frequency.exponentialRampToValueAtTime(24, now + 0.75);

    boomGain.gain.setValueAtTime(isCharged ? 0.85 : 0.65, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    boom.connect(boomGain);
    boomGain.connect(this.dest);
    boom.start(now);
    boom.stop(now + 0.75);

    // C. Shatter de cristales y rocas sobrecargadas
    const shatter = this.ctx.createOscillator();
    const shatterGain = this.ctx.createGain();
    shatter.type = 'square';
    shatter.frequency.setValueAtTime(isCharged ? 2400 : 1900, now + 0.05);
    shatter.frequency.exponentialRampToValueAtTime(320, now + 0.35);

    const shatterFilter = this.ctx.createBiquadFilter();
    shatterFilter.type = 'bandpass';
    shatterFilter.frequency.setValueAtTime(1800, now + 0.05);

    shatterGain.gain.setValueAtTime(isCharged ? 0.32 : 0.22, now + 0.05);
    shatterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    shatter.connect(shatterFilter);
    shatterFilter.connect(shatterGain);
    shatterGain.connect(this.dest);
    shatter.start(now + 0.05);
    shatter.stop(now + 0.35);
  }
}

export const elementalSound = new ElementalSoundEngine();


