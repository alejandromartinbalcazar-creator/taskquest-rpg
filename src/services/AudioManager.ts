// Procedural Web Audio API Sound Engine (0 KB External Assets)
// High-fidelity real-time mathematical synthesis for TaskQuest RPG

export type AmbientMood = 'exploration' | 'boss' | 'peaceful' | 'none';

interface AmbientLayerState {
  sequenceTimer?: number | ReturnType<typeof setInterval>;
  stepIndex?: number;
  padOsc1?: OscillatorNode;
  padOsc2?: OscillatorNode;
  padFilter?: BiquadFilterNode;
  padGain?: GainNode;
  padLfo?: OscillatorNode;
  padLfoGain?: GainNode;

  droneOsc1?: OscillatorNode;
  droneOsc2?: OscillatorNode;
  droneFilter?: BiquadFilterNode;
  droneGain?: GainNode;
  droneLfo?: OscillatorNode;
  droneLfoGain?: GainNode;

  windSource?: AudioBufferSourceNode;
  windFilter?: BiquadFilterNode;
  windGain?: GainNode;
  windLfo?: OscillatorNode;
  windLfoGain?: GainNode;

  chimeTimer?: number | ReturnType<typeof setInterval>;
}

export class AudioManager {
  private static instance: AudioManager | null = null;

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;

  // Pre-computed noise buffers for zero-latency burst synthesis
  private whiteNoiseBuffer: AudioBuffer | null = null;
  private pinkNoiseBuffer: AudioBuffer | null = null;

  // Volume & State persistence
  private masterVolume: number = 0.8;
  private sfxVolume: number = 0.8;
  private ambientVolume: number = 0.5;
  private muted: boolean = false;

  // Active Hold/Charge Sound Nodes
  private chargeOsc: OscillatorNode | null = null;
  private chargeLfo: OscillatorNode | null = null;
  private chargeLfoGain: GainNode | null = null;
  private chargeGain: GainNode | null = null;
  private isCharging: boolean = false;

  // Ambient Generator State
  private currentAmbientMood: AmbientMood = 'none';
  private ambientState: AmbientLayerState = {};
  private autoplayListenersBound: boolean = false;

  private constructor() {
    this.loadSettings();
    if (typeof window !== 'undefined') {
      this.bindAutoplayUnlock();
    }
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // ==========================================
  // CONTEXT & AUTOPLAY POLICY MANAGEMENT
  // ==========================================

  private loadSettings(): void {
    if (typeof window === 'undefined') return;
    try {
      const storedMuted = localStorage.getItem('taskquest_audio_muted');
      if (storedMuted !== null) {
        this.muted = storedMuted === 'true';
      }
      const storedMaster = localStorage.getItem('taskquest_audio_master_vol');
      if (storedMaster !== null) {
        this.masterVolume = Math.max(0, Math.min(1, parseFloat(storedMaster)));
      }
      const storedSfx = localStorage.getItem('taskquest_audio_sfx_vol');
      if (storedSfx !== null) {
        this.sfxVolume = Math.max(0, Math.min(1, parseFloat(storedSfx)));
      }
      const storedAmbient = localStorage.getItem('taskquest_audio_ambient_vol');
      if (storedAmbient !== null) {
        this.ambientVolume = Math.max(0, Math.min(1, parseFloat(storedAmbient)));
      }
    } catch {
      // Fallback to default in restricted localStorage environments
    }
  }

  private saveSettings(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('taskquest_audio_muted', String(this.muted));
      localStorage.setItem('taskquest_audio_master_vol', String(this.masterVolume));
      localStorage.setItem('taskquest_audio_sfx_vol', String(this.sfxVolume));
      localStorage.setItem('taskquest_audio_ambient_vol', String(this.ambientVolume));
    } catch {
      // Ignore storage errors
    }
  }

