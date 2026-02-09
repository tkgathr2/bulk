import { Router } from "express";
import type { SearchRequest, ServiceId, SearchFilters, SearchHistoryEntry } from "../types/index.js";
import { searchService } from "../connectors/index.js";

const router = Router();

const searchHistory: SearchHistoryEntry[] = [];
const MAX_HISTORY = 30;

router.post("/", (req, res) => {
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

  const services: Record<string, ReturnType<typeof searchService>> = {};
  for (const svcId of requestedServices) {
    services[svcId] = searchService(svcId, {
      query,
      date_from: body.date_from,
      date_to: body.date_to,
      file_type: body.file_type,
      offset: body.offset,
      limit: body.limit,
    });
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
