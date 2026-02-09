# 一括検索君

Slack / Gmail / Dropbox / Google Drive を横断検索する社内ツール。

## ローカル起動手順

### 前提

- Node.js 18+
- npm

### API サーバー（ポート 8080）

```bash
cd apps/api
npm install
npm run dev
```

`http://localhost:8080` で起動します。

- `GET /health` — ヘルスチェック
- `POST /search` — 検索（ダミーレスポンス）

### Web フロント（ポート 5173）

```bash
cd apps/web
npm install
npm run dev
```

`http://localhost:5173` で起動します。

### 画面構成

| パス | 画面 |
|------|------|
| `/login` | ログイン |
| `/search` | 検索トップ |
| `/results` | 検索結果一覧 |
| `/detail/:id` | 検索結果詳細 |
| `/settings` | サービス連携設定 |

## 仕様書

- `docs/plan.md` — 唯一の仕様書
- `mockups/` — 画面モック（参考）

## 現在のバージョン

V0.1（雛形） — ダミーデータによる画面遷移とAPI応答のみ。OAuth連携・実検索は次バージョンで実装。
