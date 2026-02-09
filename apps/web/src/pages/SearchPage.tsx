import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { ServiceId, FileType, SearchHistoryEntry } from "../types/index";
import { getSearchHistory, deleteSearchHistoryItem, deleteAllSearchHistory } from "../api/client";

const serviceOptions: { id: ServiceId; label: string; color: string }[] = [
  { id: "slack", label: "Slack", color: "#4A154B" },
  { id: "gmail", label: "Gmail", color: "#EA4335" },
  { id: "dropbox", label: "Dropbox", color: "#0061FF" },
  { id: "drive", label: "Google Drive", color: "#0F9D58" },
];

const fileTypeOptions: { value: FileType; label: string }[] = [
  { value: "document", label: "ドキュメント" },
  { value: "spreadsheet", label: "スプレッドシート" },
  { value: "presentation", label: "スライド" },
  { value: "pdf", label: "PDF" },
  { value: "image", label: "画像" },
  { value: "other", label: "その他" },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [services, setServices] = useState<ServiceId[]>(() => {
    const sp = searchParams.get("services");
    return sp ? (sp.split(",") as ServiceId[]) : serviceOptions.map((s) => s.id);
  });
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState(searchParams.get("date_from") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("date_to") ?? "");
  const [fileType, setFileType] = useState<FileType | "">((searchParams.get("file_type") as FileType | "") ?? "");
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSearchHistory().then(setHistory).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleService = (id: ServiceId) => {
    setServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed || isSearching) return;
    setIsSearching(true);
    setShowHistory(false);

    const params = new URLSearchParams();
    params.set("q", trimmed);
    if (services.length < 4) params.set("services", services.join(","));
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (fileType) params.set("file_type", fileType);

    navigate(`/results?${params.toString()}`);
  };

  const handleHistoryClick = (entry: SearchHistoryEntry) => {
    setQuery(entry.query);
    setShowHistory(false);
    const params = new URLSearchParams();
    params.set("q", entry.query);
    if (entry.filters.services.length < 4)
      params.set("services", entry.filters.services.join(","));
    if (entry.filters.date_from) params.set("date_from", entry.filters.date_from);
    if (entry.filters.date_to) params.set("date_to", entry.filters.date_to);
    if (entry.filters.file_type) params.set("file_type", entry.filters.file_type);
    navigate(`/results?${params.toString()}`);
  };

  const handleDeleteHistory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteSearchHistoryItem(id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const handleClearAllHistory = async () => {
    await deleteAllSearchHistory();
    setHistory([]);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 60px)",
        padding: 24,
      }}
    >
      <h2
        style={{
          fontSize: 32,
          fontWeight: 400,
          color: "var(--text)",
          marginBottom: 32,
        }}
      >
        何を探しますか？
      </h2>

      <div style={{ position: "relative", width: "100%", maxWidth: 680 }} ref={historyRef}>
        <div
          style={{
            display: "flex",
            border: "1px solid var(--border)",
            borderRadius: 28,
            padding: "8px 16px",
            boxShadow: "0 1px 6px rgba(32,33,36,0.1)",
          }}
        >
          <input
            type="text"
            placeholder="キーワードを入力..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            onFocus={() => history.length > 0 && setShowHistory(true)}
            maxLength={200}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 16,
              padding: "8px 12px",
              background: "transparent",
            }}
          />
          <button
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            style={{
              padding: "8px 24px",
              border: "none",
              borderRadius: 20,
              background: query.trim() && !isSearching ? "var(--primary)" : "var(--border)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            検索
          </button>
        </div>
        <div style={{ textAlign: "right", fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
          {query.length}/200
        </div>

        {showHistory && history.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: 56,
              left: 0,
              right: 0,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 10,
              maxHeight: 320,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 16px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>検索履歴</span>
              <button
                onClick={handleClearAllHistory}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 12,
                  color: "var(--primary)",
                }}
              >
                すべて削除
              </button>
            </div>
            {history.map((entry) => (
              <div
                key={entry.id}
                onClick={() => handleHistoryClick(entry)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 16px",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--bg-secondary)",
                }}
              >
                <div>
                  <span style={{ fontSize: 14 }}>{entry.query}</span>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)", marginLeft: 8 }}>
                    {new Date(entry.searched_at).toLocaleDateString("ja-JP")}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteHistory(e, entry.id)}
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: 16,
                    color: "var(--text-secondary)",
                    padding: "0 4px",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 16,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {serviceOptions.map((svc) => (
          <button
            key={svc.id}
            onClick={() => toggleService(svc.id)}
            style={{
              padding: "6px 16px",
              borderRadius: 16,
              border: `1px solid ${services.includes(svc.id) ? svc.color : "var(--border)"}`,
              background: services.includes(svc.id) ? `${svc.color}10` : "transparent",
              color: services.includes(svc.id) ? svc.color : "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {svc.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowFilters(!showFilters)}
        style={{
          marginTop: 12,
          border: "none",
          background: "transparent",
          color: "var(--primary)",
          fontSize: 13,
        }}
      >
        {showFilters ? "フィルタを閉じる" : "詳細フィルタ"}
      </button>

      {showFilters && (
        <div
          style={{
            marginTop: 12,
            padding: 20,
            border: "1px solid var(--border)",
            borderRadius: 12,
            background: "var(--bg-secondary)",
            width: "100%",
            maxWidth: 680,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
              開始日
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
              終了日
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
              ファイル種別
            </label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as FileType | "")}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: 14,
                background: "var(--bg)",
              }}
            >
              <option value="">すべて</option>
              {fileTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <p style={{ marginTop: 32, fontSize: 12, color: "var(--text-secondary)", textAlign: "center", lineHeight: 1.8 }}>
        Slack / Gmail / Dropbox / Google Drive を横断検索します<br />
        ※ Slack はパブリックチャンネルのみ対象です（DM・プライベートチャンネルは今後対応予定）
      </p>
    </div>
  );
}
