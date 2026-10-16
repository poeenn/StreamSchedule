# StreamSchedule (配信スケジュールくん)

実況配信者・VTuber向け 週間配信スケジュール告知画像ジェネレーター

テキスト入力とテンプレート選択だけで、わずか3〜5分でプロ品質の高解像度告知画像（1920x1080 / 1200x675）を自動生成できるWebツールです。

## 特徴
- **完全ブラウザ完結 (Client-Side Only)**: 画像処理やスケジュール情報はすべてブラウザローカルで処理。未公開の企画や立ち絵が外部サーバーへ送信される心配はありません。
- **高解像度 2解像度対応**: フルHD (1920x1080) と X（Twitter）タイムライン最適化 (1200x675) をワンクリック切り替え。
- **1クリック高速エクスポート**: PNG画像ダウンロード、クリップボードへの画像コピー、X投稿画面連携（Web Intent）に対応。
- **立ち絵・アバター合成**: お手持ちの立ち絵画像（透過PNG等）の配置・拡大縮小・左右反転に対応。

## 開発・検証手順

```bash
# 依存パッケージのインストール
npm install

# 型チェック
npm run typecheck

# ユニットテスト実行 (Vitest)
npm run test
```

## 開発者・サポート窓口
- **作者**: poeenn
- **公式X**: [@poeenn](https://x.com/poeenn)
- **開発者応援 (どねる)**: [https://doneru.jp/poeenn](https://doneru.jp/poeenn)
- **ご意見・不具合報告**: [Googleフォーム窓口](https://docs.google.com/forms/d/e/1FAIpQLSefeedback/viewform)
- **関連ツール**:
  - [StreamTrans (リアルタイム配信字幕)](https://streamtrans.pages.dev)
  - [かんたん経費ノート (Web版)](https://tax-app.pages.dev)
