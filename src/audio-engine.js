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
    this.feedbackOscillator = null;
    this.feedbackGain = null;
    this.spectrumData = null;
    this.masterValue = 0.06;
    this.target = { frequency: 1000, gain: 0, q: 2 };
    this.startRequest = 0;
    this.responseFilter = null;
  }

  async ensureContext() {
    if (!this.context) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) throw new Error("Web Audio API is not supported.");
      this.context = new Context();
      this.responseFilter = this.context.createBiquadFilter();
      this.responseFilter.type = "peaking";
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
    this.filter.type = "peaking";
    const now = this.context.currentTime;
    this.filter.frequency.setTargetAtTime(this.target.frequency, now, 0.025);
    this.filter.gain.setTargetAtTime(this.target.gain, now, 0.025);
    this.filter.Q.setTargetAtTime(this.target.q, now, 0.025);
  }

  setAudition(changed) {
    this.setEffect({ ...this.target, gain: changed ? this.target.challengeGain ?? this.target.gain : 0 });
  }

  async start(sourceType = "pink", options = {}) {
    // 読み込み中に停止・モード変更した場合、古い再生要求を復活させない。
    const request = ++this.startRequest;
    const effect = { ...this.target };
    await this.ensureContext();
    if (request !== this.startRequest) return false;
    this.stopSource();

    let buffer;
    if (sourceType === "music") buffer = await this.loadMusic();
    else if (sourceType === "speech") buffer = await this.loadSpeech();
    else buffer = sourceType === "white" ? this.createWhiteNoiseBuffer() : this.createPinkNoiseBuffer();
    if (request !== this.startRequest) return false;

    this.filter = this.context.createBiquadFilter();
    this.filter.type = options.filterType ?? "peaking";
    this.filter.frequency.value = effect.frequency;
    this.filter.Q.value = effect.q;
    this.filter.gain.value = effect.gain;
    this.filter.connect(this.analyser);

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.filter);
    source.start();
    this.source = source;

    this.sourceType = sourceType;
    if (options.feedbackFrequency) this.startFeedbackTone(options.feedbackFrequency, options.feedbackLevel);
    return true;
  }

  async startFeedback(sourceType, { feedbackFrequency, notchFrequency, q = 8, feedbackLevel = 0.1 }) {
    this.target = { frequency: notchFrequency, gain: 0, q };
    return this.start(sourceType, { filterType: "notch", feedbackFrequency, feedbackLevel });
  }

  async restart(sourceType, options = {}) {
    await this.start(sourceType, options);
  }

  setNotch({ frequency, q }) {
    this.target = { frequency: clamp(Number(frequency), 20, 20000), gain: 0, q: clamp(Number(q), 0.2, 16) };
    if (!this.filter || !this.context) return;
    this.filter.type = "notch";
    const now = this.context.currentTime;
    this.filter.frequency.setTargetAtTime(this.target.frequency, now, 0.018);
    this.filter.Q.setTargetAtTime(this.target.q, now, 0.018);
  }

  startFeedbackTone(frequency, level = 0.1) {
    if (!this.context || !this.filter) return;
    this.stopFeedbackTone();
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = clamp(Number(frequency), 20, 20000);
    gain.gain.value = clamp(Number(level), 0.02, 0.14);
    oscillator.connect(gain);
    gain.connect(this.filter);
    oscillator.start();
    this.feedbackOscillator = oscillator;
    this.feedbackGain = gain;
  }

  stopFeedbackTone() {
    if (this.feedbackOscillator) {
      try { this.feedbackOscillator.stop(); } catch { /* already stopped */ }
      try { this.feedbackOscillator.disconnect(); } catch { /* already disconnected */ }
    }
    if (this.feedbackGain) {
      try { this.feedbackGain.disconnect(); } catch { /* already disconnected */ }
    }
    this.feedbackOscillator = null;
    this.feedbackGain = null;
  }

  stopSource() {
    this.stopFeedbackTone();
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
    this.startRequest += 1;
    this.stopSource();
  }

  getEqResponse(parameters, frequencies) {
    if (!this.responseFilter) return new Float32Array(frequencies.length);
    // 未接続の計測用ノード。再生中のA/Bやパラメータ補間に影響を与えない。
    const filter = this.responseFilter;
    filter.frequency.value = parameters.frequency;
    filter.gain.value = parameters.gain;
    filter.Q.value = parameters.q;
    const magnitudes = new Float32Array(frequencies.length);
    const phases = new Float32Array(frequencies.length);
    filter.getFrequencyResponse(frequencies, magnitudes, phases);
    return magnitudes.map((value) => 20 * Math.log10(Math.max(1e-12, value)));
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
