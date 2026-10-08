import { createChallenge } from "./frequency-hunt.js";

export const EQ_MATCH_LIMITS = {
  frequency: { min: 20, max: 20000 },
  gain: { min: -12, max: 12 },
  q: { min: 0.3, max: 12 },
};

// 対数等間隔で評価し、低域・高域をHz単位の差で不公平に扱わない。
export const EQ_MATCH_FREQUENCIES = Float32Array.from(
  { length: 512 }, (_, index) => 20 * 1000 ** (index / 511),
);

export function createEqMatchChallenge(difficulty, type, previousFrequency, options) {
  const target = createChallenge(difficulty, type, previousFrequency, options);
  const qChoices = [0.7, 1, 2, 4];
  return { ...target, q: qChoices[Math.floor(Math.random() * qChoices.length)] };
}

export function clampEq(parameters) {
  return Object.fromEntries(Object.entries(EQ_MATCH_LIMITS).map(([key, limits]) => {
    const value = Number(parameters[key]);
    const fallback = { frequency: 1000, gain: 0, q: 1 }[key];
    return [key, Math.min(limits.max, Math.max(limits.min, Number.isFinite(value) ? value : fallback))];
  }));
}

// 曲線はWeb Audio自身のgetFrequencyResponseで算出するため、可視化と実際のEQが一致する。
// 空の帯域が多くても高得点にならないよう、目標の変化量で誤差を正規化する。
export function scoreEqMatch(userDb, targetDb) {
  if (!userDb.length || userDb.length !== targetDb.length) throw new Error("EQ response sizes must match.");
  let errorEnergy = 0;
  let targetEnergy = 0;
  for (let i = 0; i < targetDb.length; i += 1) {
    if (!Number.isFinite(userDb[i]) || !Number.isFinite(targetDb[i])) throw new Error("Invalid EQ response.");
    errorEnergy += (userDb[i] - targetDb[i]) ** 2;
    targetEnergy += targetDb[i] ** 2;
  }
  const similarity = targetEnergy > 1e-8 ? 1 - errorEnergy / targetEnergy : errorEnergy < 1e-8 ? 1 : 0;
  const score = Math.round(100 * Math.max(0, Math.min(1, similarity)));
  const rating = score >= 90 ? "excellent" : score >= 75 ? "great" : score >= 40 ? "close" : "keepTrying";
  return { score, rating, rmsError: Math.sqrt(errorEnergy / targetDb.length) };
}
