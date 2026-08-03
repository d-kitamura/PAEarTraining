import { AudioEngine } from "./audio-engine.js?v=3";
import { createChallenge, formatFrequency, scoreGuess, SOURCE_FREQUENCY_RANGES } from "./frequency-hunt.js?v=3";
import { createFeedbackChallenge, scoreFeedbackNotch } from "./feedback-killer.js?v=1";
import { messages, translateDocument } from "./i18n.js?v=3";
import { SpectrumView } from "./spectrum-view.js";

const audio = new AudioEngine();
const view = new SpectrumView(document.getElementById("spectrum"), document.getElementById("plotHitLayer"));

const el = Object.fromEntries([
  "startStop", "masterGain", "languageSelect", "instruction", "statusBadge", "questionNumber", "changeReadout", "guessReadout", "scoreReadout",
  "newQuestion", "submitAnswer", "replayChange", "abInterval", "abIntervalReadout", "showSpectrum", "spectrumHidden", "sourceSelect", "difficultySelect", "challengeTypeSelect",
  "listenFlat", "listenChanged", "resetStats", "answeredStat", "averageStat", "bestStat", "eqAmountSelect", "sourceRangeHint",
  "modeFrequencyHunt", "modeFeedbackKiller", "modeTitle", "alternatingControl", "changeLabel", "guessLabel", "difficultyLabel", "feedbackQSelect", "trainingTip",
].map((id) => [id, document.getElementById(id)]));

const frequencyOnly = [...document.querySelectorAll(".frequencyOnly")];
const feedbackOnly = [...document.querySelectorAll(".feedbackOnly")];

const storedLanguage = localStorage.getItem("pa-ear-language");
const state = {
  mode: "frequencyHunt",
  language: storedLanguage || (navigator.language.startsWith("ja") ? "ja" : "en"),
  running: false,
  challenge: null,
  guess: null,
  answered: false,
  auditionChanged: true,
  abAlternating: false,
  abTimer: null,
  questionNumber: 0,
  stats: {
    frequencyHunt: loadStats("pa-ear-frequency-hunt-stats"),
    feedbackKiller: loadStats("pa-ear-feedback-killer-stats"),
  },
};

function t(key) {
  return messages[state.language]?.[key] ?? messages.en[key] ?? key;
}

function loadStats(storageKey) {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey));
    if (value && Array.isArray(value.scores)) return value;
  } catch { /* use empty stats */ }
  return { scores: [] };
}

function saveStats() {
  const storageKey = state.mode === "feedbackKiller" ? "pa-ear-feedback-killer-stats" : "pa-ear-frequency-hunt-stats";
  localStorage.setItem(storageKey, JSON.stringify(state.stats[state.mode]));
}

function updateStats() {
  const scores = state.stats[state.mode].scores;
  el.answeredStat.textContent = String(scores.length);
  el.averageStat.textContent = scores.length ? String(Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)) : "–";
  el.bestStat.textContent = scores.length ? String(Math.max(...scores)) : "–";
}

function setStatus(kind) {
  el.statusBadge.className = `statusBadge ${kind}`;
  el.statusBadge.textContent = t(kind === "answered" ? "result" : kind === "feedback" ? "feedbackStatus" : kind === "listening" ? "listening" : "ready");
}

function updateAmountOptions() {
  const current = el.eqAmountSelect.value;
  const definitions = [
    ["3", "amount3"],
    ["6", "amount6"],
    ["9", "amount9"],
    ["12", "amount12"],
    ["random-beginner", "amountRandomBeginner"],
    ["random-intermediate", "amountRandomIntermediate"],
    ["random-expert", "amountRandomExpert"],
  ];
  el.eqAmountSelect.replaceChildren(...definitions.map(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = t(label);
    return option;
  }));
  const fallback = "random-intermediate";
  el.eqAmountSelect.value = definitions.some(([value]) => value === current) ? current : fallback;
  el.eqAmountSelect.disabled = false;
}

