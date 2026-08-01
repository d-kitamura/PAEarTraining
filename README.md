# PA Ear Training

PAオペレーター向けの、ブラウザで動作する聴覚・周波数トレーニングツールです。

最初のモードとして **Frequency Hunt** を実装しています。ピンクノイズまたは音楽に隠されたピーキングEQの変化を聴き、変化した中心周波数をスペクトル上で回答します。

## 現在の機能

- ピンクノイズ／内蔵音楽を使った周波数判別
- Flat（A）とEQ適用後（B）の比較試聴
- Boost、Cut、ランダム出題
- 初級、標準、上級の難易度
- 対数周波数軸上でのクリック／ドラッグ回答
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
├── src/
│   ├── main.js
│   ├── audio-engine.js
│   ├── frequency-hunt.js
│   ├── spectrum-view.js
│   └── i18n.js
└── mix.mp3
```

## 関連プロジェクト

画面デザイン、Web Audio APIによる音声処理、対数周波数軸、Canvas描画、Pointer Events、多言語化の設計は、[AudioEQandSynthesis](https://github.com/d-kitamura/AudioEQandSynthesis) を参考にしています。

本プロジェクトはPAトレーニング専用で、EQシミュレータおよび合成音生成モードは含みません。

## License

ライセンスはまだ指定されていません。
