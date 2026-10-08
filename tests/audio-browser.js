import { AudioEngine } from "../src/audio-engine.js";
import { scoreEqMatch, EQ_MATCH_FREQUENCIES } from "../src/eq-match.js";

const checks = [];
function check(condition, label) {
  if (!condition) throw new Error(label);
  checks.push(`PASS ${label}`);
}

try {
  for (const sampleRate of [44100, 48000]) {
    const context = new OfflineAudioContext(1, sampleRate, sampleRate);
    const audio = new AudioEngine();
    audio.context = context;
    audio.responseFilter = context.createBiquadFilter();
    audio.responseFilter.type = "peaking";
    const target = { frequency: 1000, gain: 6, q: 2 };
    const curve = audio.getEqResponse(target, EQ_MATCH_FREQUENCIES);
    check(Math.abs(audio.getEqResponse(target, new Float32Array([1000]))[0] - 6) < 0.001, `${sampleRate} Hz: target center is +6 dB`);
    check(scoreEqMatch(curve, curve).score === 100, `${sampleRate} Hz: exact match = 100`);
    check(scoreEqMatch(audio.getEqResponse({ ...target, gain: 0 }, EQ_MATCH_FREQUENCIES), curve).score === 0, `${sampleRate} Hz: flat EQ = 0`);
    check(scoreEqMatch(audio.getEqResponse({ ...target, gain: -6 }, EQ_MATCH_FREQUENCIES), curve).score === 0, `${sampleRate} Hz: inverse EQ = 0`);
    const near = scoreEqMatch(audio.getEqResponse({ ...target, frequency: 1050, gain: 5.5 }, EQ_MATCH_FREQUENCIES), curve).score;
    const far = scoreEqMatch(audio.getEqResponse({ ...target, frequency: 2000 }, EQ_MATCH_FREQUENCIES), curve).score;
    check(near > far && near > 80, `${sampleRate} Hz: close EQ (${near}) beats distant EQ (${far})`);

    // 実際のフィルタ処理と計測用のカーブが一致するか、可聴出力なしで検証する。
    audio.filter = context.createBiquadFilter();
    audio.filter.type = "notch";
    audio.setEffect(target);
    check(audio.filter.type === "peaking", `${sampleRate} Hz: leaving Feedback Killer restores a peaking filter`);
    const oscillator = context.createOscillator();
    oscillator.frequency.value = target.frequency;
    const input = context.createGain();
    input.gain.value = 0.1;
    oscillator.connect(input).connect(audio.filter).connect(context.destination);
    oscillator.start();
    const rendered = (await context.startRendering()).getChannelData(0).slice(sampleRate / 2);
    const rms = Math.sqrt(rendered.reduce((sum, value) => sum + value * value, 0) / rendered.length);
    const measuredDb = 20 * Math.log10(rms / (0.1 / Math.sqrt(2)));
    check(Math.abs(measuredDb - 6) < 0.02, `${sampleRate} Hz: rendered audio gain matches +6 dB (${measuredDb.toFixed(3)})`);
  }
  document.getElementById("results").textContent = `${checks.join("\n")}\n\n${checks.length} checks passed.`;
} catch (error) {
  document.getElementById("results").textContent = `${checks.join("\n")}\nFAIL ${error.message}`;
  console.error(error);
}
