export const messages = {
  en: {
    subtitle: "Practical frequency training for live sound", start: "Start audio", stop: "Stop audio", master: "Master", language: "Language",
    frequencyHuntShort: "Find the changed frequency", moreModes: "More PA training modes will follow", exercise: "Exercise", frequencyHunt: "Frequency Hunt",
    instructionReady: "Start the audio, then create a question.", instructionListening: "Compare A and B, then click or drag on the graph to place your guess.",
    instructionAnswered: "Orange is the target. Listen again and connect the sound with its frequency.", ready: "Ready", listening: "Listening", result: "Result",
    question: "Question", change: "Change", yourGuess: "Your guess", score: "Score", hidden: "Hidden", boostLabel: "Boost", cutLabel: "Cut",
    listenFirst: "Listen first", spectrumHidden: "The spectrum appears after you answer", newQuestion: "New question", submit: "Submit answer", replay: "Replay A/B",
    showSpectrum: "Show spectrum while answering", sessionSetup: "Session setup", trainingSettings: "Training settings", source: "Source", pinkNoise: "Pink noise", whiteNoise: "White noise",
    music: "Music (mix.mp3)", speech: "Speech (Apollo 11)", difficulty: "Difficulty", beginner: "Beginner · octave bands", standard: "Standard · 1/3 octave", expert: "Expert · continuous",
    challengeType: "Challenge type", boost: "Boost", cut: "Cut", random: "Random boost / cut", audition: "Audition", session: "Session", progress: "Progress",
    reset: "Reset", answered: "Answered", average: "Average", best: "Best", paTip: "PA tip",
    tipText: "Compare A and B repeatedly. Focus on the character of the sound before naming a number.", safety: "Safety",
    safetyText: "Start at a low Master level. Take breaks and never train at an uncomfortable volume.", excellent: "Excellent", great: "Great", close: "Close", keepTrying: "Keep listening",
    audioError: "Audio could not be started. Run this project through a local web server.", sampleError: "The selected audio file could not be loaded. Try a noise source or check the local server.",
  },
  ja: {
    subtitle: "ライブサウンドのための実践的な周波数トレーニング", start: "音を開始", stop: "音を停止", master: "マスター", language: "言語",
    frequencyHuntShort: "変化した周波数を当てる", moreModes: "PAトレーニングモードを順次追加予定", exercise: "エクササイズ", frequencyHunt: "Frequency Hunt",
    instructionReady: "音を開始して、新しい問題を作成してください。", instructionListening: "AとBを聴き比べ、グラフ上をクリックまたはドラッグして回答位置を決めます。",
    instructionAnswered: "オレンジ色が正解です。もう一度聴いて、音の特徴と周波数を結び付けましょう。", ready: "準備完了", listening: "出題中", result: "結果",
    question: "問題", change: "変化", yourGuess: "あなたの回答", score: "スコア", hidden: "非表示", boostLabel: "ブースト", cutLabel: "カット",
    listenFirst: "まず耳で聴きましょう", spectrumHidden: "回答後にスペクトルを表示します", newQuestion: "新しい問題", submit: "回答する", replay: "A/Bを再生",
    showSpectrum: "回答中もスペクトルを表示", sessionSetup: "セッション設定", trainingSettings: "トレーニング設定", source: "音源", pinkNoise: "ピンクノイズ", whiteNoise: "ホワイトノイズ",
    music: "音楽（mix.mp3）", speech: "音声（Apollo 11）", difficulty: "難易度", beginner: "初級 · オクターブ帯域", standard: "標準 · 1/3オクターブ", expert: "上級 · 連続周波数",
    challengeType: "出題形式", boost: "ブースト", cut: "カット", random: "ブースト／カットをランダム", audition: "試聴", session: "セッション", progress: "成績",
    reset: "リセット", answered: "回答数", average: "平均", best: "ベスト", paTip: "PAのヒント",
    tipText: "AとBを繰り返し比較し、数値を考える前に音のキャラクターへ集中しましょう。", safety: "安全について",
    safetyText: "マスター音量を低くして開始してください。不快な音量を避け、適度に休憩しましょう。", excellent: "素晴らしい", great: "良い耳です", close: "惜しい", keepTrying: "聴き続けましょう",
    audioError: "音声を開始できませんでした。ローカルWebサーバー経由で開いてください。", sampleError: "選択した音声ファイルを読み込めませんでした。ノイズ音源を選ぶか、ローカルサーバーを確認してください。",
  },
};

export function translateDocument(language) {
  const dictionary = messages[language] ?? messages.en;
  document.documentElement.lang = language;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = dictionary[element.dataset.i18n];
    if (value) element.textContent = value;
  });
}
