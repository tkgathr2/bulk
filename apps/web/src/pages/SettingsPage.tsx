import { useState, useEffect } from "react";
import type { ServiceConnectionInfo } from "../types/index";
import { getServicesStatus, disconnectService, getServiceAuthUrl } from "../api/client";
import { useIsMobile } from "../hooks/useIsMobile";

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
  const isMobile = useIsMobile();
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
    <div style={{ maxWidth: 700, margin: "0 auto", padding: isMobile ? 16 : 32 }}>
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
                alignItems: isMobile ? "flex-start" : "center",
                justifyContent: "space-between",
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? 12 : 0,
                padding: isMobile ? 16 : "20px 24px",
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

              <div style={{ display: "flex", alignItems: "center", gap: 12, ...(isMobile ? { width: "100%", justifyContent: "flex-end" } : {}) }}>
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

      <div style={{ marginTop: 48, borderTop: "1px solid var(--border)", paddingTop: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>
          一括検索君の機能一覧
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <FeatureSection
            title="横断検索"
            description="Slack・Gmail・Dropbox・Google Drive の4サービスを同時に検索します。キーワードを入力するだけで、全サービスの結果を一覧表示します。"
            isMobile={isMobile}
          />
          <FeatureSection
            title="ファイル形式バッジ"
            description="Dropbox・Google Drive の検索結果にファイル形式が色付きバッジで表示されます。PDF（赤）・Word（青）・Excel（緑）・PowerPoint（オレンジ）・フォルダ・画像・動画・音声・ZIP などが一目でわかります。"
            isMobile={isMobile}
          />
          <FeatureSection
            title="フォルダパス・ファイルサイズ表示"
            description="検索結果のカードにファイルが保存されているフォルダのパスとファイルサイズが表示されます。どのフォルダにあるファイルかをすぐに確認できます。"
            isMobile={isMobile}
          />
          <FeatureSection
            title="API 詳細情報（メタデータ）"
            description="各検索結果の詳細ページで、API から取得した全てのメタデータを確認できます。ファイルのハッシュ値、リビジョン、共有情報など、元サービスの生データがそのまま表示されます。"
            isMobile={isMobile}
          />
          <FeatureSection
            title="検索フィルター"
            description="ファイル種別（PDF / Word / Excel / PowerPoint / フォルダ / 画像 / 動画 / 音声 / 圧縮ファイル / テキスト）で絞り込み検索ができます。日付範囲での絞り込みも可能です。"
            isMobile={isMobile}
          />
          <FeatureSection
            title="全件取得（ページネーション）"
            description="Dropbox・Google Drive の検索結果はページネーションで全件取得します。以前の20件制限は解除されました。"
            isMobile={isMobile}
          />
          <FeatureSection
            title="検索キーワードハイライト"
            description="検索結果のタイトルとスニペット内の検索キーワードが黄色でハイライト表示されます。目的の情報を素早く見つけられます。"
            isMobile={isMobile}
          />
          <FeatureSection
            title="検索履歴"
            description="過去の検索キーワードが自動保存され、検索ボックスをクリックすると履歴から再検索できます。履歴の個別削除・一括削除も可能です。"
            isMobile={isMobile}
          />
          <FeatureSection
            title="モバイル対応"
            description="スマートフォン・タブレットでも快適に使えるレスポンシブデザインです。全ページがモバイルに最適化されています。"
            isMobile={isMobile}
          />
        </div>
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: "var(--text-secondary)", textAlign: "center" }}>
        ※ 各サービスの OAuth 認証情報は SEC-01 に基づき環境変数で管理されています
      </p>
    </div>
  );
}

function FeatureSection({ title, description, isMobile }: { title: string; description: string; isMobile: boolean }) {
  return (
    <div
      style={{
        padding: isMobile ? 16 : "16px 20px",
        border: "1px solid var(--border)",
        borderRadius: 10,
        background: "var(--bg)",
      }}
    >
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: "var(--text)" }}>{title}</h3>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>{description}</p>
    </div>
  );
}