  private bindAutoplayUnlock(): void {
    if (this.autoplayListenersBound || typeof window === 'undefined') return;
    this.autoplayListenersBound = true;

    const unlock = () => {
      this.ensureContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
    window.addEventListener('click', unlock, { capture: true, passive: true });
    window.addEventListener('keydown', unlock, { capture: true, passive: true });
    window.addEventListener('touchstart', unlock, { capture: true, passive: true });
  }

  public ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;

      try {
        this.ctx = new AudioCtx();
      } catch {
        return null;
      }

      // 1. Nodo Maestro
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // 2. Canal SFX
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // 3. Canal Ambiental / Música
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.ambientVolume, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      // 4. Precalcular Buffers de Ruido Blanco y Rosa (2 segundos de duración a la frecuencia del contexto)
      this.generateNoiseBuffers();
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  private generateNoiseBuffers(): void {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const duration = 2.0;
    const frameCount = Math.floor(sampleRate * duration);

    // Ruido Blanco: Distribución uniforme [-1, 1]
    const whiteBuf = this.ctx.createBuffer(1, frameCount, sampleRate);
    const whiteData = whiteBuf.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      whiteData[i] = Math.random() * 2 - 1;
    }
    this.whiteNoiseBuffer = whiteBuf;

    // Ruido Rosa: Filtrado 1/f por el algoritmo de Paul Kellet
    const pinkBuf = this.ctx.createBuffer(1, frameCount, sampleRate);
    const pinkData = pinkBuf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < frameCount; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      pinkData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12;
      b6 = white * 0.115926;
    }
    this.pinkNoiseBuffer = pinkBuf;
  }

  public getContext(): AudioContext | null {
    return this.ensureContext();
  }

  public getSfxDestination(): GainNode | null {
    this.ensureContext();
    return this.sfxGain;
  }

  public getAmbientDestination(): GainNode | null {
    this.ensureContext();
    return this.ambientGain;
  }

  // ==========================================
  // CONTROLES DE VOLUMEN Y SILENCIADO
  // ==========================================

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.saveSettings();
    if (this.masterGain && this.ctx) {
      const targetGain = this.muted ? 0 : this.masterVolume;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.05);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMasterVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.masterVolume, this.ctx.currentTime + 0.05);
    }
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxGain.gain.value, this.ctx.currentTime);
      this.sfxGain.gain.linearRampToValueAtTime(this.sfxVolume, this.ctx.currentTime + 0.05);
    }
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setAmbientVolume(vol: number): void {
    this.ambientVolume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, this.ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(this.ambientVolume, this.ctx.currentTime + 0.1);
    }
  }

  public getAmbientVolume(): number {
    return this.ambientVolume;
  }

  // ==========================================
  // GESTIÓN DE MEMORIA: LIMPIEZA DE NODOS
  // ==========================================

  /**
   * Programa la desconexión total de un grafo de audio para prevenir fugas de memoria en sesiones móviles largas.
   */
  private scheduleCleanup(durationSec: number, ...nodes: (AudioNode | null | undefined)[]): void {
    const validNodes = nodes.filter((n): n is AudioNode => !!n);
    if (validNodes.length === 0) return;

    setTimeout(() => {
      for (const node of validNodes) {
        try {
          node.disconnect();
        } catch {
          // Ignorar si ya fue desconectado
        }
      }
    }, Math.max(50, Math.floor((durationSec + 0.15) * 1000)));
  }

  // ==========================================
  // SFX: ELEMENTAL COMBAT SYNTHESIZERS
  // ==========================================

  /**
   * FUEGO (🔥):
   * Ruido blanco a través de filtro pasabanda modulado en descenso rápido (ignición/combustión)
   * + sub-bajo senoidal (80 Hz a 40 Hz) para dar impacto de combustión y soplido térmico.
   */
  public playFireShot(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const duration = 0.28;

    // 1. Soplido de combustión con ruido blanco filtrado
    let noiseSource: AudioBufferSourceNode | null = null;
    let bandpass: BiquadFilterNode | null = null;
    let noiseGain: GainNode | null = null;

    if (this.whiteNoiseBuffer) {
      noiseSource = ctx.createBufferSource();
      noiseSource.buffer = this.whiteNoiseBuffer;

      bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.Q.setValueAtTime(2.2, now);
      bandpass.frequency.setValueAtTime(850, now);
      bandpass.frequency.exponentialRampToValueAtTime(220, now + duration);

      noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.28, now + 0.02);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseSource.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noiseSource.start(now);
      noiseSource.stop(now + duration);
    }

    // 2. Golpe sub-bajo senoidal de ignición
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(85, now);
    subOsc.frequency.exponentialRampToValueAtTime(38, now + duration);

    subGain.gain.setValueAtTime(0.22, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start(now);
    subOsc.stop(now + duration);

    this.scheduleCleanup(duration, noiseSource, bandpass, noiseGain, subOsc, subGain);
  }

  /**
   * PILAR ÍGNEO (FUEGO + FUEGO) - Conjuración (Fase 1):
   * Silbido sutil de viento caliente (envolvente rápida de ruido blanco/rosa filtrado en 150 ms).
   */
  public playFirePillarConjure(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const duration = 0.18;

    if (this.whiteNoiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.whiteNoiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.Q.setValueAtTime(3.0, now);
      bandpass.frequency.setValueAtTime(450, now);
      bandpass.frequency.exponentialRampToValueAtTime(1250, now + 0.08);
      bandpass.frequency.exponentialRampToValueAtTime(350, now + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + duration);
      this.scheduleCleanup(duration, noise, bandpass, gain);
    }
  }

  /**
   * PILAR ÍGNEO (FUEGO + FUEGO) - Detonación / Erupción (Fase 2):
   * Explosión de combustión sorda (onda senoidal descendente de 110 Hz a 35 Hz + ráfaga de ruido filtrado en pasobajo).
   */
  public playFirePillarDetonation(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const duration = 0.45;

    // 1. Golpe sordo senoidal descendente (110 Hz -> 35 Hz)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

    oscGain.gain.setValueAtTime(0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration);

    // 2. Ráfaga de ruido filtrado en pasobajo para combustión pesada
    if (this.whiteNoiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.whiteNoiseBuffer;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(450, now);
      lowpass.frequency.exponentialRampToValueAtTime(95, now + duration);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.28, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(lowpass);
      lowpass.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + duration);
      this.scheduleCleanup(duration, osc, oscGain, noise, lowpass, noiseGain);
    } else {
      this.scheduleCleanup(duration, osc, oscGain);
    }
  }

  /**
   * RAYO / DESCARGA ELÉCTRICA (⚡):
   * Ráfaga corta de diente de sierra con modulación FM de alta frecuencia (1200 Hz a 150 Hz en 100 ms)
   * + modulación rápida caótica para crujido eléctrico (crackle).
   */
  public playLightningBolt(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const duration = 0.16;

    // Portadora Sawtooth
    const carrier = ctx.createOscillator();
    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(1200, now);
    carrier.frequency.exponentialRampToValueAtTime(150, now + 0.1);

    // Modulador FM para tono voltaico chillón
    const fmMod = ctx.createOscillator();
    const fmGain = ctx.createGain();
    fmMod.type = 'square';
    fmMod.frequency.setValueAtTime(85, now);
    fmGain.gain.setValueAtTime(450, now);
    fmGain.gain.exponentialRampToValueAtTime(50, now + 0.12);

    fmMod.connect(fmGain);
    fmGain.connect(carrier.frequency);

    // Filtro paso alto para eliminar frecuencias fangosas y acentuar el chasquido
    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.setValueAtTime(300, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.28, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    carrier.connect(hpFilter);
    hpFilter.connect(gainNode);
    gainNode.connect(this.sfxGain);

    fmMod.start(now);
    carrier.start(now);
    fmMod.stop(now + duration);
    carrier.stop(now + duration);

    this.scheduleCleanup(duration, carrier, fmMod, fmGain, hpFilter, gainNode);
  }

  /**
   * HIELO (❄️):
   * Dos osciladores senoidales inarmónicos (2400 Hz y 3150 Hz) con decaimiento rápido (180 ms)
   * que simulan un tintineo/chime cristalino vítreo de escarcha pura.
   */
  public playIceShard(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const duration = 0.22;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2400, now);
    osc1.frequency.exponentialRampToValueAtTime(1200, now + duration);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(3150, now);
    osc2.frequency.exponentialRampToValueAtTime(1800, now + duration);

    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    gain2.gain.setValueAtTime(0.12, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(this.sfxGain);
    gain2.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);

    this.scheduleCleanup(duration, osc1, osc2, gain1, gain2);
  }

  /**
   * TIERRA (🌍):
   * Onda triangular profunda en sub-graves (60 Hz a 25 Hz) combinada con
   * ráfaga de ruido filtrado en paso bajo (120 Hz) para simular el retumbar sísmico pétreo.
   */
  public playEarthToss(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const duration = 0.36;

    // 1. Sub-grave triangular
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(62, now);
    subOsc.frequency.exponentialRampToValueAtTime(24, now + duration);

    subGain.gain.setValueAtTime(0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + duration);

    // 2. Ruido filtrado paso bajo (retumbar de rocas / grava)
    let noiseSource: AudioBufferSourceNode | null = null;
    let lpFilter: BiquadFilterNode | null = null;
    let noiseGain: GainNode | null = null;

    if (this.whiteNoiseBuffer) {
      noiseSource = ctx.createBufferSource();
      noiseSource.buffer = this.whiteNoiseBuffer;

      lpFilter = ctx.createBiquadFilter();
      lpFilter.type = 'lowpass';
      lpFilter.frequency.setValueAtTime(130, now);
      lpFilter.frequency.exponentialRampToValueAtTime(50, now + duration);

      noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.24, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseSource.connect(lpFilter);
      lpFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noiseSource.start(now);
      noiseSource.stop(now + duration);
    }

    this.scheduleCleanup(duration, subOsc, subGain, noiseSource, lpFilter, noiseGain);
  }

  /**
   * CARGA DE HABILIDAD (HOLD):
   * Tono continuo con subida progresiva de tono (pitch rise 220 Hz a 880 Hz)
   * y trémolo/LFO acelerado que aumenta en frecuencia e intensidad (4 Hz a 24 Hz),
   * culminando en un destello acústico de liberación ("flash" agudo).
   */
  public startCharge(): void {
    if (this.muted || this.isCharging) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    this.stopCharge();
    this.isCharging = true;

    const now = ctx.currentTime;

    // Oscilador de tono base
    this.chargeOsc = ctx.createOscillator();
    this.chargeOsc.type = 'triangle';
    this.chargeOsc.frequency.setValueAtTime(220, now);

    // Ganancia principal de carga
    this.chargeGain = ctx.createGain();
    this.chargeGain.gain.setValueAtTime(0.01, now);
    this.chargeGain.gain.linearRampToValueAtTime(0.18, now + 0.1);

    // Modulador LFO para el trémolo vibrante
    this.chargeLfo = ctx.createOscillator();
    this.chargeLfo.type = 'sine';
    this.chargeLfo.frequency.setValueAtTime(4.0, now);

    this.chargeLfoGain = ctx.createGain();
    this.chargeLfoGain.gain.setValueAtTime(0.06, now);

    // Conectar LFO a la ganancia
    this.chargeLfo.connect(this.chargeLfoGain.gain);
    this.chargeOsc.connect(this.chargeGain);
    this.chargeGain.connect(this.sfxGain);

    this.chargeOsc.start(now);
    this.chargeLfo.start(now);
  }

  public updateCharge(ratio: number): void {
    if (!this.isCharging || !this.ctx || !this.chargeOsc || !this.chargeLfo || !this.chargeGain || !this.chargeLfoGain) return;
    const clamped = Math.max(0, Math.min(1.0, ratio));
    const now = this.ctx.currentTime;

    // Subida progresiva de tono: 220 Hz -> 880 Hz
    const targetFreq = 220 + clamped * 660;
    this.chargeOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);

    // Aceleración de trémolo: 4 Hz -> 26 Hz
    const lfoFreq = 4.0 + clamped * 22.0;
    this.chargeLfo.frequency.setTargetAtTime(lfoFreq, now, 0.05);

    // Mayor volumen y presencia armónica al acercarse al 100%
    const targetVol = 0.15 + clamped * 0.12;
    this.chargeGain.gain.setTargetAtTime(targetVol, now, 0.05);
  }

  public stopCharge(): void {
    if (!this.isCharging) return;
    this.isCharging = false;
    const ctx = this.ctx;
    if (ctx && this.chargeGain) {
      const now = ctx.currentTime;
      this.chargeGain.gain.setTargetAtTime(0.001, now, 0.03);
    }

    const osc = this.chargeOsc;
    const lfo = this.chargeLfo;
    const lfoGain = this.chargeLfoGain;
    const gain = this.chargeGain;

    this.chargeOsc = null;
    this.chargeLfo = null;
    this.chargeLfoGain = null;
    this.chargeGain = null;

    setTimeout(() => {
      try {
        osc?.stop();
        lfo?.stop();
        osc?.disconnect();
        lfo?.disconnect();
        lfoGain?.disconnect();
        gain?.disconnect();
      } catch {
        // Safe disconnection
      }
    }, 60);
  }

  /**
   * Destello acústico al liberar el hechizo al 100% de carga
   */
  public playChargeRelease(): void {
    this.stopCharge();
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const duration = 0.25;

    // Flash agudo cristalino
    const flashOsc = ctx.createOscillator();
    const flashGain = ctx.createGain();
    flashOsc.type = 'triangle';
    flashOsc.frequency.setValueAtTime(1320, now);
    flashOsc.frequency.exponentialRampToValueAtTime(2640, now + 0.08);

    flashGain.gain.setValueAtTime(0.28, now);
    flashGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    flashOsc.connect(flashGain);
    flashGain.connect(this.sfxGain);

    flashOsc.start(now);
    flashOsc.stop(now + duration);

    this.scheduleCleanup(duration, flashOsc, flashGain);
  }

  /**
   * IMPACTO RECIBIDO POR EL JUGADOR:
   * Thud sordo y contundente con caída de tono rápida + crujido amortiguado.
   */
  public playPlayerHurt(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const duration = 0.26;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(175, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + duration);

    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);

    this.scheduleCleanup(duration, osc, gain);
  }

  /**
   * RUPTURA DE ESCUDO DEL JEFE:
   * Shatter metálico y cristalino explosivo con resonancia armónica.
   */
  public playBossShieldBreak(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const duration = 0.65;

    // 1. Armónicos inarmónicos agudos
    const freqs = [1420, 1980, 2840, 3560];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'square' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.02);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + duration);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(4.5, now);
      filter.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.18, now + idx * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.02);
      osc.stop(now + duration);

      this.scheduleCleanup(duration, osc, filter, gain);
    });

    // 2. Ruido blanco de estallido
    if (this.whiteNoiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.whiteNoiseBuffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.32, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noise.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + 0.45);

      this.scheduleCleanup(0.45, noise, noiseGain);
    }
  }

  /**
   * MUERTE DE MONSTRUOS:
   * Disolución etérea con caída de pitch y desvanecimiento de vapor.
   */
  public playMonsterDeath(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const duration = 0.42;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + duration);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);

    this.scheduleCleanup(duration, osc, filter, gain);
  }

  // ==========================================
  // SFX: TAREAS, SISTEMA Y UI
  // ==========================================

  /**
   * TAREA COMPLETADA:
   * Arpegio mayor ascendente brillante (C5 - E5 - G5 - C6) con envolvente suave
   * y cola de decaimiento sintética simulando reverberación.
   */
  public playTaskComplete(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const baseTime = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = baseTime + idx * 0.08;
      const isLast = idx === notes.length - 1;
      const noteDuration = isLast ? 0.75 : 0.35;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.24, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(startTime);
      osc.stop(startTime + noteDuration);

      this.scheduleCleanup(idx * 0.08 + noteDuration, osc, gain);
    });
  }

  /**
   * SUBIDA DE NIVEL / HITO DEL HÉROE:
   * Fanfarria ceremonial con acordes mayores en varias voces y barrido armónico ascendente.
   */
  public playLevelUp(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const chords = [
      [392.00, 523.25], // G4, C5
      [493.88, 659.25], // B4, E5
      [587.33, 783.99], // D5, G5
      [523.25, 659.25, 1046.50], // Acorde mayor pleno C6
    ];

    const baseTime = ctx.currentTime;
    chords.forEach((chord, stepIdx) => {
      const stepTime = baseTime + stepIdx * 0.12;
      const isLast = stepIdx === chords.length - 1;
      const duration = isLast ? 0.95 : 0.28;

      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = isLast ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, stepTime);

        gain.gain.setValueAtTime(0.001, stepTime);
        gain.gain.linearRampToValueAtTime(0.22, stepTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + duration);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(stepTime);
        osc.stop(stepTime + duration);

        this.scheduleCleanup(stepIdx * 0.12 + duration, osc, gain);
      });
    });
  }

  /**
   * DESBLOQUEO DE HITO DEL HÉROE:
   * Tríada dorada ceremonial con destello de campanas.
   */
  public playMilestoneUnlock(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const chords = [392.0, 493.88, 587.33, 783.99, 987.77]; // Sol mayor expandido
    const baseTime = ctx.currentTime;

    chords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = baseTime + idx * 0.07;
      const duration = 0.55;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(startTime);
      osc.stop(startTime + duration);

      this.scheduleCleanup(idx * 0.07 + duration, osc, gain);
    });
  }

  /**
   * DELEVELING / FALLO CRÍTICO:
   * Tono descendente disonante (220 Hz a 55 Hz) con filtro saturado y crujido seco.
   */
  public playDelevelCrackSound(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const duration = 0.65;

    // Tono fúnebre disonante
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + duration);

    gain.gain.setValueAtTime(0.42, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);

    // Crujido de ruptura seco
    const crack = ctx.createOscillator();
    const crackGain = ctx.createGain();
    crack.type = 'square';
    crack.frequency.setValueAtTime(680, now);
    crack.frequency.exponentialRampToValueAtTime(110, now + 0.2);

    crackGain.gain.setValueAtTime(0.35, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    crack.connect(crackGain);
    crackGain.connect(this.sfxGain);

    crack.start(now);
    crack.stop(now + 0.22);

    this.scheduleCleanup(duration, osc, filter, gain, crack, crackGain);
  }

  /**
   * UI CLICK / INTERACTIVIDAD:
   * Pulso táctil limpio y seco (800 Hz con 30 ms).
   */
  public playUiClick(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const duration = 0.035;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(820, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + duration);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);

    this.scheduleCleanup(duration, osc, gain);
  }

  /**
   * MICRO-PASO DING:
   * Ding brillante de C5 a C6 para subtareas o toques rápidos.
   */
  public playMicroStepDing(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const duration = 0.18;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.14);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);

    this.scheduleCleanup(duration, osc, gain);
  }

  /**
   * Fanfarria triunfal ceremonial de victoria de nivel (C Major / E / G / C).
   */
  public playVictoryFanfare(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const fanfareNotes = [
      { freq: 261.63, time: 0.00, dur: 0.16 }, // C4
      { freq: 392.00, time: 0.14, dur: 0.16 }, // G4
      { freq: 523.25, time: 0.28, dur: 0.22 }, // C5
      { freq: 659.25, time: 0.44, dur: 0.22 }, // E5
      { freq: 783.99, time: 0.62, dur: 0.95 }, // G5
      { freq: 1046.50, time: 0.62, dur: 0.95 }, // C6
    ];

    fanfareNotes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0.001, now + n.time);
      gain.gain.linearRampToValueAtTime(0.22, now + n.time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur);
      this.scheduleCleanup(n.time + n.dur, osc, gain);
    });
  }

  // ==========================================
  // GENERADOR PROCEDURAL AMBIENTAL / MÚSICA DE AVENTURA HEROICA
  // ==========================================

  public getCurrentMood(): AmbientMood {
    return this.currentAmbientMood;
  }

  /**
   * Inicia o conmuta la banda sonora procedural heroica y de combate en tiempo real.
   * Cero archivos de audio: síntesis matemática pura Web Audio API a 60 FPS.
   * - Modo 'exploration': Pulso rítmico suave de marcha a 105 BPM + melodía dórica/pentatónica heroica en C4-A4.
   * - Modo 'boss': Ritmo de combate intenso a 128 BPM + arpegios diente de sierra con filtro pasobajo modulado por LFO.
   */
  public startAmbient(mood: AmbientMood = 'exploration'): void {
    if (this.currentAmbientMood === mood && (this.ambientState.sequenceTimer || this.ambientState.padOsc1)) {
      return; // Ya está activo en este modo
    }

    this.stopAmbient(true);
    if (mood === 'none') {
      this.currentAmbientMood = 'none';
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx || !this.ambientGain) return;

    this.currentAmbientMood = mood;
    const now = ctx.currentTime;
    const isBoss = mood === 'boss';

    // -------------------------------------------------------------
    // Capa 1: Pad Armónico Cálido Heroico (Reemplaza los drones tétricos)
    // -------------------------------------------------------------
    const rootFreq = isBoss ? 146.83 : 130.81; // D3 (Boss) o C3 (Exploración)
    const fifthFreq = isBoss ? 220.00 : 196.00; // A3 (Boss) o G3 (Exploración)
    const thirdFreq = isBoss ? 174.61 : 164.81; // F3 (Boss menor) o E3 (Exploración mayor)

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = isBoss ? 'sawtooth' : 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(rootFreq, now);
    osc2.frequency.setValueAtTime(isBoss ? thirdFreq : fifthFreq, now);

    // Filtro pasa-bajo musical cálido
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.Q.setValueAtTime(isBoss ? 3.5 : 1.8, now);
    padFilter.frequency.setValueAtTime(isBoss ? 480 : 520, now);

    // LFO dinámico para respiración orquestal
    const padLfo = ctx.createOscillator();
    const padLfoGain = ctx.createGain();
    padLfo.type = 'sine';
    padLfo.frequency.setValueAtTime(isBoss ? 0.35 : 0.12, now);
    padLfoGain.gain.setValueAtTime(isBoss ? 260 : 130, now);

    padLfo.connect(padLfoGain);
    padLfoGain.connect(padFilter.frequency);

    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0.001, now);
    padGain.gain.linearRampToValueAtTime(isBoss ? 0.18 : 0.14, now + 1.2);

    osc1.connect(padFilter);
    osc2.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(this.ambientGain);

    osc1.start(now);
    osc2.start(now);
    padLfo.start(now);

    // -------------------------------------------------------------
    // Capa 2: Secuenciador Rítmico y Melódico Procedural (105 BPM o 128 BPM)
    // -------------------------------------------------------------
    const bpm = isBoss ? 128 : 105;
    const stepIntervalMs = Math.round(((60 / bpm) / 4) * 1000); // Duración de semicorchea (16th note)
    let step = 0;

    // Escala Mayor Pentatónica / Dórica Heroica para Exploración: C4, D4, E4, G4, A4, C5
    const exploreMelody = [
      261.63, 0, 329.63, 0, 392.00, 0, 440.00, 392.00, // C4, E4, G4, A4, G4
      329.63, 0, 293.66, 0, 392.00, 440.00, 523.25, 0  // E4, D4, G4, A4, C5
    ];

    // Arpegios Dórico/Menor de Batalla para Boss a 128 BPM:
    const bossArp = [
      146.83, 220.00, 293.66, 349.23, 440.00, 349.23, 293.66, 220.00, // D3, A3, D4, F4, A4, F4, D4, A3
      261.63, 329.63, 392.00, 523.25, 440.00, 349.23, 293.66, 220.00  // C4, E4, G4, C5, A4, F4, D4, A3
    ];

    const sequenceTimer = setInterval(() => {
      if (this.muted || this.currentAmbientMood === 'none') return;
      const cCtx = this.ctx;
      if (!cCtx || !this.ambientGain) return;
      const tNow = cCtx.currentTime;

      // A. PERCUSIÓN
      if (isBoss) {
        // Boss 128 BPM: Bombo contundente en los 4 tiempos
        if (step % 4 === 0) {
          this.playSyntheticKick(tNow, 150, 48, 0.08, 0.22);
        }
        // Caja de combate en beats 2 y 4 (pasos 4 y 12)
        if (step === 4 || step === 12) {
          this.playSyntheticSnare(tNow, 1400, 0.06, 0.09);
        }
        // Hi-hats rítmicos en contratiempos
        if (step % 2 === 1) {
          this.playSyntheticHat(tNow, 0.03, 0.04);
        }
      } else {
        // Exploración 105 BPM: Pulso rítmico suave estilo marcha (bombo pasos 0 y 8, chasquido pasos 4 y 12)
        if (step === 0 || step === 8) {
          this.playSyntheticKick(tNow, 115, 42, 0.09, 0.13);
        }
        if (step === 4 || step === 12) {
          this.playSyntheticSnare(tNow, 1600, 0.04, 0.045);
        }
      }

      // B. MELODÍA / ARPEGIOS HEROICOS
      if (isBoss) {
        // Arpegio diente de sierra con filtro pasobajo modulado dinámico
        const noteFreq = bossArp[step % bossArp.length];
        if (noteFreq > 0) {
          this.playHeroicLead(tNow, noteFreq, 'sawtooth', 0.10, 0.09, true);
        }
      } else {
        // Melodía épica de exploración en onda triangular cálida
        const noteFreq = exploreMelody[step % exploreMelody.length];
        if (noteFreq > 0) {
          this.playHeroicLead(tNow, noteFreq, 'triangle', 0.16, 0.08, false);
        }
      }

      step = (step + 1) % 16;
    }, stepIntervalMs);

    this.ambientState = {
      sequenceTimer,
      padOsc1: osc1,
      padOsc2: osc2,
      padFilter,
      padGain,
      padLfo,
      padLfoGain,
    };
  }

  private playSyntheticKick(time: number, startFreq: number, endFreq: number, duration: number, volume: number): void {
    if (!this.ctx || !this.ambientGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gain);
    gain.connect(this.ambientGain);
    osc.start(time);
    osc.stop(time + duration);
    this.scheduleCleanup(duration, osc, gain);
  }

  private playSyntheticSnare(time: number, filterFreq: number, duration: number, volume: number): void {
    if (!this.ctx || !this.ambientGain || !this.pinkNoiseBuffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.pinkNoiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, time);
    filter.Q.setValueAtTime(2.2, time);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);
    source.start(time);
    source.stop(time + duration);
    this.scheduleCleanup(duration, source, filter, gain);
  }

  private playSyntheticHat(time: number, duration: number, volume: number): void {
    if (!this.ctx || !this.ambientGain || !this.pinkNoiseBuffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.pinkNoiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, time);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);
    source.start(time);
    source.stop(time + duration);
    this.scheduleCleanup(duration, source, filter, gain);
  }

  private playHeroicLead(
    time: number,
    freq: number,
    type: OscillatorType,
    duration: number,
    volume: number,
    isBoss: boolean
  ): void {
    if (!this.ctx || !this.ambientGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.Q.setValueAtTime(isBoss ? 4.5 : 2.0, time);
    filter.frequency.setValueAtTime(isBoss ? 600 : 900, time);
    filter.frequency.exponentialRampToValueAtTime(isBoss ? 2400 : 1800, time + duration * 0.4);
    filter.frequency.exponentialRampToValueAtTime(isBoss ? 500 : 700, time + duration);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(time);
    osc.stop(time + duration);
    this.scheduleCleanup(duration, osc, filter, gain);
  }

  /**
   * Detiene suavemente la música ambiental liberando todos los osciladores y secuenciadores
   */
  public stopAmbient(fast: boolean = false): void {
    if (this.ambientState.sequenceTimer) {
      clearInterval(this.ambientState.sequenceTimer);
      this.ambientState.sequenceTimer = undefined;
    }
    if (this.ambientState.chimeTimer) {
      clearInterval(this.ambientState.chimeTimer);
      this.ambientState.chimeTimer = undefined;
    }

    const {
      padOsc1,
      padOsc2,
      padFilter,
      padGain,
      padLfo,
      padLfoGain,
      droneOsc1,
      droneOsc2,
      droneFilter,
      droneGain,
      droneLfo,
      droneLfoGain,
      windSource,
      windFilter,
      windGain,
      windLfo,
      windLfoGain,
    } = this.ambientState;

    this.ambientState = {};
    this.currentAmbientMood = 'none';

    const fadeDuration = fast ? 0.08 : 1.0;
    const now = this.ctx ? this.ctx.currentTime : 0;

    if (this.ctx && padGain) {
      padGain.gain.setValueAtTime(padGain.gain.value, now);
      padGain.gain.linearRampToValueAtTime(0.001, now + fadeDuration);
    }
    if (this.ctx && droneGain) {
      droneGain.gain.setValueAtTime(droneGain.gain.value, now);
      droneGain.gain.linearRampToValueAtTime(0.001, now + fadeDuration);
    }
    if (this.ctx && windGain) {
      windGain.gain.setValueAtTime(windGain.gain.value, now);
      windGain.gain.linearRampToValueAtTime(0.001, now + fadeDuration);
    }

    setTimeout(() => {
      try {
        padOsc1?.stop();
        padOsc2?.stop();
        padLfo?.stop();
        droneOsc1?.stop();
        droneOsc2?.stop();
        droneLfo?.stop();
        windSource?.stop();
        windLfo?.stop();

        padOsc1?.disconnect();
        padOsc2?.disconnect();
        padFilter?.disconnect();
        padGain?.disconnect();
        padLfo?.disconnect();
        padLfoGain?.disconnect();

        droneOsc1?.disconnect();
        droneOsc2?.disconnect();
        droneFilter?.disconnect();
        droneGain?.disconnect();
        droneLfo?.disconnect();
        droneLfoGain?.disconnect();

        windSource?.disconnect();
        windFilter?.disconnect();
        windGain?.disconnect();
        windLfo?.disconnect();
        windLfoGain?.disconnect();
      } catch {
        // Safe disconnection
      }
    }, Math.floor((fadeDuration + 0.1) * 1000));
  }
}

export const audioManager = AudioManager.getInstance();
