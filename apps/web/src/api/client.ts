import type {
  SearchResponse,
  SearchHistoryEntry,
  ServiceConnectionInfo,
  ServiceId,
  FileType,
} from "../types/index";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

const opts: RequestInit = { credentials: "include" };

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
    ...opts,
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
  const res = await fetch(`${API_BASE}/search/history`, opts);
  return res.json();
}

export async function saveSearchHistory(
  query: string,
  filters: SearchHistoryEntry["filters"]
): Promise<SearchHistoryEntry> {
  const res = await fetch(`${API_BASE}/search/history`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, filters }),
  });
  return res.json();
}

export async function deleteSearchHistoryItem(id: string): Promise<void> {
  await fetch(`${API_BASE}/search/history/${id}`, { ...opts, method: "DELETE" });
}

export async function deleteAllSearchHistory(): Promise<void> {
  await fetch(`${API_BASE}/search/history`, { ...opts, method: "DELETE" });
}

export async function getServicesStatus(): Promise<ServiceConnectionInfo[]> {
  const res = await fetch(`${API_BASE}/services/status`, opts);
  return res.json();
}

export async function connectService(
  serviceId: string
): Promise<{ redirect?: string } & Partial<ServiceConnectionInfo>> {
  const res = await fetch(`${API_BASE}/services/${serviceId}/connect`, {
    ...opts,
    method: "POST",
  });
  return res.json();
}

export async function disconnectService(
  serviceId: string
): Promise<ServiceConnectionInfo> {
  const res = await fetch(`${API_BASE}/services/${serviceId}/disconnect`, {
    ...opts,
    method: "POST",
  });
  return res.json();
}

export async function getAuthMe(): Promise<{ authenticated: boolean; user: { email: string; name: string } | null }> {
  const res = await fetch(`${API_BASE}/auth/google/me`, opts);
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/google/logout`, { ...opts, method: "POST" });
}

export function getLoginUrl(): string {
  return `${API_BASE}/auth/google/login`;
}

export function getServiceAuthUrl(serviceId: string): string {
  const authPaths: Record<string, string> = {
    slack: "/auth/slack/authorize",
    gmail: "/auth/google/gmail/authorize",
    dropbox: "/auth/dropbox/authorize",
    drive: "/auth/google/drive/authorize",
  };
  return `${API_BASE}${authPaths[serviceId] ?? `/auth/${serviceId}/authorize`}`;
}
