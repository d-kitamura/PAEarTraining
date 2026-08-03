const FREQ_MIN = 20;
const FREQ_MAX = 20000;
const DB_MIN = -95;
const DB_MAX = -20;
const LABELS = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class SpectrumView {
  constructor(canvas, hitLayer) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.hitLayer = hitLayer;
    this.guess = null;
    this.target = null;
    this.answered = false;
    this.spectrum = null;
    this.onGuess = null;
    this.pointerId = null;
    this.guessLabel = "GUESS";
    this.targetLabel = "TARGET";
    this.bindPointers();
    this.resize();
  }

  margin() {
    const scale = this.canvas.width / Math.max(1, this.canvas.getBoundingClientRect().width);
    return { left: 72 * scale, right: 24 * scale, top: 32 * scale, bottom: 56 * scale };
  }

  rect() {
    const m = this.margin();
    return { x: m.left, y: m.top, w: this.canvas.width - m.left - m.right, h: this.canvas.height - m.top - m.bottom };
  }

  resize() {
    const box = this.canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(600, Math.round(box.width * scale));
    this.canvas.height = Math.max(360, Math.round(box.height * scale));
  }

  frequencyToX(frequency) {
    const area = this.rect();
    return area.x + (Math.log10(clamp(frequency, FREQ_MIN, FREQ_MAX) / FREQ_MIN) / Math.log10(FREQ_MAX / FREQ_MIN)) * area.w;
  }

  xToFrequency(x) {
    const area = this.rect();
    return FREQ_MIN * (FREQ_MAX / FREQ_MIN) ** clamp((x - area.x) / area.w, 0, 1);
  }

  dbToY(db) {
    const area = this.rect();
    return area.y + (1 - (clamp(db, DB_MIN, DB_MAX) - DB_MIN) / (DB_MAX - DB_MIN)) * area.h;
  }

  pointFromEvent(event) {
    const box = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - box.left) * (this.canvas.width / box.width),
      y: (event.clientY - box.top) * (this.canvas.height / box.height),
    };
  }

  updateGuess(event) {
    const point = this.pointFromEvent(event);
    const area = this.rect();
    if (point.x < area.x || point.x > area.x + area.w || point.y < area.y || point.y > area.y + area.h) return;
    this.guess = this.xToFrequency(point.x);
    this.onGuess?.(this.guess);
  }

  bindPointers() {
    this.hitLayer.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      this.pointerId = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      this.updateGuess(event);
    });
    this.hitLayer.addEventListener("pointermove", (event) => {
      if (event.pointerId !== this.pointerId) return;
      event.preventDefault();
      this.updateGuess(event);
    });
    const end = (event) => {
      if (event.pointerId === this.pointerId) this.pointerId = null;
    };
    this.hitLayer.addEventListener("pointerup", end);
    this.hitLayer.addEventListener("pointercancel", end);
    this.hitLayer.addEventListener("lostpointercapture", end);
    this.hitLayer.addEventListener("dragstart", (event) => event.preventDefault());
  }

  setQuestion({ guess = null, target = null, answered = false } = {}) {
    this.guess = guess;
    this.target = target;
    this.answered = answered;
  }

  setSpectrum(spectrum) {
    this.spectrum = spectrum;
  }

  setMarkerLabels(guess, target) {
    this.guessLabel = guess;
    this.targetLabel = target;
  }

  draw(showSpectrum) {
    const ctx = this.ctx;
    const area = this.rect();
    const scale = this.canvas.width / Math.max(1, this.canvas.getBoundingClientRect().width);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = "#060c13";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.font = `${12 * scale}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const frequency of LABELS) {
      const x = this.frequencyToX(frequency);
      ctx.strokeStyle = frequency === 1000 ? "#355169" : "#1b2a39";
      ctx.lineWidth = frequency === 1000 ? 1.2 * scale : scale;
      ctx.beginPath();
      ctx.moveTo(x, area.y);
      ctx.lineTo(x, area.y + area.h);
      ctx.stroke();
      ctx.fillStyle = "#8eaac3";
      const label = frequency >= 1000 ? `${frequency / 1000}k` : String(frequency);
      ctx.fillText(label, x, area.y + area.h + 16 * scale);
    }

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let db = -90; db <= -30; db += 15) {
      const y = this.dbToY(db);
      ctx.strokeStyle = "#1b2a39";
      ctx.lineWidth = scale;
      ctx.beginPath();
      ctx.moveTo(area.x, y);
      ctx.lineTo(area.x + area.w, y);
      ctx.stroke();
      ctx.fillStyle = "#66839b";
      ctx.fillText(`${db}`, area.x - 10 * scale, y);
    }

    if (showSpectrum && this.spectrum) this.drawSpectrum(area, scale);
    if (this.guess) this.drawMarker(this.guess, "#39ff14", this.guessLabel, area, scale, false);
    if (this.answered && this.target) this.drawMarker(this.target, "#ff7117", this.targetLabel, area, scale, true);

    ctx.strokeStyle = "#6f879a";
    ctx.lineWidth = scale;
    ctx.strokeRect(area.x, area.y, area.w, area.h);
  }

  drawSpectrum(area, scale) {
    const { values, sampleRate, fftSize } = this.spectrum;
    const ctx = this.ctx;
    ctx.beginPath();
    let drawing = false;
    for (let i = 1; i < values.length; i += 2) {
      const frequency = (i * sampleRate) / fftSize;
      if (frequency < FREQ_MIN) continue;
      if (frequency > FREQ_MAX) break;
      const x = this.frequencyToX(frequency);
      const y = this.dbToY(values[i]);
      if (!drawing) { ctx.moveTo(x, y); drawing = true; } else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#1488ff";
    ctx.lineWidth = 1.6 * scale;
    ctx.shadowColor = "rgba(20, 136, 255, 0.4)";
    ctx.shadowBlur = 8 * scale;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawMarker(frequency, color, label, area, scale, target) {
    const ctx = this.ctx;
    const x = this.frequencyToX(frequency);
    ctx.strokeStyle = color;
    ctx.lineWidth = (target ? 2 : 1.5) * scale;
    ctx.setLineDash(target ? [] : [5 * scale, 5 * scale]);
    ctx.beginPath();
    ctx.moveTo(x, area.y);
    ctx.lineTo(x, area.y + area.h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, area.y + area.h * 0.52, 7 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `800 ${10 * scale}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(label, x, area.y - 7 * scale);
  }
}
