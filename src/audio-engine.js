const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class AudioEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.analyser = null;
    this.filter = null;
    this.source = null;
    this.sourceType = null;
    this.musicBuffer = null;
    this.speechBuffer = null;
    this.spectrumData = null;
    this.masterValue = 0.06;
    this.target = { frequency: 1000, gain: 0, q: 2 };
  }

  async ensureContext() {
    if (!this.context) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) throw new Error("Web Audio API is not supported.");
      this.context = new Context();
      this.master = this.context.createGain();
      this.master.gain.value = this.masterValue;
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 4096;
      this.analyser.smoothingTimeConstant = 0.78;
      this.spectrumData = new Float32Array(this.analyser.frequencyBinCount);
      this.analyser.connect(this.master);
      this.master.connect(this.context.destination);
    }
    if (this.context.state === "suspended") await this.context.resume();
    return this.context;
  }

  setMaster(value) {
    this.masterValue = clamp(Number(value), 0, 0.25);
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.masterValue, this.context.currentTime, 0.02);
    }
  }

  setEffect({ frequency, gain, q }) {
    this.target = {
      frequency: clamp(Number(frequency), 20, 20000),
      gain: clamp(Number(gain), -18, 18),
      q: clamp(Number(q), 0.2, 16),
    };
    if (!this.filter || !this.context) return;
    const now = this.context.currentTime;
    this.filter.frequency.setTargetAtTime(this.target.frequency, now, 0.025);
    this.filter.gain.setTargetAtTime(this.target.gain, now, 0.025);
    this.filter.Q.setTargetAtTime(this.target.q, now, 0.025);
  }

  setAudition(changed) {
    this.setEffect({ ...this.target, gain: changed ? this.target.challengeGain ?? this.target.gain : 0 });
  }

  async start(sourceType = "pink") {
    await this.ensureContext();
    this.stopSource();

    this.filter = this.context.createBiquadFilter();
    this.filter.type = "peaking";
    this.filter.frequency.value = this.target.frequency;
    this.filter.Q.value = this.target.q;
    this.filter.gain.value = this.target.gain;
    this.filter.connect(this.analyser);

    if (sourceType === "music" || sourceType === "speech") {
      const buffer = sourceType === "music" ? await this.loadMusic() : await this.loadSpeech();
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(this.filter);
      source.start();
      this.source = source;
    } else if (sourceType === "white") {
      const source = this.context.createBufferSource();
      source.buffer = this.createWhiteNoiseBuffer();
      source.loop = true;
      source.connect(this.filter);
      source.start();
      this.source = source;
    } else {
      const source = this.context.createBufferSource();
      source.buffer = this.createPinkNoiseBuffer();
      source.loop = true;
      source.connect(this.filter);
      source.start();
      this.source = source;
    }

    this.sourceType = sourceType;
  }

  async restart(sourceType) {
    await this.start(sourceType);
  }

  stopSource() {
    if (this.source) {
      try { this.source.stop(); } catch { /* already stopped */ }
      try { this.source.disconnect(); } catch { /* already disconnected */ }
    }
    if (this.filter) {
      try { this.filter.disconnect(); } catch { /* already disconnected */ }
    }
    this.source = null;
    this.filter = null;
    this.sourceType = null;
  }

  stop() {
    this.stopSource();
  }

  createPinkNoiseBuffer() {
    const length = this.context.sampleRate * 4;
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  createWhiteNoiseBuffer() {
    const length = this.context.sampleRate * 4;
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.22;
    return buffer;
  }

  async loadMusic() {
    if (this.musicBuffer) return this.musicBuffer;
    const response = await fetch("mix.mp3");
    if (!response.ok) throw new Error(`Could not load music (${response.status}).`);
    this.musicBuffer = await this.context.decodeAudioData(await response.arrayBuffer());
    return this.musicBuffer;
  }

  async loadSpeech() {
    if (this.speechBuffer) return this.speechBuffer;
    const response = await fetch("speech-udhr-en.ogg");
    if (!response.ok) throw new Error(`Could not load speech (${response.status}).`);
    this.speechBuffer = await this.context.decodeAudioData(await response.arrayBuffer());
    return this.speechBuffer;
  }

  getSpectrum() {
    if (!this.analyser || !this.spectrumData || !this.context) return null;
    this.analyser.getFloatFrequencyData(this.spectrumData);
    return {
      values: this.spectrumData,
      sampleRate: this.context.sampleRate,
      fftSize: this.analyser.fftSize,
    };
  }
}
