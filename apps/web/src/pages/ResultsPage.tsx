import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { ResultItem, ServiceResult, SearchResponse, SortOrder, ServiceId } from "../types/index";
import { searchApi, saveSearchHistory } from "../api/client";

const ALL_SERVICES: ServiceId[] = ["slack", "gmail", "dropbox", "drive"];
const PAGE_SIZE = 20;

const tabs: { id: string; label: string }[] = [
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

const sortOptions: { value: SortOrder; label: string }[] = [
  { value: "relevance", label: "関連度" },
  { value: "newest", label: "新しい順" },
  { value: "oldest", label: "古い順" },
];

const errorMessages: Record<string, string> = {
  auth_required: "認証が必要です。設定画面でサービスを接続してください。",
  forbidden: "アクセス権限がありません。",
  rate_limited: "リクエスト制限に達しました。",
  network_error: "ネットワークエラーが発生しました。",
  unknown_error: "不明なエラーが発生しました。",
};

function sortItems(items: ResultItem[], order: SortOrder): ResultItem[] {
  if (order === "relevance") return items;
  const sorted = [...items];
  sorted.sort((a, b) => {
    const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return order === "newest" ? dateB - dateA : dateA - dateB;
  });
  return sorted;
}

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") ?? "";
  const servicesParam = searchParams.get("services");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const fileTypeParam = searchParams.get("file_type");

  const [activeTab, setActiveTab] = useState("all");
  const [selectedItem, setSelectedItem] = useState<ResultItem | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("relevance");
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const searchInFlight = useRef(false);

  const requestedServices: ServiceId[] = servicesParam
    ? (servicesParam.split(",") as ServiceId[])
    : ALL_SERVICES;

  const doSearch = useCallback(async () => {
    if (!query || searchInFlight.current) return;
    searchInFlight.current = true;
    setLoading(true);
    setError(null);
    setVisibleCount(PAGE_SIZE);
    try {
      const result = await searchApi({
        query,
        services: requestedServices,
        date_from: dateFrom,
        date_to: dateTo,
        file_type: fileTypeParam as ResultItem["kind"] | null,
      });
      setSearchResult(result);
      await saveSearchHistory(query, result.filters).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
      searchInFlight.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, servicesParam, dateFrom, dateTo, fileTypeParam]);

  useEffect(() => {
    doSearch();
  }, [doSearch]);

  const handleRetry = async (serviceId: string) => {
    if (!searchResult || searchInFlight.current) return;
    setRetrying(serviceId);
    try {
      const result = await searchApi({
        query,
        services: [serviceId as ServiceId],
        date_from: dateFrom,
        date_to: dateTo,
        file_type: fileTypeParam as ResultItem["kind"] | null,
      });
      setSearchResult((prev) => {
        if (!prev) return result;
        return {
          ...prev,
          services: {
            ...prev.services,
            [serviceId]: result.services[serviceId],
          },
        };
      });
    } catch (err) {
      void err;
    } finally {
      setRetrying(null);
    }
  };

  const getServiceResult = (svcId: string): ServiceResult | undefined => {
    return searchResult?.services[svcId];
  };

  const getAllItems = (): ResultItem[] => {
    if (!searchResult) return [];
    if (activeTab === "all") {
      const allItems = Object.values(searchResult.services)
        .filter((s) => s.status === "success" || s.status === "partial")
        .flatMap((s) => s.items);
      return sortItems(allItems, sortOrder);
    }
    const svc = getServiceResult(activeTab);
    if (!svc || (svc.status !== "success" && svc.status !== "partial")) return [];
    return sortItems(svc.items, sortOrder);
  };

  const getErrorServices = (): { id: string; result: ServiceResult }[] => {
    if (!searchResult || activeTab !== "all") return [];
    return Object.entries(searchResult.services)
      .filter(([, r]) => r.status === "error")
      .map(([id, result]) => ({ id, result }));
  };

  const getTabBadge = (tabId: string): { text: string; isError: boolean } => {
    if (!searchResult) return { text: "...", isError: false };
    if (tabId === "all") {
      const total = Object.values(searchResult.services)
        .filter((s) => s.status === "success" || s.status === "partial")
        .reduce((sum, s) => sum + (s.total ?? 0), 0);
      const hasError = Object.values(searchResult.services).some((s) => s.status === "error");
      return { text: String(total), isError: hasError };
    }
    const svc = getServiceResult(tabId);
    if (!svc) return { text: "-", isError: false };
    if (svc.status === "error") return { text: "!", isError: true };
    if (svc.status === "loading") return { text: "...", isError: false };
    return { text: String(svc.total ?? 0), isError: false };
  };

  const allItems = getAllItems();
  const visibleItems = allItems.slice(0, visibleCount);
  const hasMore = visibleCount < allItems.length;
  const errorServices = getErrorServices();
  const activeServiceResult = activeTab !== "all" ? getServiceResult(activeTab) : null;

  const handleBackToSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (servicesParam) params.set("services", servicesParam);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (fileTypeParam) params.set("file_type", fileTypeParam);
    navigate(`/search?${params.toString()}`);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 60px)" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>検索中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "calc(100vh - 60px)", gap: 16 }}>
        <p style={{ color: "var(--error)", fontSize: 16 }}>{error}</p>
        <button
          onClick={doSearch}
          style={{ padding: "8px 24px", border: "none", borderRadius: 6, background: "var(--primary)", color: "#fff", fontSize: 14 }}
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)" }}>
      <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            display: "flex",
            flex: 1,
            maxWidth: 580,
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
            maxLength={200}
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
                if (val) {
                  const params = new URLSearchParams(searchParams);
                  params.set("q", val);
                  navigate(`/results?${params.toString()}`);
                }
              }
            }}
          />
        </div>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          style={{
            padding: "8px 12px",
            border: "1px solid var(--border)",
            borderRadius: 6,
            fontSize: 13,
            background: "var(--bg)",
            color: "var(--text)",
          }}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={handleBackToSearch}
          style={{
            padding: "8px 16px",
            border: "1px solid var(--border)",
            borderRadius: 6,
            background: "var(--bg)",
            fontSize: 13,
            color: "var(--text)",
            whiteSpace: "nowrap",
          }}
        >
          条件変更
        </button>
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
        {tabs.map((tab) => {
          const badge = getTabBadge(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setVisibleCount(PAGE_SIZE);
              }}
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
                  background: badge.isError
                    ? "var(--error)"
                    : activeTab === tab.id
                    ? "var(--primary)"
                    : "var(--border)",
                  color: badge.isError || activeTab === tab.id ? "#fff" : "var(--text-secondary)",
                  padding: "2px 8px",
                  borderRadius: 10,
                  fontSize: 12,
                  marginLeft: 4,
                }}
              >
                {badge.text}
              </span>
            </button>
          );
        })}
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
          {activeServiceResult && activeServiceResult.status === "error" ? (
            <div style={{ padding: 32, textAlign: "center" }}>
              <p style={{ color: "var(--error)", fontSize: 15, marginBottom: 8 }}>
                {errorMessages[activeServiceResult.error_code ?? "unknown_error"]}
              </p>
              {activeServiceResult.error_message && (
                <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 8 }}>
                  {activeServiceResult.error_message}
                </p>
              )}
              {activeServiceResult.error_code === "rate_limited" && (
                <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16 }}>
                  数分待ってから再試行してください。
                </p>
              )}
              {activeServiceResult.error_code === "auth_required" && (
                <button
                  onClick={() => navigate("/settings")}
                  style={{
                    padding: "8px 20px",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    background: "var(--bg)",
                    fontSize: 13,
                    color: "var(--primary)",
                    marginBottom: 12,
                    marginRight: 8,
                  }}
                >
                  設定画面へ
                </button>
              )}
              <button
                onClick={() => handleRetry(activeTab)}
                disabled={retrying === activeTab}
                style={{
                  padding: "8px 24px",
                  border: "none",
                  borderRadius: 6,
                  background: "var(--primary)",
                  color: "#fff",
                  fontSize: 14,
                }}
              >
                {retrying === activeTab ? "再試行中..." : "再試行"}
              </button>
            </div>
          ) : (
            <>
              {activeTab === "all" && errorServices.length > 0 && (
                <div style={{ marginBottom: 16, padding: 16, background: "#FFF3E0", borderRadius: 8, border: "1px solid #FFE0B2" }}>
                  {errorServices.map(({ id, result }) => (
                    <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                      <div>
                        <span style={{ fontWeight: 500, color: serviceColors[id], textTransform: "uppercase" as const, fontSize: 13, marginRight: 8 }}>
                          {id}
                        </span>
                        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                          {errorMessages[result.error_code ?? "unknown_error"]}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRetry(id)}
                        disabled={retrying === id}
                        style={{
                          padding: "4px 12px",
                          border: "none",
                          borderRadius: 4,
                          background: "var(--primary)",
                          color: "#fff",
                          fontSize: 12,
                        }}
                      >
                        {retrying === id ? "再試行中..." : "再試行"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {visibleItems.length === 0 ? (
                <p style={{ padding: 24, color: "var(--text-secondary)", textAlign: "center" }}>
                  検索結果は 0 件です
                </p>
              ) : (
                <>
                  {visibleItems.map((item) => (
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
                    navigate(`/detail/${item.id}`, { state: { item } });
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
                  ))}
                  {hasMore && (
                    <div style={{ textAlign: "center", padding: 16 }}>
                      <button
                        onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                        style={{
                          padding: "10px 32px",
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          background: "var(--bg)",
                          fontSize: 14,
                          color: "var(--primary)",
                          fontWeight: 500,
                        }}
                      >
                        もっと見る（残り {allItems.length - visibleCount} 件）
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
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
                x
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
              {selectedItem.channel_name && <p>チャンネル: #{selectedItem.channel_name}</p>}
              {selectedItem.from && <p>送信元: {selectedItem.from}</p>}
              {selectedItem.to && <p>宛先: {selectedItem.to}</p>}
              {selectedItem.path && <p>パス: {selectedItem.path}</p>}
              {selectedItem.mime_type && <p>形式: {selectedItem.mime_type}</p>}
              {selectedItem.file_size != null && (
                <p>サイズ: {(selectedItem.file_size / 1024).toFixed(0)} KB</p>
              )}
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
                onClick={() => navigate(`/detail/${selectedItem.id}`, { state: { item: selectedItem } })}
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
