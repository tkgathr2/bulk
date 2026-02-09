# 画面遷移図

```mermaid
flowchart TD
  Login[ログイン] -->|GoogleOAuth| SearchTop[検索トップ]
  SearchTop -->|検索実行| Results[検索結果一覧]
  Results -->|結果クリック| Detail[検索結果詳細]
  Detail -->|戻る| Results
  Results -->|条件変更| SearchTop
  SearchTop -->|設定| Settings[サービス連携設定]
  Settings -->|戻る| SearchTop
  Detail -->|元サービスで開く| External[外部サービス]
```
