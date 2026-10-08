export const messages = {
  en: {
    eqMatch: "EQ Match", eqMatchShort: "Recreate the target EQ",
    matchReady: "Create a question to hear the target, then recreate it with one peaking EQ band.",
    matchListening: "Compare A (target) with B (your EQ). Drag to adjust frequency and gain; use the wheel or Q field for width.",
    matchAnswered: "Green is your EQ; dashed orange is the target. Compare the curves and listen again with A/B.",
    matchTarget: "Target EQ", matchUser: "Your EQ", matchA: "A · Target", matchB: "B · Your EQ",
    matchYourEq: "Your EQ · 1 peaking band", matchControls: "Match the sound",
    matchFreq: "Frequency (Hz)", matchGain: "Gain (dB)", matchQ: "Q (width)", matchFlat: "Flatten your EQ",
    matchEditHint: "Drag: frequency / gain. Wheel: Q. Double-click: flatten. Editing switches to B, except during alternating playback.",
    matchUserCurve: "Green: your EQ", matchTargetCurve: "Dashed orange: target EQ", matchHiddenCurve: "Target curve appears after answering",
    matchTip: "Find the frequency first, then match boost/cut and width. Scores compare the complete EQ curves on a logarithmic frequency axis; an unchanged flat EQ scores zero.",
    subtitle: "Practical frequency training for live sound", start: "Start audio", stop: "Stop audio", master: "Master", language: "Language",
    frequencyHuntShort: "Find the changed frequency", feedbackKillerShort: "Find and suppress feedback", moreModes: "More PA training modes will follow", exercise: "Exercise", frequencyHunt: "Frequency Hunt", feedbackKiller: "Feedback Killer",
    instructionReady: "Start the audio, then create a question.", instructionListening: "Compare A and B, then click or drag on the graph to place your guess.",
    instructionAnswered: "Orange is the target. Listen again and connect the sound with its frequency.", ready: "Ready", listening: "Listening", result: "Result",
    question: "Question", change: "Change", yourGuess: "Your guess", score: "Score", hidden: "Hidden", boostLabel: "Boost", cutLabel: "Cut",
    listenFirst: "Listen first", spectrumHidden: "The spectrum appears after you answer", newQuestion: "New question", submit: "Submit answer", replay: "Alternate A/B", stopReplay: "Stop alternating", switchInterval: "Interval",
    feedbackReady: "Start the audio, then create a feedback problem.", feedbackListening: "Drag the notch across the graph and stop where the ringing is weakest.", feedbackAnswered: "Orange is the feedback frequency. Compare it with your green notch position.", feedbackFrequency: "Feedback", notchFrequency: "Your notch", notchWidth: "Notch width", notchWide: "Wide · Q 4", notchStandard: "Standard · Q 8", notchNarrow: "Narrow · Q 12", feedbackStatus: "Feedback active", notchMarker: "NOTCH", feedbackMarker: "FEEDBACK", feedbackTip: "Sweep a narrow cut slowly. When the ringing drops, move back and forth in smaller steps before locking your answer.",
    showSpectrum: "Show spectrum while answering", sessionSetup: "Session setup", trainingSettings: "Training settings", source: "Source", pinkNoise: "Pink noise", whiteNoise: "White noise",
    music: "Music (mix.mp3)", speech: "Speech (English reading)", difficulty: "Changed frequency", beginner: "Octave steps · Beginner", standard: "1/3-octave steps · Intermediate", expert: "Continuous frequency · Advanced", questionRange: "Question range",
    eqAmount: "EQ amount", amount12: "12 dB", amount9: "9 dB", amount6: "6 dB", amount3: "3 dB", amountRandomBeginner: "Random · 6–12 dB (Beginner)", amountRandomIntermediate: "Random · 3–9 dB (Intermediate)", amountRandomExpert: "Random · 3–6 dB (Advanced)",
    challengeType: "Challenge type", boost: "Boost", cut: "Cut", random: "Random boost / cut", audition: "Audition", session: "Session", progress: "Progress",
    reset: "Reset", answered: "Answered", average: "Average", best: "Best", paTip: "PA tip",
    tipText: "Compare A and B repeatedly. Focus on the character of the sound before naming a number.", safety: "Safety",
    safetyText: "Start at a low Master level. Take breaks and never train at an uncomfortable volume.", excellent: "Excellent", great: "Great", close: "Close", keepTrying: "Keep listening",
    audioError: "Audio could not be started. Run this project through a local web server.", sampleError: "The selected audio file could not be loaded. Try a noise source or check the local server.",
  },
  ja: {
    eqMatch: "EQ Match", eqMatchShort: "目標のEQを耳で再現する",
    matchReady: "「新しい問題」で目標音を聴き、1バンドのピーキングEQで同じ音を作りましょう。",
    matchListening: "A（目標音）とB（自分のEQ）を比較します。ドラッグで周波数・ゲイン、ホイールまたはQ欄で幅を調整してください。",
    matchAnswered: "緑色が自分のEQ、オレンジの破線が目標です。カーブを比べ、A/Bでもう一度聴いてみましょう。",
    matchTarget: "目標EQ", matchUser: "自分のEQ", matchA: "A · 目標音", matchB: "B · 自分のEQ",
    matchYourEq: "自分のEQ · ピーキング1バンド", matchControls: "目標音に合わせる",
    matchFreq: "周波数（Hz）", matchGain: "ゲイン（dB）", matchQ: "Q（幅）", matchFlat: "自分のEQをフラットに",
    matchEditHint: "ドラッグ：周波数・ゲイン／ホイール：Q／ダブルクリック：フラット。調整するとBへ切り替わります（交互再生中を除く）。",
    matchUserCurve: "緑：自分のEQ", matchTargetCurve: "オレンジの破線：目標EQ", matchHiddenCurve: "目標カーブは回答後に表示",
    matchTip: "周波数を探し、次にブースト／カット量と幅を合わせましょう。対数周波数軸上のEQカーブ全体の近さで採点します。フラットのままは0点です。",
    subtitle: "ライブサウンドのための実践的な周波数トレーニング", start: "音を開始", stop: "音を停止", master: "マスター", language: "言語",
    frequencyHuntShort: "変化した周波数を当てる", feedbackKillerShort: "ハウリングを探して抑える", moreModes: "PAトレーニングモードを順次追加予定", exercise: "エクササイズ", frequencyHunt: "Frequency Hunt", feedbackKiller: "Feedback Killer",
    instructionReady: "音を開始して、新しい問題を作成してください。", instructionListening: "AとBを聴き比べ、グラフ上をクリックまたはドラッグして回答位置を決めます。",
    instructionAnswered: "オレンジ色が正解です。もう一度聴いて、音の特徴と周波数を結び付けましょう。", ready: "準備完了", listening: "出題中", result: "結果",
    question: "問題", change: "変化", yourGuess: "あなたの回答", score: "スコア", hidden: "非表示", boostLabel: "ブースト", cutLabel: "カット",
    listenFirst: "まず耳で聴きましょう", spectrumHidden: "回答後にスペクトルを表示します", newQuestion: "新しい問題", submit: "回答する", replay: "A/Bを交互再生", stopReplay: "交互再生を停止", switchInterval: "切替",
    feedbackReady: "音を開始して、フィードバック問題を作成してください。", feedbackListening: "グラフ上でノッチを動かし、発振音が最も弱くなる位置を探してください。", feedbackAnswered: "オレンジ色がフィードバック周波数です。緑色のノッチ位置と比べてください。", feedbackFrequency: "フィードバック", notchFrequency: "ノッチ位置", notchWidth: "ノッチ幅", notchWide: "広い · Q 4", notchStandard: "標準 · Q 8", notchNarrow: "狭い · Q 12", feedbackStatus: "発振中", notchMarker: "ノッチ", feedbackMarker: "発振", feedbackTip: "細いカットをゆっくりスイープし、発振音が弱くなったら往復幅を小さくして位置を追い込みましょう。",
    showSpectrum: "回答中もスペクトルを表示", sessionSetup: "セッション設定", trainingSettings: "トレーニング設定", source: "音源", pinkNoise: "ピンクノイズ", whiteNoise: "ホワイトノイズ",
    music: "音楽（mix.mp3）", speech: "音声（英語朗読）", difficulty: "変化周波数", beginner: "オクターブ刻み（初級）", standard: "1/3オクターブ刻み（中級）", expert: "連続周波数（上級）", questionRange: "出題範囲",
    eqAmount: "EQ変化量", amount12: "12 dB", amount9: "9 dB", amount6: "6 dB", amount3: "3 dB", amountRandomBeginner: "6～12 dBランダム（初級）", amountRandomIntermediate: "3～9 dBランダム（中級）", amountRandomExpert: "3～6 dBランダム（上級）",
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
