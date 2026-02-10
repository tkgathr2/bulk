import { Router } from "express";
import type { SearchRequest, ServiceId, SearchFilters, SearchHistoryEntry, ServiceResult } from "../types/index.js";
import { searchServiceReal } from "../connectors/index.js";
import { getToken, getConnectionStatus } from "../store/tokens.js";

const router = Router();

const searchHistory: SearchHistoryEntry[] = [];
const MAX_HISTORY = 30;

router.post("/", async (req, res) => {
  const body = req.body as SearchRequest;
  const query = (body.query ?? "").trim();

  if (!query) {
    res.status(400).json({ error: "query is required" });
    return;
  }

  if (query.length > 200) {
    res.status(400).json({ error: "query must be 200 characters or less" });
    return;
  }

  const requestedServices: ServiceId[] = body.services ?? ["slack", "gmail", "dropbox", "drive"];

  const filters: SearchFilters = {
    services: requestedServices,
    date_from: body.date_from ?? null,
    date_to: body.date_to ?? null,
    file_type: body.file_type ?? null,
  };

  const searchRequest: SearchRequest = {
    query,
    date_from: body.date_from,
    date_to: body.date_to,
    file_type: body.file_type,
    offset: body.offset,
    limit: body.limit,
  };

  const servicePromises: Promise<[ServiceId, ServiceResult]>[] = requestedServices.map(
    async (svcId): Promise<[ServiceId, ServiceResult]> => {
      const connStatus = getConnectionStatus(req, svcId);

      if (connStatus !== "connected") {
        return [
          svcId,
          {
            status: "error",
            total: null,
            items: [],
            error_code: "auth_required",
            error_message: connStatus === "expired"
              ? "トークンの有効期限が切れています。設定画面で再接続してください。"
              : "サービスが未接続です。設定画面で接続してください。",
          },
        ];
      }

      const token = getToken(req, svcId);
      if (!token) {
        return [
          svcId,
          {
            status: "error",
            total: null,
            items: [],
            error_code: "auth_required",
            error_message: "サービスが未接続です。設定画面で接続してください。",
          },
        ];
      }

      try {
        const result = await searchServiceReal(svcId, token, searchRequest);
        return [svcId, result];
      } catch {
        return [
          svcId,
          {
            status: "error",
            total: null,
            items: [],
            error_code: "network_error",
            error_message: "検索中にエラーが発生しました。",
          },
        ];
      }
    }
  );

  const results = await Promise.all(servicePromises);
  const services: Record<string, ServiceResult> = {};
  for (const [id, result] of results) {
    services[id] = result;
  }

  res.json({
    job_id: "job_" + Date.now(),
    requested_at: new Date().toISOString(),
    query,
    filters,
    services,
  });
});

router.get("/history", (_req, res) => {
  res.json(searchHistory);
});

router.post("/history", (req, res) => {
  const { query, filters } = req.body as { query: string; filters: SearchFilters };
  if (!query) {
    res.status(400).json({ error: "query is required" });
    return;
  }

  const entry: SearchHistoryEntry = {
    id: "hist_" + Date.now(),
    query,
    filters: filters ?? {
      services: ["slack", "gmail", "dropbox", "drive"],
      date_from: null,
      date_to: null,
      file_type: null,
    },
    searched_at: new Date().toISOString(),
  };

  searchHistory.unshift(entry);
  if (searchHistory.length > MAX_HISTORY) {
    searchHistory.length = MAX_HISTORY;
  }

  res.json(entry);
});

router.delete("/history/:id", (req, res) => {
  const idx = searchHistory.findIndex((h) => h.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "not found" });
    return;
  }
  searchHistory.splice(idx, 1);
  res.json({ ok: true });
});

router.delete("/history", (_req, res) => {
  searchHistory.length = 0;
  res.json({ ok: true });
});

export default router;
