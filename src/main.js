import { AudioEngine } from "./audio-engine.js?v=5";
import { createChallenge, formatFrequency, scoreGuess, SOURCE_FREQUENCY_RANGES } from "./frequency-hunt.js?v=3";
import { createFeedbackChallenge, scoreFeedbackNotch } from "./feedback-killer.js?v=1";
import { messages, translateDocument } from "./i18n.js?v=5";
import { SpectrumView } from "./spectrum-view.js?v=5";
import { createEqMatchChallenge, clampEq, scoreEqMatch, EQ_MATCH_FREQUENCIES } from "./eq-match.js?v=5";

const audio = new AudioEngine();
const view = new SpectrumView(document.getElementById("spectrum"), document.getElementById("plotHitLayer"));

const el = Object.fromEntries([
  "startStop", "masterGain", "languageSelect", "instruction", "statusBadge", "questionNumber", "changeReadout", "guessReadout", "scoreReadout",
  "newQuestion", "submitAnswer", "replayChange", "abInterval", "abIntervalReadout", "showSpectrum", "spectrumHidden", "sourceSelect", "difficultySelect", "challengeTypeSelect",
  "listenFlat", "listenChanged", "resetStats", "answeredStat", "averageStat", "bestStat", "eqAmountSelect", "sourceRangeHint",
  "modeFrequencyHunt", "modeFeedbackKiller", "modeTitle", "alternatingControl", "changeLabel", "guessLabel", "difficultyLabel", "feedbackQSelect", "trainingTip",
  "modeEqMatch", "matchFrequency", "matchGain", "matchQ", "matchFlat", "matchTargetLegend",
].map((id) => [id, document.getElementById(id)]));

const compareOnly = [...document.querySelectorAll(".compareOnly")];
const feedbackOnly = [...document.querySelectorAll(".feedbackOnly")];
const matchOnly = [...document.querySelectorAll(".matchOnly")];
const spectrumOnly = [...document.querySelectorAll(".spectrumOnly")];
const MODES = {
  frequencyHunt: { button: el.modeFrequencyHunt, storage: "pa-ear-frequency-hunt-stats" },
  feedbackKiller: { button: el.modeFeedbackKiller, storage: "pa-ear-feedback-killer-stats" },
  eqMatch: { button: el.modeEqMatch, storage: "pa-ear-eq-match-stats" },
};

