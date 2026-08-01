# PA Ear Training

PAオペレーター向けの、ブラウザで動作する聴覚・周波数トレーニングツールです。

最初のモードとして **Frequency Hunt** を実装しています。ピンクノイズまたは音楽に隠されたピーキングEQの変化を聴き、変化した中心周波数をスペクトル上で回答します。

## 現在の機能

- ピンクノイズ／ホワイトノイズ／内蔵音楽／英語音声を使った周波数判別
- Flat（A）とEQ適用後（B）の比較試聴
- Boost、Cut、ランダム出題
- 初級、標準、上級の難易度
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
├── armstrong-small-step.ogg
├── src/
│   ├── main.js
│   ├── audio-engine.js
│   ├── frequency-hunt.js
│   ├── spectrum-view.js
│   └── i18n.js
└── mix.mp3
```

## 音声素材

`armstrong-small-step.ogg` は、Wikimedia Commonsで公開されている24秒のNASA音声です。

- 作品: [Armstrong Small Step.ogg](https://commons.wikimedia.org/wiki/File:Armstrong_Small_Step.ogg)
- 内容: Apollo 11でNeil Armstrongが月面へ降り立った際の英語音声
- 作者／出典: Neil Armstrong / NASA
- 権利表示: 米国政府（NASA）の著作物として米国内でパブリックドメイン

## 関連プロジェクト

画面デザイン、Web Audio APIによる音声処理、対数周波数軸、Canvas描画、Pointer Events、多言語化の設計は、[AudioEQandSynthesis](https://github.com/d-kitamura/AudioEQandSynthesis) を参考にしています。

本プロジェクトはPAトレーニング専用で、EQシミュレータおよび合成音生成モードは含みません。

## License

ライセンスはまだ指定されていません。
