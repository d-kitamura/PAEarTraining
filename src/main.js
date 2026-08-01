import { AudioEngine } from "./audio-engine.js";
import { createChallenge, formatFrequency, scoreGuess } from "./frequency-hunt.js";
import { messages, translateDocument } from "./i18n.js";
import { SpectrumView } from "./spectrum-view.js";

const audio = new AudioEngine();
const view = new SpectrumView(document.getElementById("spectrum"), document.getElementById("plotHitLayer"));

const el = Object.fromEntries([
  "startStop", "masterGain", "languageSelect", "instruction", "statusBadge", "questionNumber", "changeReadout", "guessReadout", "scoreReadout",
  "newQuestion", "submitAnswer", "replayChange", "showSpectrum", "spectrumHidden", "sourceSelect", "difficultySelect", "challengeTypeSelect",
  "listenFlat", "listenChanged", "resetStats", "answeredStat", "averageStat", "bestStat",
].map((id) => [id, document.getElementById(id)]));

const storedLanguage = localStorage.getItem("pa-ear-language");
const state = {
  language: storedLanguage || (navigator.language.startsWith("ja") ? "ja" : "en"),
  running: false,
  challenge: null,
  guess: null,
  answered: false,
  auditionChanged: true,
  questionNumber: 0,
  stats: loadStats(),
};

function t(key) {
  return messages[state.language]?.[key] ?? messages.en[key] ?? key;
}

function loadStats() {
  try {
    const value = JSON.parse(localStorage.getItem("pa-ear-frequency-hunt-stats"));
    if (value && Array.isArray(value.scores)) return value;
  } catch { /* use empty stats */ }
  return { scores: [] };
}

function saveStats() {
  localStorage.setItem("pa-ear-frequency-hunt-stats", JSON.stringify(state.stats));
}

function updateStats() {
  const scores = state.stats.scores;
  el.answeredStat.textContent = String(scores.length);
  el.averageStat.textContent = scores.length ? String(Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)) : "–";
  el.bestStat.textContent = scores.length ? String(Math.max(...scores)) : "–";
}

function setStatus(kind) {
  el.statusBadge.className = `statusBadge ${kind}`;
  el.statusBadge.textContent = t(kind === "answered" ? "result" : kind === "listening" ? "listening" : "ready");
}

function updateUi() {
  translateDocument(state.language);
  el.languageSelect.value = state.language;
  el.startStop.textContent = t(state.running ? "stop" : "start");
  el.startStop.classList.toggle("running", state.running);
  el.questionNumber.textContent = state.questionNumber ? String(state.questionNumber).padStart(2, "0") : "–";
  el.guessReadout.textContent = state.guess ? formatFrequency(state.guess) : "– Hz";
  el.changeReadout.textContent = state.answered && state.challenge
    ? `${state.challenge.direction === "boost" ? t("boostLabel") : t("cutLabel")} ${state.challenge.gain > 0 ? "+" : ""}${state.challenge.gain} dB · Q ${state.challenge.q}`
    : t("hidden");
  el.instruction.textContent = t(state.answered ? "instructionAnswered" : state.challenge ? "instructionListening" : "instructionReady");
  el.submitAnswer.disabled = !state.challenge || !state.guess || state.answered;
  el.replayChange.disabled = !state.challenge || !state.running;
  el.spectrumHidden.classList.toggle("hidden", el.showSpectrum.checked || state.answered);
  if (!state.answered) el.scoreReadout.textContent = "–";
  setStatus(state.answered ? "answered" : state.challenge ? "listening" : "idle");
  updateStats();
}

function applyChallenge() {
  if (!state.challenge) return;
  const gain = state.auditionChanged ? state.challenge.gain : 0;
  audio.setEffect({ ...state.challenge, gain });
  audio.target.challengeGain = state.challenge.gain;
  el.listenFlat.classList.toggle("active", !state.auditionChanged);
  el.listenChanged.classList.toggle("active", state.auditionChanged);
}

async function ensureRunning() {
  if (state.running) return true;
  try {
    if (state.challenge) audio.setEffect({ ...state.challenge, gain: state.challenge.gain });
    await audio.start(el.sourceSelect.value);
    state.running = true;
    applyChallenge();
    updateUi();
    return true;
  } catch (error) {
    console.error(error);
    window.alert(t(el.sourceSelect.value === "music" ? "musicError" : "audioError"));
    return false;
  }
}

async function toggleAudio() {
  if (state.running) {
    audio.stop();
    state.running = false;
    updateUi();
    return;
  }
  await ensureRunning();
}

async function newQuestion() {
  state.challenge = createChallenge(el.difficultySelect.value, el.challengeTypeSelect.value, state.challenge?.frequency);
  state.guess = null;
  state.answered = false;
  state.auditionChanged = true;
  state.questionNumber += 1;
  el.scoreReadout.textContent = "–";
  view.setQuestion();
  audio.setEffect({ ...state.challenge, gain: state.challenge.gain });
  audio.target.challengeGain = state.challenge.gain;
  applyChallenge();
  updateUi();
  await ensureRunning();
}

function submitAnswer() {
  if (!state.challenge || !state.guess || state.answered) return;
  const result = scoreGuess(state.guess, state.challenge.frequency);
  state.answered = true;
  state.stats.scores.push(result.score);
  saveStats();
  el.scoreReadout.textContent = `${result.score} · ${t(result.rating)}`;
  view.setQuestion({ guess: state.guess, target: state.challenge.frequency, answered: true });
  updateUi();
}

function setAudition(changed) {
  if (!state.challenge) return;
  state.auditionChanged = changed;
  applyChallenge();
}

async function replayAb() {
  if (!state.running || !state.challenge) return;
  setAudition(false);
  el.replayChange.disabled = true;
  window.setTimeout(() => setAudition(true), 900);
  window.setTimeout(() => { el.replayChange.disabled = false; }, 1800);
}

view.onGuess = (frequency) => {
  if (!state.challenge || state.answered) return;
  state.guess = frequency;
  view.setQuestion({ guess: frequency });
  el.guessReadout.textContent = formatFrequency(frequency);
  el.submitAnswer.disabled = false;
};

el.startStop.addEventListener("click", toggleAudio);
el.newQuestion.addEventListener("click", newQuestion);
el.submitAnswer.addEventListener("click", submitAnswer);
el.replayChange.addEventListener("click", replayAb);
el.listenFlat.addEventListener("click", () => setAudition(false));
el.listenChanged.addEventListener("click", () => setAudition(true));
el.masterGain.addEventListener("input", () => audio.setMaster(el.masterGain.value));
el.showSpectrum.addEventListener("change", updateUi);
el.languageSelect.addEventListener("change", () => {
  state.language = el.languageSelect.value;
  localStorage.setItem("pa-ear-language", state.language);
  updateUi();
});
el.sourceSelect.addEventListener("change", async () => {
  if (!state.running) return;
  try {
    await audio.restart(el.sourceSelect.value);
    applyChallenge();
  } catch (error) {
    console.error(error);
    window.alert(t(el.sourceSelect.value === "music" ? "musicError" : "audioError"));
    el.sourceSelect.value = "pink";
    await audio.restart("pink");
    applyChallenge();
  }
});
el.resetStats.addEventListener("click", () => {
  state.stats = { scores: [] };
  saveStats();
  updateStats();
});

window.addEventListener("resize", () => view.resize());
window.addEventListener("beforeunload", () => audio.stop());

function animate() {
  view.setSpectrum(audio.getSpectrum());
  view.draw(el.showSpectrum.checked || state.answered);
  requestAnimationFrame(animate);
}

updateUi();
animate();