const storedLanguage = localStorage.getItem("pa-ear-language");
const state = {
  mode: "frequencyHunt",
  language: storedLanguage || (navigator.language.startsWith("ja") ? "ja" : "en"),
  running: false,
  loading: false,
  audioOperation: 0,
  challenge: null,
  guess: null,
  answered: false,
  auditionChanged: true,
  abAlternating: false,
  abTimer: null,
  questionNumber: 0,
  matchEq: { frequency: 1000, gain: 0, q: 1 },
  result: null,
  stats: Object.fromEntries(Object.entries(MODES).map(([mode, config]) => [mode, loadStats(config.storage)])),
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
  localStorage.setItem(MODES[state.mode].storage, JSON.stringify(state.stats[state.mode]));
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
  const matchMode = state.mode === "eqMatch";
  compareOnly.forEach((element) => element.classList.toggle("hidden", feedbackMode));
  feedbackOnly.forEach((element) => element.classList.toggle("hidden", !feedbackMode));
  matchOnly.forEach((element) => element.classList.toggle("hidden", !matchMode));
  spectrumOnly.forEach((element) => element.classList.toggle("hidden", matchMode));
  for (const [mode, { button }] of Object.entries(MODES)) {
    button.classList.toggle("active", state.mode === mode);
    if (state.mode === mode) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
  el.modeTitle.textContent = t(state.mode);
  el.difficultyLabel.textContent = t(feedbackMode ? "feedbackFrequency" : "difficulty");
  el.changeLabel.textContent = t(matchMode ? "matchTarget" : feedbackMode ? "feedbackFrequency" : "change");
  el.guessLabel.textContent = t(matchMode ? "matchUser" : feedbackMode ? "notchFrequency" : "yourGuess");
  el.trainingTip.textContent = t(matchMode ? "matchTip" : feedbackMode ? "feedbackTip" : "tipText");
  view.setMarkerLabels(feedbackMode ? t("notchMarker") : "GUESS", feedbackMode ? t("feedbackMarker") : "TARGET");
  el.languageSelect.value = state.language;
  el.startStop.textContent = t(state.running || state.loading ? "stop" : "start");
  el.startStop.classList.toggle("running", state.running || state.loading);
  el.questionNumber.textContent = state.questionNumber ? String(state.questionNumber).padStart(2, "0") : "–";
  el.guessReadout.textContent = matchMode ? formatEq(state.matchEq) : state.guess ? formatFrequency(state.guess) : "– Hz";
  el.changeReadout.textContent = state.answered && state.challenge
    ? matchMode ? formatEq(state.challenge) : feedbackMode
      ? `${formatFrequency(state.challenge.frequency)} · Q ${state.challenge.q}`
      : `${state.challenge.direction === "boost" ? t("boostLabel") : t("cutLabel")} ${state.challenge.gain > 0 ? "+" : ""}${state.challenge.gain} dB · Q ${state.challenge.q}`
    : t("hidden");
  const instructionKey = matchMode
    ? state.answered ? "matchAnswered" : state.challenge ? "matchListening" : "matchReady"
    : feedbackMode
    ? state.answered ? "feedbackAnswered" : state.challenge ? "feedbackListening" : "feedbackReady"
    : state.answered ? "instructionAnswered" : state.challenge ? "instructionListening" : "instructionReady";
  el.instruction.textContent = t(instructionKey);
  el.submitAnswer.disabled = state.loading || !state.challenge || (matchMode ? !audio.responseFilter : !state.guess) || state.answered;
  el.newQuestion.disabled = state.loading || Boolean(state.challenge && !state.answered);
  el.sourceSelect.disabled = state.loading;
  el.replayChange.disabled = state.loading || feedbackMode || !state.challenge || !state.running;
  el.listenFlat.disabled = el.listenChanged.disabled = state.loading || !state.challenge;
  el.listenFlat.textContent = matchMode ? t("matchA") : "A · Flat";
  el.listenChanged.textContent = matchMode ? t("matchB") : "B · EQ";
  el.listenFlat.classList.toggle("active", !state.auditionChanged);
  el.listenChanged.classList.toggle("active", state.auditionChanged);
  el.listenFlat.setAttribute("aria-pressed", String(!state.auditionChanged));
  el.listenChanged.setAttribute("aria-pressed", String(state.auditionChanged));
  el.replayChange.textContent = t(state.abAlternating ? "stopReplay" : "replay");
  el.replayChange.classList.toggle("active", state.abAlternating);
  el.replayChange.setAttribute("aria-pressed", String(state.abAlternating));
  const intervalSeconds = getAbIntervalSeconds();
  const intervalLabel = intervalSeconds.toFixed(2).replace(/0$/, "");
  el.abIntervalReadout.textContent = `${intervalLabel} s`;
  el.abInterval.setAttribute("aria-valuetext", `${intervalLabel} s`);
  el.spectrumHidden.classList.toggle("hidden", matchMode || feedbackMode || el.showSpectrum.checked || state.answered);
  const sourceRange = SOURCE_FREQUENCY_RANGES[el.sourceSelect.value] ?? SOURCE_FREQUENCY_RANGES.pink;
  el.sourceRangeHint.textContent = `${t("questionRange")}: ${formatFrequency(sourceRange.min)}–${formatFrequency(sourceRange.max)}`;
  el.scoreReadout.textContent = state.result ? `${state.result.score} · ${t(state.result.rating)}` : "–";
  el.matchTargetLegend.textContent = t(state.answered ? "matchTargetCurve" : "matchHiddenCurve");
  for (const input of [el.matchFrequency, el.matchGain, el.matchQ, el.matchFlat]) {
    input.disabled = !matchMode || state.loading || !state.challenge || state.answered;
  }
  syncMatchView();
  setStatus(state.answered ? "answered" : state.challenge ? feedbackMode ? "feedback" : "listening" : "idle");
  updateStats();
}

function formatEq(eq) {
  return `${formatFrequency(eq.frequency)} · ${eq.gain > 0 ? "+" : ""}${eq.gain.toFixed(1)} dB · Q ${eq.q.toFixed(1)}`;
}

function syncMatchView(editedInput = null) {
  if (state.mode !== "eqMatch") { view.setEqMatch(); return; }
  // 入力中の「-」や小数点を描画更新で書き換えず、確定時に範囲内へ整える。
  if (editedInput !== el.matchFrequency) el.matchFrequency.value = String(Math.round(state.matchEq.frequency));
  if (editedInput !== el.matchGain) el.matchGain.value = state.matchEq.gain.toFixed(1);
  if (editedInput !== el.matchQ) el.matchQ.value = state.matchEq.q.toFixed(1);
  view.setEqMatch({
    user: state.matchEq,
    frequencies: EQ_MATCH_FREQUENCIES,
    userCurve: audio.getEqResponse(state.matchEq, EQ_MATCH_FREQUENCIES),
    // 正解の可視化は回答済みのときだけ。スペクトル表示設定では開示しない。
    targetCurve: state.answered ? audio.getEqResponse(state.challenge, EQ_MATCH_FREQUENCIES) : null,
    editable: Boolean(state.challenge && !state.answered && !state.loading),
  });
}

function applyChallenge() {
  if (!state.challenge) return;
  if (state.mode === "feedbackKiller") {
    if (state.guess) audio.setNotch({ frequency: state.guess, q: state.challenge.q });
    return;
  }
  if (state.mode === "eqMatch") {
    // A/Bは同じ音源の再生位置を保ったまま、1つのフィルタの係数だけを切り替える。
    audio.setEffect(state.auditionChanged ? state.matchEq : state.challenge);
  } else {
    const gain = state.auditionChanged ? state.challenge.gain : 0;
    audio.setEffect({ ...state.challenge, gain });
    audio.target.challengeGain = state.challenge.gain;
  }
  el.listenFlat.classList.toggle("active", !state.auditionChanged);
  el.listenChanged.classList.toggle("active", state.auditionChanged);
  el.listenFlat.setAttribute("aria-pressed", String(!state.auditionChanged));
  el.listenChanged.setAttribute("aria-pressed", String(state.auditionChanged));
}

async function startCurrentAudio() {
  const operation = ++state.audioOperation;
  state.loading = true;
  updateUi();
  try {
    let started;
    if (state.mode === "feedbackKiller" && state.challenge) {
      started = await audio.startFeedback(el.sourceSelect.value, {
        feedbackFrequency: state.challenge.frequency,
        notchFrequency: state.guess ?? state.challenge.initialNotch,
        q: state.challenge.q,
        feedbackLevel: 0.1,
      });
    } else {
      if (state.challenge) applyChallenge();
      else audio.setEffect({ frequency: 1000, gain: 0, q: 1 });
      started = await audio.start(el.sourceSelect.value);
    }
    if (operation !== state.audioOperation) return false;
    state.running = started;
    if (started) applyChallenge();
    return started;
  } catch (error) {
    if (operation !== state.audioOperation) return false;
    audio.stop();
    state.running = false;
    console.error(error);
    window.alert(t(["music", "speech"].includes(el.sourceSelect.value) ? "sampleError" : "audioError"));
    return false;
  } finally {
    if (operation === state.audioOperation) {
      state.loading = false;
      updateUi();
    }
  }
}

async function ensureRunning() {
  if (state.loading) return false;
  return state.running || startCurrentAudio();
}

async function toggleAudio() {
  if (state.running || state.loading) {
    state.audioOperation += 1;
    state.loading = false;
    stopAlternating(false);
    audio.stop();
    state.running = false;
    updateUi();
    return;
  }
  await ensureRunning();
}

async function newQuestion() {
  if (state.loading || (state.challenge && !state.answered)) return;
  stopAlternating(false);
  const frequencyRange = SOURCE_FREQUENCY_RANGES[el.sourceSelect.value] ?? SOURCE_FREQUENCY_RANGES.pink;
  const previousFrequency = state.challenge?.frequency;
  if (state.mode === "feedbackKiller") {
    state.challenge = createFeedbackChallenge(el.difficultySelect.value, previousFrequency, {
      frequencyRange,
      q: el.feedbackQSelect.value,
    });
    state.guess = state.challenge.initialNotch;
  } else if (state.mode === "eqMatch") {
    state.challenge = createEqMatchChallenge(el.difficultySelect.value, el.challengeTypeSelect.value, previousFrequency, {
      amountMode: el.eqAmountSelect.value, frequencyRange,
    });
    state.matchEq = { frequency: 1000, gain: 0, q: 1 };
    state.guess = null;
  } else {
    state.challenge = createChallenge(el.difficultySelect.value, el.challengeTypeSelect.value, previousFrequency, {
      amountMode: el.eqAmountSelect.value,
      frequencyRange,
    });
    state.guess = null;
  }
  state.answered = false;
  state.result = null;
  state.auditionChanged = state.mode !== "eqMatch";
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
  if (state.loading || !state.challenge || (state.mode !== "eqMatch" && !state.guess) || state.answered) return;
  if (state.mode === "eqMatch" && !audio.responseFilter) return;
  const result = state.mode === "eqMatch"
    ? scoreEqMatch(audio.getEqResponse(state.matchEq, EQ_MATCH_FREQUENCIES), audio.getEqResponse(state.challenge, EQ_MATCH_FREQUENCIES))
    : state.mode === "feedbackKiller"
    ? scoreFeedbackNotch(state.guess, state.challenge.frequency)
    : scoreGuess(state.guess, state.challenge.frequency);
  state.answered = true;
  state.result = result;
  state.stats[state.mode].scores.push(result.score);
  saveStats();
  el.scoreReadout.textContent = `${result.score} · ${t(result.rating)}`;
  view.setQuestion({ guess: state.guess, target: state.challenge.frequency, answered: true });
  updateUi();
}

function setAudition(changed) {
  if (!state.challenge || state.mode === "feedbackKiller") return;
  state.auditionChanged = changed;
  applyChallenge();
}

function stopAlternating(restoreChanged = true) {
  if (state.abTimer !== null) window.clearTimeout(state.abTimer);
  state.abTimer = null;
  state.abAlternating = false;
  if (restoreChanged && state.challenge && state.mode !== "feedbackKiller") setAudition(true);
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
  if (state.loading || state.mode === "feedbackKiller" || !state.running || !state.challenge) return;
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
  if (state.loading || !state.challenge || state.answered) return;
  state.guess = frequency;
  view.setQuestion({ guess: frequency });
  if (state.mode === "feedbackKiller") audio.setNotch({ frequency, q: state.challenge.q });
  el.guessReadout.textContent = formatFrequency(frequency);
  el.submitAnswer.disabled = false;
};

function updateMatchEq(changes, editedInput = null) {
  if (state.mode !== "eqMatch" || !state.challenge || state.answered || state.loading) return;
  const next = clampEq({ ...state.matchEq, ...changes });
  state.matchEq = {
    frequency: Math.round(next.frequency),
    gain: Math.round(next.gain * 10) / 10,
    q: Math.round(next.q * 10) / 10,
  };
  // 手動調整はBへ移して変化を即座に聴けるようにする。交互再生中は周期を維持する。
  if (!state.abAlternating) state.auditionChanged = true;
  applyChallenge();
  syncMatchView(editedInput);
  el.guessReadout.textContent = formatEq(state.matchEq);
}

view.onEqChange = updateMatchEq;
for (const [input, key] of [[el.matchFrequency, "frequency"], [el.matchGain, "gain"], [el.matchQ, "q"]]) {
  input.addEventListener("input", () => {
    if (input.value !== "" && Number.isFinite(input.valueAsNumber)) updateMatchEq({ [key]: input.valueAsNumber }, input);
  });
  input.addEventListener("change", () => {
    if (input.value === "" || !Number.isFinite(input.valueAsNumber)) { syncMatchView(); return; }
    updateMatchEq({ [key]: input.valueAsNumber });
  });
}
el.matchFlat.addEventListener("click", () => updateMatchEq({ gain: 0 }));

function switchMode(mode) {
  if (state.mode === mode) return;
  stopAlternating(false);
  state.audioOperation += 1;
  state.loading = false;
  audio.stop();
  state.mode = mode;
  state.running = false;
  state.challenge = null;
  state.guess = null;
  state.answered = false;
  state.auditionChanged = true;
  state.questionNumber = 0;
  state.matchEq = { frequency: 1000, gain: 0, q: 1 };
  state.result = null;
  el.scoreReadout.textContent = "–";
  view.setQuestion();
  updateUi();
}

el.startStop.addEventListener("click", toggleAudio);
el.modeFrequencyHunt.addEventListener("click", () => switchMode("frequencyHunt"));
el.modeFeedbackKiller.addEventListener("click", () => switchMode("feedbackKiller"));
el.modeEqMatch.addEventListener("click", () => switchMode("eqMatch"));
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
  await startCurrentAudio();
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
