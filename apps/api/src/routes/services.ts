import { Router } from "express";
import type { ServiceConnectionInfo } from "../types/index.js";

const router = Router();

const serviceConnections: ServiceConnectionInfo[] = [
  { id: "slack", name: "Slack", status: "connected", description: "パブリックチャンネルのメッセージを検索" },
  { id: "gmail", name: "Gmail", status: "connected", description: "メール（件名・本文・添付ファイル名）を検索" },
  { id: "dropbox", name: "Dropbox", status: "disconnected", description: "ファイル名・ファイル内テキストを検索" },
  { id: "drive", name: "Google Drive", status: "expired", description: "ファイル名・ファイル内テキストを検索" },
];

router.get("/status", (_req, res) => {
  res.json(serviceConnections);
});

router.post("/:id/connect", (req, res) => {
  const svc = serviceConnections.find((s) => s.id === req.params.id);
  if (!svc) {
    res.status(404).json({ error: "service not found" });
    return;
  }
  svc.status = "connected";
  res.json(svc);
});

router.post("/:id/disconnect", (req, res) => {
  const svc = serviceConnections.find((s) => s.id === req.params.id);
  if (!svc) {
    res.status(404).json({ error: "service not found" });
    return;
  }
  svc.status = "disconnected";
  res.json(svc);
});

export { serviceConnections };
export default router;
