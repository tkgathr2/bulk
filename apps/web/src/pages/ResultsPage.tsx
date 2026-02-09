import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

interface ResultItem {
  id: string;
  service: string;
  title: string;
  snippet: string | null;
  updated_at: string | null;
  author: string | null;
  url: string;
  kind: string;
}

const mockResults: Record<string, { status: string; total: number; items: ResultItem[] }> = {
  slack: {
    status: "success",
    total: 2,
    items: [
      { id: "slack-001", service: "slack", title: "#general", snippet: "月次報告に関する議論がありました", updated_at: "2026-01-15T10:30:00Z", author: "田中太郎", url: "#", kind: "message" },
      { id: "slack-002", service: "slack", title: "#project-alpha", snippet: "月次報告の資料を共有します", updated_at: "2026-01-10T14:00:00Z", author: "佐藤花子", url: "#", kind: "message" },
    ],
  },
  gmail: {
    status: "success",
    total: 1,
    items: [
      { id: "gmail-001", service: "gmail", title: "Re: 月次報告について", snippet: "添付の資料をご確認ください。", updated_at: "2026-01-12T09:00:00Z", author: "suzuki@example.com", url: "#", kind: "email" },
    ],
  },
  dropbox: {
    status: "success",
    total: 1,
    items: [
      { id: "dbx-001", service: "dropbox", title: "月次報告_報告書.pdf", snippet: null, updated_at: "2026-01-08T16:00:00Z", author: null, url: "#", kind: "file" },
    ],
  },
  drive: {
    status: "success",
    total: 1,
    items: [
      { id: "drive-001", service: "drive", title: "月次報告 まとめ", snippet: "第3四半期の結果をまとめました。", updated_at: "2026-01-20T11:00:00Z", author: "yamada@example.com", url: "#", kind: "file" },
    ],
  },
};

const tabs = [
  { id: "all", label: "すべて" },
  { id: "slack", label: "Slack" },
  { id: "gmail", label: "Gmail" },
  { id: "dropbox", label: "Dropbox" },
  { id: "drive", label: "Google Drive" },
];

const serviceColors: Record<string, string> = {
  slack: "#4A154B",
  gmail: "#EA4335",
  dropbox: "#0061FF",
  drive: "#0F9D58",
};

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") ?? "";
  const [activeTab, setActiveTab] = useState("all");
  const [selectedItem, setSelectedItem] = useState<ResultItem | null>(null);

  const getItems = (): ResultItem[] => {
    if (activeTab === "all") {
      return Object.values(mockResults).flatMap((s) => s.items);
    }
    return mockResults[activeTab]?.items ?? [];
  };

  const getTabCount = (tabId: string): number => {
    if (tabId === "all") {
      return Object.values(mockResults).reduce((sum, s) => sum + s.total, 0);
    }
    return mockResults[tabId]?.total ?? 0;
  };

  const items = getItems();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
        <div
          style={{
            display: "flex",
            maxWidth: 680,
            border: "1px solid var(--border)",
            borderRadius: 28,
            padding: "4px 16px",
            boxShadow: "0 1px 3px rgba(32,33,36,0.08)",
          }}
        >
          <input
            type="text"
            defaultValue={query}
            placeholder="キーワードを入力..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 15,
              padding: "8px 8px",
              background: "transparent",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val) navigate(`/results?q=${encodeURIComponent(val)}`);
              }
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "0 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 16px",
              border: "none",
              borderBottom: activeTab === tab.id ? "3px solid var(--primary)" : "3px solid transparent",
              background: "transparent",
              color: activeTab === tab.id ? "var(--primary)" : "var(--text-secondary)",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {tab.label}{" "}
            <span
              style={{
                background: activeTab === tab.id ? "var(--primary)" : "var(--border)",
                color: activeTab === tab.id ? "#fff" : "var(--text-secondary)",
                padding: "2px 8px",
                borderRadius: 10,
                fontSize: 12,
                marginLeft: 4,
              }}
            >
              {getTabCount(tab.id)}
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
            borderRight: selectedItem ? "1px solid var(--border)" : "none",
          }}
        >
          {items.length === 0 ? (
            <p style={{ padding: 24, color: "var(--text-secondary)", textAlign: "center" }}>
              検索結果がありません
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                style={{
                  padding: "14px 16px",
                  borderRadius: 8,
                  marginBottom: 4,
                  cursor: "pointer",
                  background: selectedItem?.id === item.id ? "var(--bg-secondary)" : "transparent",
                  borderLeft: `3px solid ${serviceColors[item.service] ?? "var(--border)"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: serviceColors[item.service],
                      textTransform: "uppercase",
                    }}
                  >
                    {item.service}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {item.kind}
                  </span>
                </div>
                <h4
                  style={{ fontSize: 15, fontWeight: 500, marginBottom: 4, cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/detail/${item.id}`);
                  }}
                >
                  {item.title}
                </h4>
                {item.snippet && (
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {item.snippet}
                  </p>
                )}
                <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                  {item.author && <span>{item.author}</span>}
                  {item.updated_at && (
                    <span>{new Date(item.updated_at).toLocaleDateString("ja-JP")}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {selectedItem && (
          <div style={{ width: 380, overflowY: "auto", padding: 24, background: "var(--bg-secondary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: serviceColors[selectedItem.service],
                  textTransform: "uppercase",
                }}
              >
                {selectedItem.service}
              </span>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 18,
                  color: "var(--text-secondary)",
                }}
              >
                ✕
              </button>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>{selectedItem.title}</h3>
            {selectedItem.snippet && (
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
                {selectedItem.snippet}
              </p>
            )}
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
              {selectedItem.author && <p>作成者: {selectedItem.author}</p>}
              {selectedItem.updated_at && (
                <p>更新日: {new Date(selectedItem.updated_at).toLocaleDateString("ja-JP")}</p>
              )}
              <p>種別: {selectedItem.kind}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <a
                href={selectedItem.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "8px 20px",
                  background: "var(--primary)",
                  color: "#fff",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                元サービスで開く
              </a>
              <button
                onClick={() => navigate(`/detail/${selectedItem.id}`)}
                style={{
                  padding: "8px 20px",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  background: "var(--bg)",
                  fontSize: 14,
                  color: "var(--text)",
                }}
              >
                詳細
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
