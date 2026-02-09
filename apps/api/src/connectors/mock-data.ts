import type { ResultItem } from "../types/index.js";

export const slackItems: ResultItem[] = [
  {
    id: "slack-001", service: "slack", title: "#general",
    snippet: "月次報告に関する議論がありました。来週の会議で詳細を共有します。",
    updated_at: "2026-01-15T10:30:00Z", author: "田中太郎",
    url: "https://slack.com/archives/C01EXAMPLE/p1700000001",
    kind: "message", channel_name: "general",
  },
  {
    id: "slack-002", service: "slack", title: "#project-alpha",
    snippet: "月次報告の資料を共有します。ドライブにアップロードしました。",
    updated_at: "2026-01-10T14:00:00Z", author: "佐藤花子",
    url: "https://slack.com/archives/C02EXAMPLE/p1700000002",
    kind: "message", channel_name: "project-alpha",
  },
  {
    id: "slack-003", service: "slack", title: "#engineering",
    snippet: "新しいAPI設計のレビューをお願いします。ドキュメントは共有ドライブにあります。",
    updated_at: "2026-01-18T09:15:00Z", author: "山田一郎",
    url: "https://slack.com/archives/C03EXAMPLE/p1700000003",
    kind: "message", channel_name: "engineering",
  },
  {
    id: "slack-004", service: "slack", title: "#general",
    snippet: "来週の全体会議のアジェンダを確認してください。",
    updated_at: "2026-01-20T16:45:00Z", author: "高橋美咲",
    url: "https://slack.com/archives/C01EXAMPLE/p1700000004",
    kind: "message", channel_name: "general",
  },
  {
    id: "slack-005", service: "slack", title: "#sales",
    snippet: "Q3の売上報告書をまとめました。詳細はファイルを参照してください。",
    updated_at: "2026-01-05T11:00:00Z", author: "中村健太",
    url: "https://slack.com/archives/C04EXAMPLE/p1700000005",
    kind: "message", channel_name: "sales",
  },
];

export const gmailItems: ResultItem[] = [
  {
    id: "gmail-001", service: "gmail", title: "Re: 月次報告について",
    snippet: "添付の資料をご確認ください。修正版を送付いたします。",
    updated_at: "2026-01-12T09:00:00Z", author: "suzuki@example.com",
    url: "https://mail.google.com/mail/u/0/#inbox/example001",
    kind: "email", from: "suzuki@example.com", to: "team@example.com", subject: "Re: 月次報告について",
  },
  {
    id: "gmail-002", service: "gmail", title: "プロジェクト進捗共有",
    snippet: "今週のスプリントレビューの結果を共有します。",
    updated_at: "2026-01-14T15:30:00Z", author: "tanaka@example.com",
    url: "https://mail.google.com/mail/u/0/#inbox/example002",
    kind: "email", from: "tanaka@example.com", to: "dev-team@example.com", subject: "プロジェクト進捗共有",
  },
  {
    id: "gmail-003", service: "gmail", title: "【重要】セキュリティアップデート",
    snippet: "全社員向けセキュリティパッチの適用をお願いします。",
    updated_at: "2026-01-19T08:00:00Z", author: "it-admin@example.com",
    url: "https://mail.google.com/mail/u/0/#inbox/example003",
    kind: "email", from: "it-admin@example.com", to: "all@example.com", subject: "【重要】セキュリティアップデート",
  },
];

export const dropboxItems: ResultItem[] = [
  {
    id: "dbx-001", service: "dropbox", title: "月次報告_報告書.pdf",
    snippet: null,
    updated_at: "2026-01-08T16:00:00Z", author: null,
    url: "https://www.dropbox.com/s/example/report.pdf",
    kind: "file", path: "/共有フォルダ/報告書/", mime_type: "application/pdf", file_size: 1024000,
  },
  {
    id: "dbx-002", service: "dropbox", title: "デザインガイドライン_v2.pdf",
    snippet: null,
    updated_at: "2026-01-11T10:30:00Z", author: "designer@example.com",
    url: "https://www.dropbox.com/s/example/design-guide.pdf",
    kind: "file", path: "/共有フォルダ/デザイン/", mime_type: "application/pdf", file_size: 5120000,
  },
  {
    id: "dbx-003", service: "dropbox", title: "会議議事録_2026Q1.docx",
    snippet: "第一四半期の定例会議の議事録です。",
    updated_at: "2026-01-22T14:00:00Z", author: "secretary@example.com",
    url: "https://www.dropbox.com/s/example/minutes.docx",
    kind: "file", path: "/共有フォルダ/議事録/", mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", file_size: 256000,
  },
];

export const driveItems: ResultItem[] = [
  {
    id: "drive-001", service: "drive", title: "月次報告 まとめ",
    snippet: "第3四半期の結果をまとめました。各部門の進捗状況を確認してください。",
    updated_at: "2026-01-20T11:00:00Z", author: "yamada@example.com",
    url: "https://docs.google.com/document/d/example001/edit",
    kind: "file", path: "/マイドライブ/プロジェクト/", mime_type: "application/vnd.google-apps.document", file_size: null,
  },
  {
    id: "drive-002", service: "drive", title: "売上データ 2026",
    snippet: "月別の売上推移と前年比較のスプレッドシートです。",
    updated_at: "2026-01-16T13:00:00Z", author: "finance@example.com",
    url: "https://docs.google.com/spreadsheets/d/example002/edit",
    kind: "file", path: "/マイドライブ/財務/", mime_type: "application/vnd.google-apps.spreadsheet", file_size: null,
  },
  {
    id: "drive-003", service: "drive", title: "新規事業提案書",
    snippet: "2026年度の新規事業案をプレゼンテーション形式でまとめています。",
    updated_at: "2026-01-25T09:30:00Z", author: "strategy@example.com",
    url: "https://docs.google.com/presentation/d/example003/edit",
    kind: "file", path: "/共有ドライブ/経営企画/", mime_type: "application/vnd.google-apps.presentation", file_size: null,
  },
  {
    id: "drive-004", service: "drive", title: "プロジェクト計画書.pdf",
    snippet: null,
    updated_at: "2026-01-03T17:00:00Z", author: "pm@example.com",
    url: "https://drive.google.com/file/d/example004/view",
    kind: "file", path: "/マイドライブ/プロジェクト/", mime_type: "application/pdf", file_size: 2048000,
  },
];
