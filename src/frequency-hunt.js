const OCTAVE_FREQUENCIES = [63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const THIRD_OCTAVE_FREQUENCIES = [50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000];
const GRAPH_LOG_RANGE = Math.log10(20000 / 20);
const ZERO_SCORE_DISTANCE = 0.18;

const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

export const DIFFICULTIES = {
  beginner: { gain: 12, q: 1.1 },
  standard: { gain: 9, q: 2 },
  expert: { gain: 6, q: 3.5 },
};

export function createChallenge(difficulty, type, previousFrequency = null) {
  const settings = DIFFICULTIES[difficulty] ?? DIFFICULTIES.standard;
  let frequency;
  do {
    if (difficulty === "beginner") frequency = randomItem(OCTAVE_FREQUENCIES);
    else if (difficulty === "standard") frequency = randomItem(THIRD_OCTAVE_FREQUENCIES);
    else frequency = 10 ** (Math.log10(40) + Math.random() * (Math.log10(16000) - Math.log10(40)));
  } while (previousFrequency && Math.abs(Math.log2(frequency / previousFrequency)) < 0.08);

  const direction = type === "random" ? randomItem(["boost", "cut"]) : type;
  const gain = settings.gain * (direction === "cut" ? -1 : 1);
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
