import { Router } from "express";
import type { ServiceConnectionInfo, ServiceId } from "../types/index.js";
import { getConnectionStatus, removeToken } from "../store/tokens.js";

const router = Router();

const SERVICE_META: { id: ServiceId; name: string; description: string }[] = [
  { id: "slack", name: "Slack", description: "パブリックチャンネルのメッセージを検索" },
  { id: "gmail", name: "Gmail", description: "メール（件名・本文・添付ファイル名）を検索" },
  { id: "dropbox", name: "Dropbox", description: "ファイル名・ファイル内テキストを検索" },
  { id: "drive", name: "Google Drive", description: "ファイル名・ファイル内テキストを検索" },
];

const AUTH_URLS: Record<ServiceId, string> = {
  slack: "/auth/slack/authorize",
  gmail: "/auth/google/gmail/authorize",
  dropbox: "/auth/dropbox/authorize",
  drive: "/auth/google/drive/authorize",
};

router.get("/status", (req, res) => {
  const result: ServiceConnectionInfo[] = SERVICE_META.map((meta) => ({
    ...meta,
    status: getConnectionStatus(req, meta.id),
    auth_url: AUTH_URLS[meta.id],
  }));
  res.json(result);
});

router.post("/:id/connect", (req, res) => {
  const serviceId = req.params.id as ServiceId;
  const meta = SERVICE_META.find((s) => s.id === serviceId);
  if (!meta) {
    res.status(404).json({ error: "service not found" });
    return;
  }
  const authUrl = AUTH_URLS[serviceId];
  res.json({ redirect: authUrl });
});

router.post("/:id/disconnect", (req, res) => {
  const serviceId = req.params.id as ServiceId;
  const meta = SERVICE_META.find((s) => s.id === serviceId);
  if (!meta) {
    res.status(404).json({ error: "service not found" });
    return;
  }
  removeToken(req, serviceId);
  res.json({ ...meta, status: "disconnected" });
});

export default router;
