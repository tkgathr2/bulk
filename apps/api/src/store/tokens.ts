import type { Request } from "express";
import type { ServiceId } from "../types/index.js";

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  token_type: string;
}

export function getToken(req: Request, serviceId: ServiceId): TokenData | null {
  return req.session.tokens?.[serviceId] ?? null;
}

export function setToken(req: Request, serviceId: ServiceId, token: TokenData): void {
  if (!req.session.tokens) {
    req.session.tokens = {};
  }
  req.session.tokens[serviceId] = token;
}

export function removeToken(req: Request, serviceId: ServiceId): void {
  if (req.session.tokens) {
    delete req.session.tokens[serviceId];
  }
}

export function getConnectionStatus(
  req: Request,
  serviceId: ServiceId
): "connected" | "disconnected" | "expired" {
  const token = getToken(req, serviceId);
  if (!token) return "disconnected";
  if (token.expires_at && Date.now() > token.expires_at) return "expired";
  return "connected";
}
