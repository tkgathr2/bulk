import type { ResultItem, ServiceResult, SearchRequest } from "../types/index.js";

const DROPBOX_SEARCH_URL = "https://api.dropboxapi.com/2/files/search_v2";

const CATEGORY_MAP: Record<string, string> = {
  document: "document",
  spreadsheet: "spreadsheet",
  presentation: "presentation",
  pdf: "pdf",
  image: "image",
};

export async function searchDropbox(
  accessToken: string,
  request: SearchRequest
): Promise<ServiceResult> {
  try {
    const options: Record<string, unknown> = {
      max_results: request.limit ?? 20,
      file_status: { ".tag": "active" },
      filename_only: false,
    };

    if (request.file_type && request.file_type !== "other") {
      const cat = CATEGORY_MAP[request.file_type];
      if (cat) {
        options.file_categories = [{ ".tag": cat }];
      }
    }

    const body: Record<string, unknown> = {
      query: request.query,
      options,
      match_field_options: {
        include_highlights: false,
      },
    };

    const res = await fetch(DROPBOX_SEARCH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      return {
        status: "error",
        total: null,
        items: [],
        error_code: "rate_limited",
        error_message: retryAfter
          ? `Dropbox APIのレートリミットに達しました。${retryAfter}秒後に再試行してください。`
          : "Dropbox APIのレートリミットに達しました。数分待って再試行してください。",
      };
    }

    if (res.status === 401) {
      return {
        status: "error",
        total: null,
        items: [],
        error_code: "auth_required",
        error_message: "Dropboxの認証が無効です。設定画面で再接続してください。",
      };
    }

    if (!res.ok) {
      return {
        status: "error",
        total: null,
        items: [],
        error_code: "unknown_error",
        error_message: `Dropbox API error: ${res.status}`,
      };
    }

    const data = await res.json() as Record<string, unknown>;
    const matches = (data.matches as Array<Record<string, unknown>>) ?? [];
    const hasMore = data.has_more as boolean;

    const mapped = matches
      .map((m): ResultItem | null => {
        const metadata = (m.metadata as Record<string, unknown>)?.metadata as Record<string, unknown> | undefined;
        if (!metadata) return null;

        const name = (metadata.name as string) ?? "Untitled";
        const pathDisplay = (metadata.path_display as string) ?? "";
        const serverModified = (metadata.server_modified as string) ?? null;
        const size = metadata.size as number | undefined;
        const id = (metadata.id as string) ?? `dbx-${Date.now()}`;

        let mimeType: string | undefined;
        if (name.endsWith(".pdf")) mimeType = "application/pdf";
        else if (name.endsWith(".docx")) mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        else if (name.endsWith(".xlsx")) mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        else if (name.endsWith(".pptx")) mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        else if (name.match(/\.(png|jpg|jpeg|gif|bmp|svg)$/i)) mimeType = `image/${name.split(".").pop()?.toLowerCase()}`;

        const pathParts = pathDisplay.split("/");
        pathParts.pop();
        const folder = pathParts.join("/") + "/";

        return {
          id: `dbx-${id}`,
          service: "dropbox" as const,
          title: name,
          snippet: null,
          updated_at: serverModified,
          author: null,
          url: `https://www.dropbox.com/preview${pathDisplay}`,
          kind: "file" as const,
          path: folder,
          mime_type: mimeType,
          file_size: size ?? null,
        };
      });
    const items: ResultItem[] = mapped.filter((item): item is ResultItem => item !== null);

    const filteredItems = applyLocalFilters(items, request);

    return {
      status: hasMore ? "partial" : "success",
      total: filteredItems.length,
      items: filteredItems,
      error_code: null,
      error_message: null,
    };
  } catch (err) {
    return {
      status: "error",
      total: null,
      items: [],
      error_code: "network_error",
      error_message: `Dropbox接続エラー: ${err instanceof Error ? err.message : "不明なエラー"}`,
    };
  }
}

function applyLocalFilters(items: ResultItem[], request: SearchRequest): ResultItem[] {
  let filtered = items;
  if (request.date_from) {
    const from = new Date(request.date_from).getTime();
    filtered = filtered.filter((item) => item.updated_at && new Date(item.updated_at).getTime() >= from);
  }
  if (request.date_to) {
    const to = new Date(request.date_to).getTime();
    filtered = filtered.filter((item) => item.updated_at && new Date(item.updated_at).getTime() <= to);
  }
  return filtered;
}
