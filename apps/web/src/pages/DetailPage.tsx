import { useParams, useNavigate, useLocation } from "react-router-dom";
import type { ResultItem } from "../types/index";

const serviceColors: Record<string, string> = {
  slack: "#4A154B",
  gmail: "#EA4335",
  dropbox: "#0061FF",
  drive: "#0F9D58",
};

const metaLabels: Record<string, string> = {
  channel_name: "チャンネル",
  from: "送信元",
  to: "宛先",
  subject: "件名",
  path: "パス",
  mime_type: "形式",
};

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const item = (location.state as { item?: ResultItem } | null)?.item;

  if (!item || item.id !== id) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <h2 style={{ marginBottom: 16 }}>アイテムが見つかりません</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 16, fontSize: 14 }}>
          検索結果から再度アクセスしてください
        </p>
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

  const metaEntries: [string, string][] = [];
  if (item.channel_name) metaEntries.push(["channel_name", `#${item.channel_name}`]);
  if (item.from) metaEntries.push(["from", item.from]);
  if (item.to) metaEntries.push(["to", item.to]);
  if (item.subject) metaEntries.push(["subject", item.subject]);
  if (item.path) metaEntries.push(["path", item.path]);
  if (item.mime_type) metaEntries.push(["mime_type", item.mime_type]);
  if (item.file_size != null) metaEntries.push(["file_size", `${(item.file_size / 1024).toFixed(0)} KB`]);

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
        &larr; 結果一覧に戻る
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
              background: `${serviceColors[item.service]}15`,
              color: serviceColors[item.service],
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {item.service}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{item.kind}</span>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 500, marginBottom: 16 }}>{item.title}</h1>

        {item.snippet && (
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
            {item.snippet}
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
          {item.author && (
            <>
              <span style={{ color: "var(--text-secondary)" }}>作成者</span>
              <span>{item.author}</span>
            </>
          )}
          {item.updated_at && (
            <>
              <span style={{ color: "var(--text-secondary)" }}>更新日</span>
              <span>{new Date(item.updated_at).toLocaleString("ja-JP")}</span>
            </>
          )}
          {metaEntries.map(([key, value]) => (
            <div key={key} style={{ display: "contents" }}>
              <span style={{ color: "var(--text-secondary)" }}>{metaLabels[key] ?? key}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>

        <a
          href={item.url}
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
