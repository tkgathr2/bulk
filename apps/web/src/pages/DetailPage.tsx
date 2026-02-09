import { useParams, useNavigate } from "react-router-dom";

const mockDetails: Record<string, {
  id: string;
  service: string;
  title: string;
  snippet: string | null;
  updated_at: string;
  author: string | null;
  url: string;
  kind: string;
  meta: Record<string, string | null>;
}> = {
  "slack-001": {
    id: "slack-001", service: "slack", title: "#general",
    snippet: "月次報告に関する議論がありました。来週の会議で詳細を共有します。",
    updated_at: "2026-01-15T10:30:00Z", author: "田中太郎", url: "https://slack.com/archives/C01EXAMPLE/p1700000001",
    kind: "message", meta: { channel_name: "general" },
  },
  "slack-002": {
    id: "slack-002", service: "slack", title: "#project-alpha",
    snippet: "月次報告の資料を共有します。ドライブにアップロードしました。",
    updated_at: "2026-01-10T14:00:00Z", author: "佐藤花子", url: "https://slack.com/archives/C02EXAMPLE/p1700000002",
    kind: "message", meta: { channel_name: "project-alpha" },
  },
  "gmail-001": {
    id: "gmail-001", service: "gmail", title: "Re: 月次報告について",
    snippet: "添付の資料をご確認ください。修正版を送付いたします。",
    updated_at: "2026-01-12T09:00:00Z", author: "suzuki@example.com", url: "https://mail.google.com/mail/u/0/#inbox/example001",
    kind: "email", meta: { from: "suzuki@example.com", to: "team@example.com", subject: "Re: 月次報告について" },
  },
  "dbx-001": {
    id: "dbx-001", service: "dropbox", title: "月次報告_報告書.pdf",
    snippet: null,
    updated_at: "2026-01-08T16:00:00Z", author: null, url: "https://www.dropbox.com/s/example/report.pdf",
    kind: "file", meta: { path: "/共有フォルダ/報告書/", mime_type: "application/pdf", file_size: "1 MB" },
  },
  "drive-001": {
    id: "drive-001", service: "drive", title: "月次報告 まとめ",
    snippet: "第3四半期の結果をまとめました。各部門の進捗状況を確認してください。",
    updated_at: "2026-01-20T11:00:00Z", author: "yamada@example.com", url: "https://docs.google.com/document/d/example001/edit",
    kind: "file", meta: { path: "/マイドライブ/プロジェクト/", mime_type: "Google ドキュメント", file_size: null },
  },
};

const serviceColors: Record<string, string> = {
  slack: "#4A154B",
  gmail: "#EA4335",
  dropbox: "#0061FF",
  drive: "#0F9D58",
};

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const detail = id ? mockDetails[id] : undefined;

  if (!detail) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <h2 style={{ marginBottom: 16 }}>アイテムが見つかりません</h2>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "8px 24px",
            border: "1px solid var(--border)",
            borderRadius: 6,
            background: "var(--bg)",
            fontSize: 14,
          }}
        >
          戻る
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          border: "none",
          background: "transparent",
          color: "var(--primary)",
          fontSize: 14,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        ← 結果一覧に戻る
      </button>

      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 12,
              background: `${serviceColors[detail.service]}15`,
              color: serviceColors[detail.service],
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {detail.service}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{detail.kind}</span>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 500, marginBottom: 16 }}>{detail.title}</h1>

        {detail.snippet && (
          <div
            style={{
              padding: 20,
              background: "var(--bg-secondary)",
              borderRadius: 8,
              marginBottom: 24,
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--text)",
            }}
          >
            {detail.snippet}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr",
            gap: "8px 16px",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          {detail.author && (
            <>
              <span style={{ color: "var(--text-secondary)" }}>作成者</span>
              <span>{detail.author}</span>
            </>
          )}
          <span style={{ color: "var(--text-secondary)" }}>更新日</span>
          <span>{new Date(detail.updated_at).toLocaleString("ja-JP")}</span>
          {Object.entries(detail.meta)
            .filter(([, v]) => v !== null)
            .map(([key, value]) => (
              <div key={key} style={{ display: "contents" }}>
                <span style={{ color: "var(--text-secondary)" }}>{key}</span>
                <span>{value}</span>
              </div>
            ))}
        </div>

        <a
          href={detail.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "10px 28px",
            background: "var(--primary)",
            color: "#fff",
            borderRadius: 6,
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          元サービスで開く
        </a>
      </div>
    </div>
  );
}
