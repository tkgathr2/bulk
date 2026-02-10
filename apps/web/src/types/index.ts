export type ServiceId = "slack" | "gmail" | "dropbox" | "drive";

export type ServiceStatus = "success" | "error" | "loading" | "partial";

export type FileType = "document" | "spreadsheet" | "presentation" | "pdf" | "image" | "other";

export type ErrorCode =
  | "auth_required"
  | "forbidden"
  | "rate_limited"
  | "network_error"
  | "unknown_error";

export type ItemKind = "message" | "email" | "file";

export type ConnectionStatus = "connected" | "disconnected" | "expired";

export interface SearchFilters {
  services: ServiceId[];
  date_from: string | null;
  date_to: string | null;
  file_type: FileType | null;
}

export interface ResultItem {
  id: string;
  service: ServiceId;
  title: string;
  snippet: string | null;
  updated_at: string | null;
  author: string | null;
  url: string;
  kind: ItemKind;
  channel_name?: string;
  from?: string;
  to?: string;
  subject?: string;
  path?: string;
  mime_type?: string;
  file_size?: number | null;
}

export interface ServiceResult {
  status: ServiceStatus;
  total: number | null;
  items: ResultItem[];
  error_code: ErrorCode | null;
  error_message: string | null;
}

export interface SearchResponse {
  job_id: string;
  requested_at: string;
  query: string;
  filters: SearchFilters;
  services: Record<string, ServiceResult>;
}

export interface SearchHistoryEntry {
  id: string;
  query: string;
  filters: SearchFilters;
  searched_at: string;
}

export interface ServiceConnectionInfo {
  id: ServiceId;
  name: string;
  status: ConnectionStatus;
  description: string;
  auth_url?: string;
}

export type SortOrder = "relevance" | "newest" | "oldest";
