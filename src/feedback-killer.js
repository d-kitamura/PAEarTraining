const OCTAVE_FREQUENCIES = [63, 125, 250, 500, 1000, 2000, 4000, 8000, 12500];
const THIRD_OCTAVE_FREQUENCIES = [63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

export function createFeedbackChallenge(difficulty, previousFrequency = null, options = {}) {
  const range = options.frequencyRange ?? { min: 63, max: 12500 };
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
  } while (attempts < 20 && previousFrequency && Math.abs(Math.log2(frequency / previousFrequency)) < 0.2);

  const offset = (0.65 + Math.random() * 0.7) * (Math.random() < 0.5 ? -1 : 1);
  const initialNotch = clamp(frequency * (2 ** offset), range.min, range.max);
  return { frequency, initialNotch, q: Number(options.q) || 8, difficulty };
}

export function scoreFeedbackNotch(notchFrequency, feedbackFrequency) {
  const octaveError = Math.abs(Math.log2(notchFrequency / feedbackFrequency));
  const score = Math.max(0, Math.round(100 * (1 - octaveError / 1.25)));
  let rating = "keepTrying";
  if (score >= 90) rating = "excellent";
  else if (score >= 75) rating = "great";
  else if (score >= 40) rating = "close";
  return { octaveError, score, rating };
}
