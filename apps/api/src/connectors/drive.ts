import type { ResultItem, ServiceResult, SearchRequest } from "../types/index.js";

const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";

const MIME_MAP: Record<string, string> = {
  document: "application/vnd.google-apps.document",
  spreadsheet: "application/vnd.google-apps.spreadsheet",
  presentation: "application/vnd.google-apps.presentation",
  pdf: "application/pdf",
  folder: "application/vnd.google-apps.folder",
  video: "video/",
  audio: "audio/",
  archive: "application/zip",
  text: "text/plain",
};

function driveTypeLabel(mimeType: string | undefined): string {
  if (!mimeType) return "ファイル";
  const labels: Record<string, string> = {
    "application/vnd.google-apps.document": "Google ドキュメント",
    "application/vnd.google-apps.spreadsheet": "Google スプレッドシート",
    "application/vnd.google-apps.presentation": "Google スライド",
    "application/vnd.google-apps.folder": "フォルダ",
    "application/vnd.google-apps.form": "Google フォーム",
    "application/vnd.google-apps.drawing": "Google 図形描画",
    "application/pdf": "PDF",
    "application/zip": "ZIP",
    "text/plain": "テキスト",
    "text/csv": "CSV",
  };
  if (labels[mimeType]) return labels[mimeType];
  if (mimeType.startsWith("image/")) return "画像";
  if (mimeType.startsWith("video/")) return "動画";
  if (mimeType.startsWith("audio/")) return "音声";
  if (mimeType.includes("word")) return "Word";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "Excel";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "PowerPoint";
  return "ファイル";
}

export async function searchDrive(
  accessToken: string,
  request: SearchRequest
): Promise<ServiceResult> {
  try {
    let driveQuery = `fullText contains '${request.query.replace(/'/g, "\\'")}'`;

    if (request.date_from) {
      driveQuery += ` and modifiedTime >= '${request.date_from}T00:00:00'`;
    }
    if (request.date_to) {
      driveQuery += ` and modifiedTime <= '${request.date_to}T23:59:59'`;
    }
    if (request.file_type && request.file_type !== "other") {
      const mime = MIME_MAP[request.file_type];
      if (mime) {
        if (request.file_type === "video" || request.file_type === "audio") {
          driveQuery += ` and mimeType contains '${mime}'`;
        } else {
          driveQuery += ` and mimeType = '${mime}'`;
        }
      } else if (request.file_type === "image") {
        driveQuery += ` and mimeType contains 'image/'`;
      }
    }

    driveQuery += " and trashed = false";

    const params = new URLSearchParams({
      q: driveQuery,
      pageSize: String(request.limit ?? 20),
      fields: "files(id,name,mimeType,modifiedTime,owners,webViewLink,parents,size,description),nextPageToken",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });

    const res = await fetch(`${DRIVE_FILES_URL}?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 429) {
      return {
        status: "error",
        total: null,
        items: [],
        error_code: "rate_limited",
        error_message: "Google Drive APIのレートリミットに達しました。数分待って再試行してください。",
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        status: "error",
        total: null,
        items: [],
        error_code: "auth_required",
        error_message: "Google Driveの認証が無効です。設定画面で再接続してください。",
      };
    }

    if (!res.ok) {
      return {
        status: "error",
        total: null,
        items: [],
        error_code: "unknown_error",
        error_message: `Google Drive API error: ${res.status}`,
      };
    }

    const data = await res.json() as Record<string, unknown>;
    const files = (data.files as Array<Record<string, unknown>>) ?? [];
    const hasMore = !!data.nextPageToken;

    const items: ResultItem[] = files.map((f) => {
      const owners = (f.owners as Array<Record<string, unknown>>) ?? [];
      const ownerEmail = (owners[0]?.emailAddress as string) ?? null;
      const mimeType = (f.mimeType as string) ?? undefined;
      const typeLabel = driveTypeLabel(mimeType);
      const parentIds = (f.parents as string[]) ?? [];
      return {
        id: `drive-${f.id}`,
        service: "drive" as const,
        title: (f.name as string) ?? "Untitled",
        snippet: (f.description as string) ?? `${typeLabel}`,
        updated_at: (f.modifiedTime as string) ?? null,
        author: ownerEmail,
        url: (f.webViewLink as string) ?? `https://drive.google.com/file/d/${f.id}/view`,
        kind: "file" as const,
        mime_type: mimeType,
        file_size: f.size ? Number(f.size) : null,
        raw_metadata: {
          type_label: typeLabel,
          mime_type: mimeType,
          parents: parentIds,
          description: (f.description as string) ?? null,
          owner: ownerEmail,
        },
      };
    });

    return {
      status: hasMore ? "partial" : "success",
      total: items.length,
      items,
      error_code: null,
      error_message: null,
    };
  } catch (err) {
    return {
      status: "error",
      total: null,
      items: [],
      error_code: "network_error",
      error_message: `Google Drive接続エラー: ${err instanceof Error ? err.message : "不明なエラー"}`,
    };
  }
}
