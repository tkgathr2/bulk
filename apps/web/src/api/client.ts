import type {
  SearchResponse,
  SearchHistoryEntry,
  ServiceConnectionInfo,
  ServiceId,
  FileType,
} from "../types/index";

const API_BASE = "http://localhost:8080";

export async function searchApi(params: {
  query: string;
  services?: ServiceId[];
  date_from?: string | null;
  date_to?: string | null;
  file_type?: FileType | null;
  offset?: number;
  limit?: number;
}): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Search failed");
  }
  return res.json();
}

export async function getSearchHistory(): Promise<SearchHistoryEntry[]> {
  const res = await fetch(`${API_BASE}/search/history`);
  return res.json();
}

export async function saveSearchHistory(
  query: string,
  filters: SearchHistoryEntry["filters"]
): Promise<SearchHistoryEntry> {
  const res = await fetch(`${API_BASE}/search/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, filters }),
  });
  return res.json();
}

export async function deleteSearchHistoryItem(id: string): Promise<void> {
  await fetch(`${API_BASE}/search/history/${id}`, { method: "DELETE" });
}

export async function deleteAllSearchHistory(): Promise<void> {
  await fetch(`${API_BASE}/search/history`, { method: "DELETE" });
}

export async function getServicesStatus(): Promise<ServiceConnectionInfo[]> {
  const res = await fetch(`${API_BASE}/services/status`);
  return res.json();
}

export async function connectService(
  serviceId: string
): Promise<ServiceConnectionInfo> {
  const res = await fetch(`${API_BASE}/services/${serviceId}/connect`, {
    method: "POST",
  });
  return res.json();
}

export async function disconnectService(
  serviceId: string
): Promise<ServiceConnectionInfo> {
  const res = await fetch(`${API_BASE}/services/${serviceId}/disconnect`, {
    method: "POST",
  });
  return res.json();
}
