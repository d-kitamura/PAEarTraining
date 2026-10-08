# PA Ear Training

PAオペレーター向けの、ブラウザで動作する聴覚・周波数トレーニングツールです。

公開版: [PA Ear Training](https://d-kitamura.github.io/PAEarTraining/)（GitHub Pages、mainへのpushで自動デプロイ）

**Frequency Hunt**（変化した周波数を当てる）、**Feedback Killer**（ノッチで模擬ハウリングを抑える）、**EQ Match**（目標のEQを再現する）の3モードを実装しています。

開発の段階は [ROADMAP.md](ROADMAP.md)、仕様判断と利用者への確認事項は [DECISIONS.md](DECISIONS.md) で管理します。

## 現在の機能

- ピンクノイズ／ホワイトノイズ／内蔵音楽／英語音声を使った周波数判別
- Flat（A）とEQ適用後（B）の比較試聴
- 0.2～1.0秒で速度調整できるA/B交互再生
- Feedback Killer：音源に混ざった発振周波数を、リアルタイム操作のノッチフィルタで探索・抑制
- Feedback Killerのノッチ幅（Q 4／8／12）と独立した成績記録
- EQ Match：1バンドの周波数・ゲイン・Qを調整し、目標音と比較
- EQ Matchの対数周波数軸上のEQカーブ採点、回答後の正解カーブ表示
- Boost、Cut、ランダム出題
- 3／6／9／12 dBの固定変化量
- 6～12 dB（初級）、3～9 dB（中級）、3～6 dB（上級）のランダム変化量
- オクターブ、1/3オクターブ、連続周波数から変化周波数を選択
- 音源の平均スペクトルに合わせた出題周波数範囲
- 対数周波数軸上でのクリック／ドラッグ回答
- 20 Hz～20 kHzの対数グラフ上の距離による採点
- 回答後のターゲットとリアルタイムスペクトル表示
- スコア、平均、ベストスコアのブラウザ保存
- 日本語／英語表示
- PC、タブレット、スマートフォン対応

## EQ Match の使い方

1. 「03 EQ Match」を選び、「新しい問題」を押すと A（目標音）が再生されます。
2. 緑の点を横に動かして周波数、縦に動かしてゲインを調整します。Qはグラフ上のホイール、または数値欄で変更できます。タッチ操作でも周波数・ゲインを動かせます。
3. A（目標音）と B（自分のEQ）を切り替えて聴き比べます。「A/Bを交互再生」も利用できます。手動調整はBへ切り替わり、交互再生中は設定周期を維持します。
4. 「回答する」で調整を確定すると、オレンジの破線で目標カーブを表示し、目標の周波数・ゲイン・Qとスコアを確認できます。回答済みのパラメータは固定され、A/Bで復習できます。

初版はピーキング1バンドです。操作範囲は20 Hz～20 kHz、±12 dB、Q 0.3～12。目標の周波数・変化量・ブースト／カットには既存の出題設定を使い、目標Qは0.7／1／2／4からランダムに選びます。ダブルクリックまたは「自分のEQをフラットに」でゲインを0 dBに戻せます。

### 採点

20 Hz～20 kHzを対数等間隔に区切った512点で、実際のWeb AudioフィルタのdB応答を比較します。スコアは `100 × max(0, 1 − Σ(自分 − 目標)² / Σ目標²)` を四捨五入した値です。完全一致は100点、フラットのままは0点になります。変化がない広い帯域だけを合わせて高得点になることを防ぐため、目標EQの変化量で正規化しています。これは聴感上の一致度の厳密なモデルではなく、EQ応答の練習用指標です。

### 音声処理とモード切替

A/B比較中は音源を再起動せず、同じピーキングフィルタの係数を短時間で補間します。グラフと採点には未接続の計測用フィルタを使い、再生中の音には影響させません。モード切替・停止で未完了の読み込み要求を無効化し、古い音源が後から再生を始めないようにしています。モードを切り替えると現在の問題は初期化され、成績はモード別にブラウザへ保存されます。

## ローカルで実行する

JavaScript Modulesと音声ファイルを使用するため、`index.html` を直接開かずローカルWebサーバー経由で実行してください。

```powershell
python -m http.server 8000
```

その後、<http://localhost:8000> を開きます。

## ファイル構成

```text
PAEarTraining/
├── index.html
├── styles.css
├── ROADMAP.md
├── DECISIONS.md
├── speech-udhr-en.ogg
├── src/
│   ├── main.js
│   ├── audio-engine.js
│   ├── frequency-hunt.js
│   ├── feedback-killer.js
│   ├── eq-match.js
│   ├── spectrum-view.js
│   └── i18n.js
├── tests/
│   ├── eq-match.test.mjs
│   ├── audio-browser.html
│   └── audio-browser.js
└── mix.mp3
```

## 検証

Node.js（ES Modulesに対応した現在のランタイム）で `node --test tests/eq-match.test.mjs` を実行します。採点の不変条件、出題範囲、操作範囲、読み込み中の停止と競合を検証します。

ローカルサーバー起動後に `/tests/audio-browser.html` を開くと、OfflineAudioContextで44.1 kHz／48 kHzの応答・採点・実際のフィルタ出力を検証します。このテストはスピーカーへ音を出しません。画面でのドラッグ、数値入力、A/B、回答、モード切替は別途ブラウザで確認します。

## 音声素材

`speech-udhr-en.ogg` は、Wikimedia Commonsで公開されている18秒の英語朗読です。

- 作品: [Universal Declaration of Human Rights - eng - drb - Art1.ogg](https://commons.wikimedia.org/wiki/File:Universal_Declaration_of_Human_Rights_-_eng_-_drb_-_Art1.ogg)
- 内容: 世界人権宣言第1条の英語朗読
- 作者／出典: David Barnes / LibriVox
- 権利表示: Creative Commons Public Domain Dedicationによるパブリックドメイン

## 出題周波数範囲

各ファイルの平均スペクトルと一般的な再生機器の帯域を考慮し、出題範囲を次のように制限しています。

- ピンクノイズ／ホワイトノイズ: 63 Hz～12.5 kHz
- 音楽（`mix.mp3`）: 63 Hz～4 kHz
- 英語朗読: 100 Hz～4 kHz

`mix.mp3` はノイズ音源との音量感を近づけるため、+6 dBのプリゲイン後にピークリミッターを適用し、約-9.6 LUFS / -1.0 dBTPへ調整しています。

## 関連プロジェクト

画面デザイン、Web Audio APIによる音声処理、対数周波数軸、Canvas描画、Pointer Events、多言語化の設計は、[AudioEQandSynthesis](https://github.com/d-kitamura/AudioEQandSynthesis) を参考にしています。

本プロジェクトはPAトレーニング専用で、EQシミュレータおよび合成音生成モードは含みません。

## License

ライセンスはまだ指定されていません。
