// Sintetizador Web Audio API Procedural de Alta Fidelidad para Magia Elemental

class ElementalSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  // Toque táctil al seleccionar un elemento
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Hechizo Básico / Chispa
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Fuego Puro / Proyectil Ígneo
  public playFireShot() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.22);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Rayo Puro / Descarga Voltaica
  public playLightningBolt() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.16);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Hielo Puro / Fragmento Glacial
  public playIceShard() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.18);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Tierra Pura / Peñasco
  public playEarthToss() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // 1. Choque Térmico (Explosión + Siseo de Vapor)
  public playThermalShock() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Golpe sónico grave
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
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
    steamGain.connect(this.ctx.destination);
    steam.start(now + 0.05);
    steam.stop(now + 0.35);
  }

  // 2. Erupción de Magma (Fisura Subterránea)
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // 3. Campo de Cristales Energizados (Resonancia Eléctrica)
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

  // 4. Tormenta Criogénica
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  // 5. Prisión de Permafrost
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  // 6. Sobrecarga Explosiva (Detonación de Plasma)
  public playExplosiveOverload() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.38);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  // CATACLISMO ELEMENTAL (Supremo)
  public playCataclysm() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Ráfaga armónica descendente
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

  // Daño al enemigo
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Daño al jugador
  public playPlayerHurt() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
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
    gain.connect(this.ctx.destination);
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Ruptura de Permafrost (Fragmentos de Hielo y Roca)
  public playPermafrostShatter() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Crujido de alta frecuencia
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(950, now);
    osc1.frequency.exponentialRampToValueAtTime(180, now + 0.22);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.22);

    // Golpe de roca sordo
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(140, now + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(50, now + 0.3);
    gain2.gain.setValueAtTime(0.28, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.3);
  }

  // Aliento de Fuego del Dragón
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.65);
  }

  // Esquiva Rápida (Dash / Glide)
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Inicio de Carga de Hechizo
  public playChargeStart() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.35);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Hechizo Totalmente Cargado (Campana / Resonancia Mágica)
  public playChargeReady() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Tono alto armónico brillante
    [659.25, 987.77].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.18, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.28);
    });
  }

  // Explosión de Área / Detonación Contundente
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  // GESTIÓN DE SONIDO CONTINUO PARA ATAQUES CANALIZADOS (FUEGO Y HIELO)
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
      // Silbido criogénico de ventisca y zumbido helado
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

    this.streamGain.connect(this.ctx.destination);
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

  // Golpe periódico de daño del chorro
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // --- CORONA INFERNAL (FUEGO + FUEGO) ---

  // 1. Fase A: Ignición y acumulación de energía ígnea
  public playInfernalCrownIgnition() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.35);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.linearRampToValueAtTime(800, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  // 2. Fase B: Expansión violenta de la onda de fuego
  public playInfernalCrownExpand() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.38);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // 3. Fase D: Detonación Final Contundente (Impacto con sub-graves masivos)
  public playInfernalCrownDetonation() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-bajo sísmico profundo
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(95, now);
    subOsc.frequency.exponentialRampToValueAtTime(24, now + 0.55);

    subGain.gain.setValueAtTime(0.48, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.55);

    // Onda de choque explosiva
    const blastOsc = this.ctx.createOscillator();
    const blastGain = this.ctx.createGain();
    blastOsc.type = 'triangle';
    blastOsc.frequency.setValueAtTime(160, now);
    blastOsc.frequency.exponentialRampToValueAtTime(45, now + 0.42);

    blastGain.gain.setValueAtTime(0.38, now);
    blastGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    blastOsc.connect(blastGain);
    blastGain.connect(this.ctx.destination);
    blastOsc.start(now);
    blastOsc.stop(now + 0.42);
  }

  // --- SOBRECARGA VOLTAICA (RAYO + RAYO) ---

  // 1. Zumbido progresivo de acumulación eléctrica
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
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // 2. Resonancia y chispazo de Carga Máxima alcanzada
  public playVoltaicMaxChargeReady() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Tono armónico agudo de sobrecarga
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.18);
    gain1.gain.setValueAtTime(0.24, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.22);

    // Chispazo de arco estático
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1250, now);
    osc2.frequency.linearRampToValueAtTime(380, now + 0.12);
    gain2.gain.setValueAtTime(0.18, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.12);
  }

  // 3. Liberación de la descarga principal
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
    gain.connect(this.ctx.destination);
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
    // Escala ascendente para dar sensación de salto encadenado rápido
    const baseFreq = 650 + (jumpIndex % 6) * 120;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // 5. Trueno colosal celestial (Impacto de carga máxima y remate final)
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
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.45);

    // Chasis de distorsión eléctrica
    const crackOsc = this.ctx.createOscillator();
    const crackGain = this.ctx.createGain();
    crackOsc.type = 'sawtooth';
    crackOsc.frequency.setValueAtTime(750, now);
    crackOsc.frequency.exponentialRampToValueAtTime(90, now + 0.35);
    crackGain.gain.setValueAtTime(0.3, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    crackOsc.connect(crackGain);
    crackGain.connect(this.ctx.destination);
    crackOsc.start(now);
    crackOsc.stop(now + 0.35);
  }

  // ==========================================
  // ERUPCIÓN GLACIAL (HIELO + HIELO)
  // ==========================================

  // 1. Invocación / Desate de la falla glacial
  public playGlacialEruptionCast(isCharged: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Rugido subterráneo de permafrost fracturado
    const rumbleOsc = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumbleOsc.type = 'triangle';
    rumbleOsc.frequency.setValueAtTime(isCharged ? 95 : 120, now);
    rumbleOsc.frequency.exponentialRampToValueAtTime(35, now + 0.38);

    rumbleGain.gain.setValueAtTime(isCharged ? 0.35 : 0.25, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    rumbleOsc.connect(rumbleGain);
    rumbleGain.connect(this.ctx.destination);
    rumbleOsc.start(now);
    rumbleOsc.stop(now + 0.38);

    // Silbido de viento polar gélido
    const windOsc = this.ctx.createOscillator();
    const windGain = this.ctx.createGain();
    windOsc.type = 'sine';
    windOsc.frequency.setValueAtTime(420, now);
    windOsc.frequency.linearRampToValueAtTime(880, now + 0.12);
    windOsc.frequency.exponentialRampToValueAtTime(260, now + 0.3);

    windGain.gain.setValueAtTime(0.18, now);
    windGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    windOsc.connect(windGain);
    windGain.connect(this.ctx.destination);
    windOsc.start(now);
    windOsc.stop(now + 0.3);
  }

  // 2. Ruptura y emersión de cada púa de hielo gigante (escalonado)
  public playGlacialSpikeErupt(index: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Golpe sordo de tierra rompiéndose
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(160 - Math.min(60, index * 8), now);
    thudOsc.frequency.exponentialRampToValueAtTime(40, now + 0.14);

    thudGain.gain.setValueAtTime(0.24, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    thudOsc.connect(thudGain);
    thudGain.connect(this.ctx.destination);
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
    crystalGain.connect(this.ctx.destination);
    crystalOsc.start(now);
    crystalOsc.stop(now + 0.12);
  }

  // 3. Impacto de congelación instantánea (bloque de hielo sólido)
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
    snapGain.connect(this.ctx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + 0.16);
  }

  // 4. Estallido y fragmentación de las púas glaciales (Shatter final)
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
  // PUÑO TECTÓNICO (TIERRA + TIERRA)
  // ==========================================

  // 1. Advertencia y rugido sísmico subterráneo
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  // 2. Emergencia violenta y golpe ascendente (Uppercut telúrico)
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
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.35);

    // Ruptura de roca sólida y empuje ascendente
    const crackOsc = this.ctx.createOscillator();
    const crackGain = this.ctx.createGain();
    crackOsc.type = 'square';
    crackOsc.frequency.setValueAtTime(260, now);
    crackOsc.frequency.exponentialRampToValueAtTime(65, now + 0.22);

    crackGain.gain.setValueAtTime(isCharged ? 0.28 : 0.2, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    crackOsc.connect(crackGain);
    crackGain.connect(this.ctx.destination);
    crackOsc.start(now);
    crackOsc.stop(now + 0.22);
  }

  // 3. Colapso del puño en escombros (Ápice y desprendimiento)
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // ==========================================
  // RAYO CRIOGÉNICO (HIELO + RAYO)
  // ==========================================

  // 1. Disparo / Ignición del haz plasma-gélido
  public playCryoBeamStart(isCharged: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Chispa eléctrica inicial aguda
    const oscZ = this.ctx.createOscillator();
    const gainZ = this.ctx.createGain();
    oscZ.type = 'sawtooth';
    oscZ.frequency.setValueAtTime(isCharged ? 920 : 740, now);
    oscZ.frequency.exponentialRampToValueAtTime(140, now + 0.16);

    gainZ.gain.setValueAtTime(isCharged ? 0.32 : 0.22, now);
    gainZ.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    oscZ.connect(gainZ);
    gainZ.connect(this.ctx.destination);
    oscZ.start(now);
    oscZ.stop(now + 0.16);

    // Silbido gélido de viento polar
    const oscW = this.ctx.createOscillator();
    const gainW = this.ctx.createGain();
    oscW.type = 'sine';
    oscW.frequency.setValueAtTime(isCharged ? 1100 : 880, now);
    oscW.frequency.linearRampToValueAtTime(440, now + 0.2);

    gainW.gain.setValueAtTime(0.18, now);
    gainW.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    oscW.connect(gainW);
    gainW.connect(this.ctx.destination);
    oscW.start(now);
    oscW.stop(now + 0.2);
  }

  // 2. Pulso / Zumbido continuo durante la emisión (hielo + plasma voltaico)
  public playCryoBeamHum(isCharged: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Zumbido eléctrico
    const oscE = this.ctx.createOscillator();
    const gainE = this.ctx.createGain();
    oscE.type = 'sawtooth';
    oscE.frequency.setValueAtTime(isCharged ? 480 : 360, now);
    oscE.frequency.linearRampToValueAtTime(isCharged ? 520 : 400, now + 0.08);

    gainE.gain.setValueAtTime(isCharged ? 0.16 : 0.11, now);
    gainE.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    oscE.connect(gainE);
    gainE.connect(this.ctx.destination);
    oscE.start(now);
    oscE.stop(now + 0.09);

    // Resonancia de cristal gélido
    const oscI = this.ctx.createOscillator();
    const gainI = this.ctx.createGain();
    oscI.type = 'triangle';
    oscI.frequency.setValueAtTime(isCharged ? 880 : 720, now);
    oscI.frequency.exponentialRampToValueAtTime(320, now + 0.08);

    gainI.gain.setValueAtTime(0.12, now);
    gainI.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    oscI.connect(gainI);
    gainI.connect(this.ctx.destination);
    oscI.start(now);
    oscI.stop(now + 0.08);
  }

  // 3. Salto de arco eléctrico a enemigo adyacente
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  // 4. Detención y disipación del haz
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }
}

export const elementalSound = new ElementalSoundEngine();

