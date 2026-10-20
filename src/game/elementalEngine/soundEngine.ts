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

  // Ruptura de Permafrost (Fragmentos de Hielo y Roca - Delegación)
  public playLegacyPermafrostShatter() {
    this.playPermafrostShatter(false);
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);

    // Tintineo de cristal gélido
    const iceOsc = this.ctx.createOscillator();
    const iceGain = this.ctx.createGain();
    iceOsc.type = 'sine';
    iceOsc.frequency.setValueAtTime(900 + Math.random() * 400, now);
    iceGain.gain.setValueAtTime(0.06, now);
    iceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    iceOsc.connect(iceGain);
    iceGain.connect(this.ctx.destination);
    iceOsc.start(now);
    iceOsc.stop(now + 0.08);
  }

  // Éxito al 100% del Puzle de la Rueda (Acorde triunfal de cristales de hielo)
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
      gain.connect(this.ctx.destination);
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);

    // Chirrido metálico de rejas
    const metalOsc = this.ctx.createOscillator();
    const metalGain = this.ctx.createGain();
    metalOsc.type = 'sawtooth';
    metalOsc.frequency.setValueAtTime(320, now + 0.05);
    metalOsc.frequency.linearRampToValueAtTime(180, now + 0.55);
    metalGain.gain.setValueAtTime(0.12, now + 0.05);
    metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    metalOsc.connect(metalGain);
    metalGain.connect(this.ctx.destination);
    metalOsc.start(now + 0.05);
    metalOsc.stop(now + 0.55);
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

  // =========================================================================
  // BOMBARDEO VOLCÁNICO (FUEGO + TIERRA: RUGIDO SUBTERRÁNEO, COLUMNAS Y BOMBAS)
  // =========================================================================

  // 1. Rugido sísmico y fractura magmática subterránea
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);

    // Segundo oscilador con modulación de vibración para emular crujido de tierra
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
    gain2.connect(this.ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.30);
  }

  // 2. Erupción violenta de columna de magma y géiser de fuego
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
    gain.connect(this.ctx.destination);
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
    noiseGain.connect(this.ctx.destination);
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);

    // Pequeño chisporroteo viscoso
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
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.12);
  }

  // =========================================================================
  // VÓRTICE DE CHOQUE TÉRMICO (FUEGO + HIELO: EXPANSIÓN DE VAPOR Y DETONACIÓN)
  // =========================================================================

  // 1. Expansión explosiva de la onda de vapor y choque térmico
  public playThermalShockBlast(isCharged: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // A. Golpe sónico grave de descompresión
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isCharged ? 160 : 130, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.32);

    gain.gain.setValueAtTime(isCharged ? 0.38 : 0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);

    // B. Ráfaga expansiva de vapor sibilante a alta presión (White noise con bandpass dinámico)
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
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.34);
  }

  // 2. Fractura reactiva y detonación crítica sobre enemigo congelado
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
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);

    // Detonación sónica por vaporización súbita interna
    const pop = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    pop.type = 'sine';
    pop.frequency.setValueAtTime(260, now);
    pop.frequency.exponentialRampToValueAtTime(65, now + 0.15);

    popGain.gain.setValueAtTime(0.26, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    pop.connect(popGain);
    popGain.connect(this.ctx.destination);
    pop.start(now);
    pop.stop(now + 0.15);
  }

  // =========================================================================
  // JAULA DE PILARES CONDUCTORES (RAYO + TIERRA)
  // =========================================================================

  // 1. Erupción telúrica de monolitos conductores y activación de cuarzo resonante
  public playConductivePillarErupt(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-golpe telúrico de impacto en el suelo
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(isCharged ? 130 : 160, now);
    thud.frequency.exponentialRampToValueAtTime(35, now + 0.28);

    thudGain.gain.setValueAtTime(isCharged ? 0.42 : 0.32, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    thud.connect(thudGain);
    thudGain.connect(this.ctx.destination);
    thud.start(now);
    thud.stop(now + 0.28);

    // Resonancia de cuarzo piezoeléctrico escalonada
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

  // 2. Chispazo / descarga de alta tensión al cruzar la valla electrificada
  public playConductiveFenceZap() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Chispa rápida cortante tipo taser/arco voltaico
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(980, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.09);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // 3. Implosión final de sobrecarga y colapso gravitatorio/eléctrico
  public playConductiveCageImplosion(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Descenso y compresión rápida de frecuencia inward
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(isCharged ? 320 : 260, now);
    subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.26);

    subGain.gain.setValueAtTime(isCharged ? 0.5 : 0.38, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.26);

    // Crujido eléctrico y fractura de roca en el instante del colapso
    const crack = this.ctx.createOscillator();
    const crackGain = this.ctx.createGain();
    crack.type = 'sawtooth';
    crack.frequency.setValueAtTime(isCharged ? 1100 : 850, now + 0.04);
    crack.frequency.exponentialRampToValueAtTime(80, now + 0.22);

    crackGain.gain.setValueAtTime(isCharged ? 0.35 : 0.25, now + 0.04);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    crack.connect(crackGain);
    crackGain.connect(this.ctx.destination);
    crack.start(now + 0.04);
    crack.stop(now + 0.22);
  }

  // =========================================================================
  // PRISIÓN DE PERMAFROST (HIELO + TIERRA)
  // =========================================================================

  // 1. Erupción telúrica de monolitos y cristalización de permafrost
  public playPermafrostErupt(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-golpe sísmico de emergencia de roca
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(isCharged ? 110 : 140, now);
    thud.frequency.exponentialRampToValueAtTime(30, now + 0.26);

    thudGain.gain.setValueAtTime(isCharged ? 0.38 : 0.28, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    thud.connect(thudGain);
    thudGain.connect(this.ctx.destination);
    thud.start(now);
    thud.stop(now + 0.26);

    // Crujido agudo de congelación y permafrost
    const iceCrack = this.ctx.createOscillator();
    const iceGain = this.ctx.createGain();
    iceCrack.type = 'sawtooth';
    iceCrack.frequency.setValueAtTime(isCharged ? 1150 : 920, now);
    iceCrack.frequency.exponentialRampToValueAtTime(340, now + 0.2);

    iceGain.gain.setValueAtTime(isCharged ? 0.25 : 0.18, now);
    iceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    iceCrack.connect(iceGain);
    iceGain.connect(this.ctx.destination);
    iceCrack.start(now);
    iceCrack.stop(now + 0.2);
  }

  // 2. Bloqueo e interceptación de proyectil contra el permafrost
  public playPermafrostBlock() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Golpe sordo de absorción
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
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
    chinkGain.connect(this.ctx.destination);
    chink.start(now);
    chink.stop(now + 0.08);
  }

  // 3. Fragmentación explosiva y detonación de metralla de hielo y roca
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
    shatterGain.connect(this.ctx.destination);
    shatter.start(now);
    shatter.stop(now + 0.22);

    // Onda sónica de choque telúrica
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(isCharged ? 220 : 180, now);
    boom.frequency.exponentialRampToValueAtTime(35, now + 0.25);

    boomGain.gain.setValueAtTime(isCharged ? 0.45 : 0.32, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    boom.connect(boomGain);
    boomGain.connect(this.ctx.destination);
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

    // Rugido de vórtice ígneo de aire caliente
    const whoosh = this.ctx.createOscillator();
    const whooshGain = this.ctx.createGain();
    whoosh.type = 'sawtooth';
    whoosh.frequency.setValueAtTime(isCharged ? 380 : 310, now);
    whoosh.frequency.exponentialRampToValueAtTime(140, now + 0.35);

    whooshGain.gain.setValueAtTime(isCharged ? 0.36 : 0.26, now);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    whoosh.connect(whooshGain);
    whooshGain.connect(this.ctx.destination);
    whoosh.start(now);
    whoosh.stop(now + 0.35);

    // Zumbido eléctrico de alta frecuencia de plasma
    const zap = this.ctx.createOscillator();
    const zapGain = this.ctx.createGain();
    zap.type = 'sawtooth';
    zap.frequency.setValueAtTime(isCharged ? 880 : 720, now);
    zap.frequency.linearRampToValueAtTime(isCharged ? 1240 : 1050, now + 0.28);

    zapGain.gain.setValueAtTime(isCharged ? 0.2 : 0.14, now);
    zapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    zap.connect(zapGain);
    zapGain.connect(this.ctx.destination);
    zap.start(now);
    zap.stop(now + 0.28);
  }

  // 2. Ionización y desintegración de proyectiles hostiles absorbidos
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
    gain.connect(this.ctx.destination);
    zap.start(now);
    zap.stop(now + 0.09);
  }

  // 3. Implosión y detonación terminal masiva de plasma
  public playPlasmaTornadoDetonate(isCharged: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-bajo de implosión y compresión térmica
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(isCharged ? 280 : 220, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.3);

    subGain.gain.setValueAtTime(isCharged ? 0.52 : 0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.3);

    // Explosión de plasma de alta tensión
    const blast = this.ctx.createOscillator();
    const blastGain = this.ctx.createGain();
    blast.type = 'sawtooth';
    blast.frequency.setValueAtTime(isCharged ? 1150 : 880, now + 0.03);
    blast.frequency.exponentialRampToValueAtTime(65, now + 0.28);

    blastGain.gain.setValueAtTime(isCharged ? 0.42 : 0.3, now + 0.03);
    blastGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    blast.connect(blastGain);
    blastGain.connect(this.ctx.destination);
    blast.start(now + 0.03);
    blast.stop(now + 0.28);
  }
}

export const elementalSound = new ElementalSoundEngine();

