import type { Request } from "express";
import type { ServiceId } from "../types/index.js";
import { getToken, setToken } from "./tokens.js";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  if (!clientId || !clientSecret) return null;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;
  const data = await res.json() as Record<string, unknown>;
  if (!data.access_token) return null;
  return { access_token: data.access_token as string, expires_in: (data.expires_in as number) ?? 3600 };
}

async function refreshDropboxToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const appKey = process.env.DROPBOX_APP_KEY ?? "";
  const appSecret = process.env.DROPBOX_APP_SECRET ?? "";
  if (!appKey || !appSecret) return null;

  const basicAuth = Buffer.from(`${appKey}:${appSecret}`).toString("base64");
  const res = await fetch(DROPBOX_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;
  const data = await res.json() as Record<string, unknown>;
  if (!data.access_token) return null;
  return { access_token: data.access_token as string, expires_in: (data.expires_in as number) ?? 14400 };
}

export async function ensureFreshToken(req: Request, serviceId: ServiceId): Promise<string | null> {
  const token = getToken(req, serviceId);
  if (!token) return null;

  if (!token.expires_at || Date.now() < token.expires_at - 60_000) {
    return token.access_token;
  }

  if (!token.refresh_token) return null;

  let refreshed: { access_token: string; expires_in: number } | null = null;

  if (serviceId === "gmail" || serviceId === "drive") {
    refreshed = await refreshGoogleToken(token.refresh_token);
  } else if (serviceId === "dropbox") {
    refreshed = await refreshDropboxToken(token.refresh_token);
  }

  if (!refreshed) return null;

  setToken(req, serviceId, {
    access_token: refreshed.access_token,
    refresh_token: token.refresh_token,
    expires_at: Date.now() + refreshed.expires_in * 1000,
    token_type: token.token_type,
  });

  return refreshed.access_token;
}