function updateUi() {
  translateDocument(state.language);
  updateAmountOptions();
  const feedbackMode = state.mode === "feedbackKiller";
  frequencyOnly.forEach((element) => element.classList.toggle("hidden", feedbackMode));
  feedbackOnly.forEach((element) => element.classList.toggle("hidden", !feedbackMode));
  el.modeFrequencyHunt.classList.toggle("active", !feedbackMode);
  el.modeFeedbackKiller.classList.toggle("active", feedbackMode);
  if (feedbackMode) {
    el.modeFrequencyHunt.removeAttribute("aria-current");
    el.modeFeedbackKiller.setAttribute("aria-current", "page");
  } else {
    el.modeFrequencyHunt.setAttribute("aria-current", "page");
    el.modeFeedbackKiller.removeAttribute("aria-current");
  }
  el.modeTitle.textContent = t(feedbackMode ? "feedbackKiller" : "frequencyHunt");
  el.difficultyLabel.textContent = t(feedbackMode ? "feedbackFrequency" : "difficulty");
  el.changeLabel.textContent = t(feedbackMode ? "feedbackFrequency" : "change");
  el.guessLabel.textContent = t(feedbackMode ? "notchFrequency" : "yourGuess");
  el.trainingTip.textContent = t(feedbackMode ? "feedbackTip" : "tipText");
  view.setMarkerLabels(feedbackMode ? t("notchMarker") : "GUESS", feedbackMode ? t("feedbackMarker") : "TARGET");
  el.languageSelect.value = state.language;
  el.startStop.textContent = t(state.running ? "stop" : "start");
  el.startStop.classList.toggle("running", state.running);
  el.questionNumber.textContent = state.questionNumber ? String(state.questionNumber).padStart(2, "0") : "–";
  el.guessReadout.textContent = state.guess ? formatFrequency(state.guess) : "– Hz";
  el.changeReadout.textContent = state.answered && state.challenge
    ? feedbackMode
      ? `${formatFrequency(state.challenge.frequency)} · Q ${state.challenge.q}`
      : `${state.challenge.direction === "boost" ? t("boostLabel") : t("cutLabel")} ${state.challenge.gain > 0 ? "+" : ""}${state.challenge.gain} dB · Q ${state.challenge.q}`
    : t("hidden");
  const instructionKey = feedbackMode
    ? state.answered ? "feedbackAnswered" : state.challenge ? "feedbackListening" : "feedbackReady"
    : state.answered ? "instructionAnswered" : state.challenge ? "instructionListening" : "instructionReady";
  el.instruction.textContent = t(instructionKey);
  el.submitAnswer.disabled = !state.challenge || !state.guess || state.answered;
  el.newQuestion.disabled = Boolean(state.challenge && !state.answered);
  el.replayChange.disabled = feedbackMode || !state.challenge || !state.running;
  el.replayChange.textContent = t(state.abAlternating ? "stopReplay" : "replay");
  el.replayChange.classList.toggle("active", state.abAlternating);
  el.replayChange.setAttribute("aria-pressed", String(state.abAlternating));
  const intervalSeconds = getAbIntervalSeconds();
  const intervalLabel = intervalSeconds.toFixed(2).replace(/0$/, "");
  el.abIntervalReadout.textContent = `${intervalLabel} s`;
  el.abInterval.setAttribute("aria-valuetext", `${intervalLabel} s`);
  el.spectrumHidden.classList.toggle("hidden", feedbackMode || el.showSpectrum.checked || state.answered);
  const sourceRange = SOURCE_FREQUENCY_RANGES[el.sourceSelect.value] ?? SOURCE_FREQUENCY_RANGES.pink;
  el.sourceRangeHint.textContent = `${t("questionRange")}: ${formatFrequency(sourceRange.min)}–${formatFrequency(sourceRange.max)}`;
  if (!state.answered) el.scoreReadout.textContent = "–";
  setStatus(state.answered ? "answered" : state.challenge ? feedbackMode ? "feedback" : "listening" : "idle");
  updateStats();
}

