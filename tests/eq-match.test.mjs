import test from "node:test";
import assert from "node:assert/strict";
import { createEqMatchChallenge, clampEq, scoreEqMatch, EQ_MATCH_FREQUENCIES } from "../src/eq-match.js";
import { SOURCE_FREQUENCY_RANGES } from "../src/frequency-hunt.js";
import { AudioEngine } from "../src/audio-engine.js";

test("curve score: exact=100, flat=0, inverse=0; approaching target improves score", () => {
  const target = [0, 1, 3, 6, 3, 1, 0];
  assert.equal(scoreEqMatch(target, target).score, 100);
  assert.equal(scoreEqMatch(target.map(() => 0), target).score, 0);
  assert.equal(scoreEqMatch(target.map(x => -x), target).score, 0);
  assert.equal(scoreEqMatch(target.map(x => x / 2), target).score, 75);
  assert.ok(scoreEqMatch(target.map(x => x * 0.9), target).score > 75);
});

test("scores are unchanged by shifting a shape along log-frequency bins", () => {
  const scores = [10, 100, 400].map(offset => {
    const target = Array(512).fill(0), user = Array(512).fill(0);
    [1, 3, 6, 3, 1].forEach((gain, i) => { target[offset + i] = gain; user[offset + i + 1] = gain; });
    return scoreEqMatch(user, target).score;
  });
  assert.equal(scores[0], scores[1]);
  assert.equal(scores[1], scores[2]);
  assert.throws(() => scoreEqMatch([1], [1, 2]));
  assert.throws(() => scoreEqMatch([NaN], [1]));
});

test("questions respect every source range and direction and preserve amount settings", () => {
  for (const difficulty of ["beginner", "standard", "expert"]) {
    for (const range of Object.values(SOURCE_FREQUENCY_RANGES)) {
      for (const type of ["boost", "cut"]) {
        for (let i = 0; i < 40; i++) {
          const problem = createEqMatchChallenge(difficulty, type, null, { frequencyRange: range, amountMode: "6" });
          assert.ok(problem.frequency >= range.min && problem.frequency <= range.max);
          assert.equal(problem.gain, type === "cut" ? -6 : 6);
          assert.ok([0.7, 1, 2, 4].includes(problem.q));
        }
      }
    }
  }
});

test("EQ control limits and logarithmic response grid", () => {
  assert.deepEqual(clampEq({ frequency: -5, gain: 99, q: 0 }), { frequency: 20, gain: 12, q: 0.3 });
  assert.deepEqual(clampEq({ frequency: 99999, gain: -99, q: 99 }), { frequency: 20000, gain: -12, q: 12 });
  assert.deepEqual(clampEq({}), { frequency: 1000, gain: 0, q: 1 });
  assert.equal(EQ_MATCH_FREQUENCIES[0], 20);
  assert.equal(EQ_MATCH_FREQUENCIES.at(-1), 20000);
});

test("stop during file loading cancels pending playback before creating any nodes", async () => {
  const audio = new AudioEngine();
  let resolveMusic;
  let loadingStarted;
  const loading = new Promise(resolve => { loadingStarted = resolve; });
  audio.ensureContext = async () => {};
  audio.loadMusic = () => { loadingStarted(); return new Promise(resolve => { resolveMusic = resolve; }); };
  const pending = audio.start("music");
  await loading;
  audio.stop();
  resolveMusic({});
  assert.equal(await pending, false);
  assert.equal(audio.source, null);
  assert.equal(audio.filter, null);
});

test("a late file load cannot overwrite a newer playback request", async () => {
  const audio = new AudioEngine();
  let resolveOld, resolveNew;
  const oldStarted = new Promise(resolve => { resolveOld = resolve; });
  const newStarted = new Promise(resolve => { resolveNew = resolve; });
  let finishOld, finishNew;
  audio.ensureContext = async () => {};
  audio.loadMusic = () => { resolveOld(); return new Promise(resolve => { finishOld = resolve; }); };
  audio.loadSpeech = () => { resolveNew(); return new Promise(resolve => { finishNew = resolve; }); };
  const oldRequest = audio.start("music");
  await oldStarted;
  const newRequest = audio.start("speech");
  await newStarted;
  finishOld({});
  assert.equal(await oldRequest, false);
  audio.stop();
  finishNew({});
  assert.equal(await newRequest, false);
});
