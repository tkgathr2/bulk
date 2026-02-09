const services = [
  {
    id: "slack",
    name: "Slack",
    icon: "💬",
    status: "connected" as const,
    color: "#4A154B",
    description: "パブリックチャンネルのメッセージを検索",
  },
  {
    id: "gmail",
    name: "Gmail",
    icon: "📧",
    status: "connected" as const,
    color: "#EA4335",
    description: "メール（件名・本文・添付ファイル名）を検索",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    icon: "📦",
    status: "disconnected" as const,
    color: "#0061FF",
    description: "ファイル名・ファイル内テキストを検索",
  },
  {
    id: "drive",
    name: "Google Drive",
    icon: "📁",
    status: "expired" as const,
    color: "#0F9D58",
    description: "ファイル名・ファイル内テキストを検索",
  },
];

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  connected: { label: "接続済み", color: "var(--success)", bg: "#34a85315" },
  disconnected: { label: "未接続", color: "var(--text-secondary)", bg: "var(--bg-secondary)" },
  expired: { label: "期限切れ", color: "var(--warning)", bg: "#fbbc0415" },
};

export default function SettingsPage() {
  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 32 }}>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>サービス連携設定</h2>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 32 }}>
        検索対象サービスの接続状態を管理します
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {services.map((svc) => {
          const st = statusLabels[svc.status];
          return (
            <div
              key={svc.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                border: "1px solid var(--border)",
                borderRadius: 12,
                background: "var(--bg)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 28 }}>{svc.icon}</span>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 2 }}>{svc.name}</h3>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{svc.description}</p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 500,
                    color: st.color,
                    background: st.bg,
                  }}
                >
                  {st.label}
                </span>
                <button
                  style={{
                    padding: "8px 20px",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    background: svc.status === "connected" ? "var(--bg)" : "var(--primary)",
                    color: svc.status === "connected" ? "var(--text)" : "#fff",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {svc.status === "connected" ? "切断" : svc.status === "expired" ? "再接続" : "接続"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: "var(--text-secondary)", textAlign: "center" }}>
        ※ V0.1（ダミー表示）— 実際の OAuth 連携は次バージョンで実装します
      </p>
    </div>
  );
}