function applyChallenge() {
  if (!state.challenge) return;
  if (state.mode === "feedbackKiller") {
    if (state.guess) audio.setNotch({ frequency: state.guess, q: state.challenge.q });
    return;
  }
  const gain = state.auditionChanged ? state.challenge.gain : 0;
  audio.setEffect({ ...state.challenge, gain });
  audio.target.challengeGain = state.challenge.gain;
  el.listenFlat.classList.toggle("active", !state.auditionChanged);
  el.listenChanged.classList.toggle("active", state.auditionChanged);
}

async function startCurrentAudio() {
  if (state.mode === "feedbackKiller" && state.challenge) {
    await audio.startFeedback(el.sourceSelect.value, {
      feedbackFrequency: state.challenge.frequency,
      notchFrequency: state.guess ?? state.challenge.initialNotch,
      q: state.challenge.q,
      feedbackLevel: 0.1,
    });
  } else {
    if (state.challenge) audio.setEffect({ ...state.challenge, gain: state.challenge.gain });
    await audio.start(el.sourceSelect.value);
    applyChallenge();
  }
}

async function ensureRunning() {
  if (state.running) return true;
  try {
    await startCurrentAudio();
    state.running = true;
    updateUi();
    return true;
  } catch (error) {
    console.error(error);
    window.alert(t(["music", "speech"].includes(el.sourceSelect.value) ? "sampleError" : "audioError"));
    return false;
  }
}

async function toggleAudio() {
  if (state.running) {
    stopAlternating(false);
    audio.stop();
    state.running = false;
    updateUi();
    return;
  }
  await ensureRunning();
}

async function newQuestion() {
  stopAlternating(false);
  const frequencyRange = SOURCE_FREQUENCY_RANGES[el.sourceSelect.value] ?? SOURCE_FREQUENCY_RANGES.pink;
  const previousFrequency = state.challenge?.frequency;
  if (state.mode === "feedbackKiller") {
    state.challenge = createFeedbackChallenge(el.difficultySelect.value, previousFrequency, {
      frequencyRange,
      q: el.feedbackQSelect.value,
    });
    state.guess = state.challenge.initialNotch;
  } else {
    state.challenge = createChallenge(el.difficultySelect.value, el.challengeTypeSelect.value, previousFrequency, {
      amountMode: el.eqAmountSelect.value,
      frequencyRange,
    });
    state.guess = null;
  }
  state.answered = false;
  state.auditionChanged = true;
  state.questionNumber += 1;
  el.scoreReadout.textContent = "–";
  view.setQuestion({ guess: state.guess });
  if (state.mode === "frequencyHunt") {
    audio.setEffect({ ...state.challenge, gain: state.challenge.gain });
    audio.target.challengeGain = state.challenge.gain;
    applyChallenge();
  }
  updateUi();
  if (state.running) await startCurrentAudio();
  else await ensureRunning();
}

function submitAnswer() {
  if (!state.challenge || !state.guess || state.answered) return;
  const result = state.mode === "feedbackKiller"
    ? scoreFeedbackNotch(state.guess, state.challenge.frequency)
    : scoreGuess(state.guess, state.challenge.frequency);
  state.answered = true;
  state.stats[state.mode].scores.push(result.score);
  saveStats();
  el.scoreReadout.textContent = `${result.score} · ${t(result.rating)}`;
  view.setQuestion({ guess: state.guess, target: state.challenge.frequency, answered: true });
  updateUi();
}

function setAudition(changed) {
  if (!state.challenge || state.mode !== "frequencyHunt") return;
  state.auditionChanged = changed;
  applyChallenge();
}

function stopAlternating(restoreChanged = true) {
  if (state.abTimer !== null) window.clearTimeout(state.abTimer);
  state.abTimer = null;
  state.abAlternating = false;
  if (restoreChanged && state.challenge && state.mode === "frequencyHunt") setAudition(true);
}

function getAbIntervalSeconds() {
  const position = Number(el.abInterval.value);
  const seconds = position <= 50
    ? 0.2 + (position / 50) * 0.3
    : 0.5 + ((position - 50) / 50) * 0.5;
  return Math.round(seconds * 100) / 100;
}

