import type { ServiceId, ServiceResult, SearchRequest, FileType } from "../types/index.js";
import { slackItems, gmailItems, dropboxItems, driveItems } from "./mock-data.js";
import type { ResultItem } from "../types/index.js";

const allItems: Record<ServiceId, ResultItem[]> = {
  slack: slackItems,
  gmail: gmailItems,
  dropbox: dropboxItems,
  drive: driveItems,
};

function filterByDate(items: ResultItem[], dateFrom: string | null | undefined, dateTo: string | null | undefined): ResultItem[] {
  let filtered = items;
  if (dateFrom) {
    const from = new Date(dateFrom).getTime();
    filtered = filtered.filter((item) => {
      if (!item.updated_at) return false;
      return new Date(item.updated_at).getTime() >= from;
    });
  }
  if (dateTo) {
    const to = new Date(dateTo).getTime();
    filtered = filtered.filter((item) => {
      if (!item.updated_at) return false;
      return new Date(item.updated_at).getTime() <= to;
    });
  }
  return filtered;
}

function filterByFileType(items: ResultItem[], fileType: FileType | null | undefined): ResultItem[] {
  if (!fileType) return items;
  return items.filter((item) => {
    if (!item.mime_type) return fileType === "other";
    const mime = item.mime_type.toLowerCase();
    switch (fileType) {
      case "document":
        return mime.includes("document") || mime.includes("wordprocessing");
      case "spreadsheet":
        return mime.includes("spreadsheet") || mime.includes("excel");
      case "presentation":
        return mime.includes("presentation") || mime.includes("powerpoint");
      case "pdf":
        return mime.includes("pdf");
      case "image":
        return mime.startsWith("image/");
      case "other":
        return true;
      default:
        return true;
    }
  });
}

function filterByQuery(items: ResultItem[], query: string): ResultItem[] {
  const q = query.toLowerCase();
  return items.filter((item) => {
    const fields = [item.title, item.snippet, item.author, item.channel_name, item.subject, item.path].filter(Boolean);
    return fields.some((f) => f!.toLowerCase().includes(q));
  });
}

export function searchService(
  serviceId: ServiceId,
  request: SearchRequest
): ServiceResult {
  const sourceItems = allItems[serviceId];
  if (!sourceItems) {
    return {
      status: "error",
      total: null,
      items: [],
      error_code: "unknown_error",
      error_message: `Unknown service: ${serviceId}`,
    };
  }

  let filtered = filterByQuery(sourceItems, request.query);
  filtered = filterByDate(filtered, request.date_from, request.date_to);
  filtered = filterByFileType(filtered, request.file_type);

  const offset = request.offset ?? 0;
  const limit = request.limit ?? 20;
  const paged = filtered.slice(offset, offset + limit);

  return {
    status: filtered.length > paged.length + offset ? "partial" : "success",
    total: filtered.length,
    items: paged,
    error_code: null,
    error_message: null,
  };
}
