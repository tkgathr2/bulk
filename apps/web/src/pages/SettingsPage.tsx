import { useState, useEffect } from "react";
import type { ServiceConnectionInfo } from "../types/index";
import { getServicesStatus, disconnectService, getServiceAuthUrl } from "../api/client";

const serviceIcons: Record<string, string> = {
  slack: "S",
  gmail: "G",
  dropbox: "D",
  drive: "Dr",
};

const serviceColorMap: Record<string, string> = {
  slack: "#4A154B",
  gmail: "#EA4335",
  dropbox: "#0061FF",
  drive: "#0F9D58",
};

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  connected: { label: "接続済み", color: "var(--success)", bg: "#34a85315" },
  disconnected: { label: "未接続", color: "var(--text-secondary)", bg: "var(--bg-secondary)" },
  expired: { label: "期限切れ", color: "var(--warning)", bg: "#fbbc0415" },
};

export default function SettingsPage() {
  const [services, setServices] = useState<ServiceConnectionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    getServicesStatus()
      .then(setServices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (svc: ServiceConnectionInfo) => {
    setActionLoading(svc.id);
    try {
      if (svc.status === "connected") {
        const updated = await disconnectService(svc.id);
        setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        window.location.href = getServiceAuthUrl(svc.id);
      }
    } catch (err) {
      void err;
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 60px)" }}>
        <p style={{ color: "var(--text-secondary)" }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 32 }}>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>サービス連携設定</h2>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 32 }}>
        検索対象サービスの接続状態を管理します
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {services.map((svc) => {
          const st = statusLabels[svc.status] ?? statusLabels.disconnected;
          const color = serviceColorMap[svc.id] ?? "var(--text)";
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
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `${color}15`,
                    color: color,
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {serviceIcons[svc.id] ?? svc.id[0].toUpperCase()}
                </span>
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
                  onClick={() => handleAction(svc)}
                  disabled={actionLoading === svc.id}
                  style={{
                    padding: "8px 20px",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    background: svc.status === "connected" ? "var(--bg)" : "var(--primary)",
                    color: svc.status === "connected" ? "var(--text)" : "#fff",
                    fontSize: 13,
                    fontWeight: 500,
                    opacity: actionLoading === svc.id ? 0.6 : 1,
                  }}
                >
                  {actionLoading === svc.id
                    ? "処理中..."
                    : svc.status === "connected"
                    ? "切断"
                    : svc.status === "expired"
                    ? "再接続"
                    : "接続"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: "var(--text-secondary)", textAlign: "center" }}>
        ※ 各サービスの OAuth 認証情報は SEC-01 に基づき環境変数で管理されています
      </p>
    </div>
  );
}
