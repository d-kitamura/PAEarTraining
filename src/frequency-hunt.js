const OCTAVE_FREQUENCIES = [63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const THIRD_OCTAVE_FREQUENCIES = [50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000];
const GRAPH_LOG_RANGE = Math.log10(20000 / 20);
const ZERO_SCORE_DISTANCE = 0.18;

const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

export const DIFFICULTIES = {
  beginner: { q: 1.1, defaultAmount: "random-intermediate" },
  standard: { q: 2, defaultAmount: "random-intermediate" },
  expert: { q: 3.5, defaultAmount: "random-intermediate" },
};

export const SOURCE_FREQUENCY_RANGES = {
  pink: { min: 63, max: 12500 },
  white: { min: 63, max: 12500 },
  music: { min: 63, max: 4000 },
  speech: { min: 100, max: 4000 },
};

function resolveAmount(difficulty, amountMode) {
  if (amountMode === "random-beginner") return Math.round((6 + Math.random() * 6) * 10) / 10;
  if (amountMode === "random-intermediate") return Math.round((3 + Math.random() * 6) * 10) / 10;
  if (amountMode === "random-expert") return Math.round((3 + Math.random() * 3) * 10) / 10;
  const fixed = Number(amountMode);
  if (Number.isFinite(fixed) && fixed >= 3 && fixed <= 12) return fixed;
  return resolveAmount(difficulty, DIFFICULTIES[difficulty]?.defaultAmount ?? "6");
}

export function createChallenge(difficulty, type, previousFrequency = null, options = {}) {
  const settings = DIFFICULTIES[difficulty] ?? DIFFICULTIES.standard;
  const range = options.frequencyRange ?? SOURCE_FREQUENCY_RANGES.pink;
  let frequency;
  let attempts = 0;
  do {
    if (difficulty === "beginner") {
      frequency = randomItem(OCTAVE_FREQUENCIES.filter((value) => value >= range.min && value <= range.max));
    } else if (difficulty === "standard") {
      frequency = randomItem(THIRD_OCTAVE_FREQUENCIES.filter((value) => value >= range.min && value <= range.max));
    } else {
      frequency = 10 ** (Math.log10(range.min) + Math.random() * (Math.log10(range.max) - Math.log10(range.min)));
    }
    attempts += 1;
  } while (attempts < 20 && previousFrequency && Math.abs(Math.log2(frequency / previousFrequency)) < 0.08);

  const direction = type === "random" ? randomItem(["boost", "cut"]) : type;
  const amount = resolveAmount(difficulty, options.amountMode ?? settings.defaultAmount);
  const gain = amount * (direction === "cut" ? -1 : 1);
  return { frequency, gain, q: settings.q, direction, difficulty };
}

export function scoreGuess(guess, target) {
  const cents = Math.abs(1200 * Math.log2(guess / target));
  const graphDistance = Math.abs(Math.log10(guess / target)) / GRAPH_LOG_RANGE;
  const score = Math.max(0, Math.round(100 * (1 - graphDistance / ZERO_SCORE_DISTANCE)));
  let rating = "keepTrying";
  if (score >= 90) rating = "excellent";
  else if (score >= 75) rating = "great";
  else if (score >= 40) rating = "close";
  return { cents, graphDistance, score, rating };
}

export function formatFrequency(frequency) {
  if (!Number.isFinite(frequency)) return "– Hz";
  if (frequency >= 1000) {
    const value = frequency / 1000;
    return `${value >= 10 ? value.toFixed(1) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")} kHz`;
  }
  return `${Math.round(frequency)} Hz`;
}
