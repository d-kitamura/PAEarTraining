# PA Ear Training

PAオペレーター向けの、ブラウザで動作する聴覚・周波数トレーニングツールです。

最初のモードとして **Frequency Hunt** を実装しています。ピンクノイズまたは音楽に隠されたピーキングEQの変化を聴き、変化した中心周波数をスペクトル上で回答します。

## 現在の機能

- ピンクノイズ／ホワイトノイズ／内蔵音楽／英語音声を使った周波数判別
- Flat（A）とEQ適用後（B）の比較試聴
- 0.2～1.0秒で速度調整できるA/B交互再生
- Feedback Killer：音源に混ざった発振周波数を、リアルタイム操作のノッチフィルタで探索・抑制
- Feedback Killerのノッチ幅（Q 4／8／12）と独立した成績記録
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
├── speech-udhr-en.ogg
├── src/
│   ├── main.js
│   ├── audio-engine.js
│   ├── frequency-hunt.js
│   ├── spectrum-view.js
│   └── i18n.js
└── mix.mp3
```

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
