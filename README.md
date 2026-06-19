# 物理シミュレーター

GitHub Pagesで公開するための静的サイトです。

## 公開対象

このディレクトリの中身をGitHub Pagesのサイトルートとして公開します。

```text
index.html
assets/
data/
simulators/
```

## ローカル確認

```sh
python3 -m http.server 8765
```

```text
http://127.0.0.1:8765/
```

## 現在の状態

- 入口ページ: `index.html`
- シミュレータ一覧: `data/simulators.json`
- メインルート: 32件
- リメイク版ルート: 30件
- 共通ヘッダー適用: 31件
- 共通時計適用: 26件

各シミュレータの元版 `index.html` は残し、リメイク版のあるものは `Remake-<id>.html` として追加しています。

`function-graph`、`rod-tension`、`center-of-mass-disk`、`light-rgb`、`pulley-work` はイベント駆動のため、共通時計は使っていません。
