import type { ResultItem, ServiceResult, SearchRequest } from "../types/index.js";

const DROPBOX_SEARCH_URL = "https://api.dropboxapi.com/2/files/search_v2";
const DROPBOX_CONTINUE_URL = "https://api.dropboxapi.com/2/files/search/continue_v2";
const MAX_RESULTS = 100;

const CATEGORY_MAP: Record<string, string> = {
  document: "document",
  spreadsheet: "spreadsheet",
  presentation: "presentation",
  pdf: "pdf",
  image: "image",
  video: "video",
  audio: "audio",
  folder: "folder",
};

function detectMimeType(name: string): string | undefined {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return undefined;
  const map: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ppt: "application/vnd.ms-powerpoint",
    csv: "text/csv",
    txt: "text/plain",
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    bmp: "image/bmp",
  };
  return map[ext];
}

function fileTypeLabel(name: string, tag?: string): string {
  if (tag === "folder") return "フォルダ";
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return "ファイル";
  const labels: Record<string, string> = {
    pdf: "PDF",
    docx: "Word", doc: "Word",
    xlsx: "Excel", xls: "Excel",
    pptx: "PowerPoint", ppt: "PowerPoint",
    csv: "CSV", txt: "テキスト",
    zip: "ZIP", rar: "RAR",
    mp4: "動画", mov: "動画", avi: "動画",
    mp3: "音声", wav: "音声",
    png: "画像", jpg: "画像", jpeg: "画像", gif: "画像", svg: "画像", bmp: "画像",
  };
  return labels[ext] ?? ext.toUpperCase();
}

export async function searchDropbox(
  accessToken: string,
  request: SearchRequest
): Promise<ServiceResult> {
  try {
    const options: Record<string, unknown> = {
      max_results: MAX_RESULTS,
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
        include_highlights: true,
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

    let allMatches: Array<Record<string, unknown>> = [];
    let data = await res.json() as Record<string, unknown>;
    allMatches.push(...((data.matches as Array<Record<string, unknown>>) ?? []));

    while (data.has_more && data.cursor) {
      const contRes = await fetch(DROPBOX_CONTINUE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cursor: data.cursor }),
      });
      if (!contRes.ok) break;
      data = await contRes.json() as Record<string, unknown>;
      allMatches.push(...((data.matches as Array<Record<string, unknown>>) ?? []));
    }

    const mapped = allMatches
      .map((m): ResultItem | null => {
        const metadataWrapper = m.metadata as Record<string, unknown> | undefined;
        const metadata = metadataWrapper?.metadata as Record<string, unknown> | undefined;
        if (!metadata) return null;

        const tag = (metadata[".tag"] as string) ?? "file";
        const name = (metadata.name as string) ?? "Untitled";
        const pathDisplay = (metadata.path_display as string) ?? "";
        const serverModified = (metadata.server_modified as string) ?? null;
        const clientModified = (metadata.client_modified as string) ?? null;
        const size = metadata.size as number | undefined;
        const id = (metadata.id as string) ?? `dbx-${Date.now()}`;
        const rev = (metadata.rev as string) ?? null;
        const contentHash = (metadata.content_hash as string) ?? null;
        const isDownloadable = metadata.is_downloadable as boolean | undefined;
        const sharingInfo = metadata.sharing_info as Record<string, unknown> | undefined;

        const mimeType = detectMimeType(name);
        const typeLabel = fileTypeLabel(name, tag);

        const highlightResult = m.highlight_result as Record<string, unknown> | undefined;
        let snippet: string | null = null;
        if (highlightResult) {
          const spans = highlightResult.filename as Array<Record<string, unknown>> | undefined;
          if (!spans) {
            const content = highlightResult.file_content as Record<string, unknown> | undefined;
            const contentSpans = content?.spans as Array<Record<string, unknown>> | undefined;
            if (contentSpans) {
              snippet = contentSpans.map((s) => (s.text as string) ?? "").join("");
            }
          }
        }

        const pathParts = pathDisplay.split("/");
        pathParts.pop();
        const folder = pathParts.join("/") || "/";

        return {
          id: `dbx-${id}`,
          service: "dropbox" as const,
          title: name,
          snippet: snippet ?? `${typeLabel} — ${folder}`,
          updated_at: serverModified,
          author: null,
          url: `https://www.dropbox.com/preview${pathDisplay}`,
          kind: tag === "folder" ? "file" as const : "file" as const,
          path: folder,
          mime_type: mimeType,
          file_size: size ?? null,
          raw_metadata: {
            tag,
            type_label: typeLabel,
            path_display: pathDisplay,
            server_modified: serverModified,
            client_modified: clientModified,
            rev,
            content_hash: contentHash,
            is_downloadable: isDownloadable,
            sharing_info: sharingInfo,
          },
        };
      });
    const items: ResultItem[] = mapped.filter((item): item is ResultItem => item !== null);

    const filteredItems = applyLocalFilters(items, request);

    return {
      status: "success",
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