function scheduleNextAlternation() {
  if (!state.abAlternating || !state.running || !state.challenge) return;
  const intervalMs = getAbIntervalSeconds() * 1000;
  state.abTimer = window.setTimeout(() => {
    if (!state.abAlternating) return;
    setAudition(!state.auditionChanged);
    scheduleNextAlternation();
  }, intervalMs);
}

function toggleAlternating() {
  if (state.mode !== "frequencyHunt" || !state.running || !state.challenge) return;
  if (state.abAlternating) {
    stopAlternating(true);
  } else {
    state.abAlternating = true;
    setAudition(false);
    scheduleNextAlternation();
  }
  updateUi();
}

view.onGuess = (frequency) => {
  if (!state.challenge || state.answered) return;
  state.guess = frequency;
  view.setQuestion({ guess: frequency });
  if (state.mode === "feedbackKiller") audio.setNotch({ frequency, q: state.challenge.q });
  el.guessReadout.textContent = formatFrequency(frequency);
  el.submitAnswer.disabled = false;
};

function switchMode(mode) {
  if (state.mode === mode) return;
  stopAlternating(false);
  audio.stop();
  state.mode = mode;
  state.running = false;
  state.challenge = null;
  state.guess = null;
  state.answered = false;
  state.auditionChanged = true;
  state.questionNumber = 0;
  el.scoreReadout.textContent = "–";
  view.setQuestion();
  updateUi();
}

el.startStop.addEventListener("click", toggleAudio);
el.modeFrequencyHunt.addEventListener("click", () => switchMode("frequencyHunt"));
el.modeFeedbackKiller.addEventListener("click", () => switchMode("feedbackKiller"));
el.newQuestion.addEventListener("click", newQuestion);
el.submitAnswer.addEventListener("click", submitAnswer);
el.replayChange.addEventListener("click", toggleAlternating);
el.abInterval.addEventListener("input", () => {
  if (state.abAlternating) {
    if (state.abTimer !== null) window.clearTimeout(state.abTimer);
    state.abTimer = null;
    scheduleNextAlternation();
  }
  updateUi();
});
el.listenFlat.addEventListener("click", () => {
  stopAlternating(false);
  setAudition(false);
  updateUi();
});
el.listenChanged.addEventListener("click", () => {
  stopAlternating(false);
  setAudition(true);
  updateUi();
});
el.masterGain.addEventListener("input", () => audio.setMaster(el.masterGain.value));
el.showSpectrum.addEventListener("change", updateUi);
el.languageSelect.addEventListener("change", () => {
  state.language = el.languageSelect.value;
  localStorage.setItem("pa-ear-language", state.language);
  updateUi();
});
el.sourceSelect.addEventListener("change", async () => {
  stopAlternating(false);
  updateUi();
  if (!state.running) return;
  try {
    await startCurrentAudio();
  } catch (error) {
    console.error(error);
    window.alert(t(["music", "speech"].includes(el.sourceSelect.value) ? "sampleError" : "audioError"));
    el.sourceSelect.value = "pink";
    await startCurrentAudio();
  }
});
el.difficultySelect.addEventListener("change", updateUi);
el.feedbackQSelect.addEventListener("change", () => {
  if (state.mode === "feedbackKiller" && state.challenge) {
    state.challenge.q = Number(el.feedbackQSelect.value);
    audio.setNotch({ frequency: state.guess, q: state.challenge.q });
  }
  updateUi();
});
el.resetStats.addEventListener("click", () => {
  state.stats[state.mode] = { scores: [] };
  saveStats();
  updateStats();
});

window.addEventListener("resize", () => view.resize());
window.addEventListener("beforeunload", () => {
  stopAlternating(false);
  audio.stop();
});

function animate() {
  const currentSpectrum = audio.getSpectrum();
  view.setSpectrum(currentSpectrum);
  view.draw(el.showSpectrum.checked || state.answered);
  requestAnimationFrame(animate);
}

updateUi();
animate();
