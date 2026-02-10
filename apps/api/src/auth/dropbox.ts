import { Router } from "express";
import { setToken } from "../store/tokens.js";

const router = Router();

const DROPBOX_AUTH_URL = "https://www.dropbox.com/oauth2/authorize";
const DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";

function getConfig() {
  return {
    appKey: process.env.DROPBOX_APP_KEY ?? "",
    appSecret: process.env.DROPBOX_APP_SECRET ?? "",
    apiBase: process.env.API_BASE_URL ?? "http://localhost:8080",
    webBase: process.env.WEB_BASE_URL ?? "http://localhost:5173",
  };
}

function isConfigured(): boolean {
  const cfg = getConfig();
  return (
    cfg.appKey !== "" &&
    cfg.appKey !== "REPLACE_WITH_SECRET" &&
    cfg.appSecret !== "" &&
    cfg.appSecret !== "REPLACE_WITH_SECRET"
  );
}

router.get("/authorize", (req, res) => {
  if (!isConfigured()) {
    res.status(503).json({ error: "Dropbox OAuth is not configured. Set DROPBOX_APP_KEY and DROPBOX_APP_SECRET in .env" });
    return;
  }
  const cfg = getConfig();
  const params = new URLSearchParams({
    client_id: cfg.appKey,
    redirect_uri: `${cfg.apiBase}/auth/dropbox/callback`,
    response_type: "code",
    token_access_type: "offline",
  });
  res.redirect(`${DROPBOX_AUTH_URL}?${params}`);
});

router.get("/callback", async (req, res) => {
  const code = req.query.code as string | undefined;
  const cfg = getConfig();

  if (!code) {
    res.redirect(`${cfg.webBase}/settings?error=no_code&service=dropbox`);
    return;
  }

  try {
    const basicAuth = Buffer.from(`${cfg.appKey}:${cfg.appSecret}`).toString("base64");
    const tokenRes = await fetch(DROPBOX_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: `${cfg.apiBase}/auth/dropbox/callback`,
      }),
    });
    const tokenData = await tokenRes.json() as Record<string, unknown>;

    if (!tokenRes.ok || !tokenData.access_token) {
      res.redirect(`${cfg.webBase}/settings?error=token_exchange_failed&service=dropbox`);
      return;
    }

    setToken(req, "dropbox", {
      access_token: tokenData.access_token as string,
      refresh_token: tokenData.refresh_token as string | undefined,
      expires_at: tokenData.expires_in
        ? Date.now() + (tokenData.expires_in as number) * 1000
        : undefined,
      token_type: "Bearer",
    });

    res.redirect(`${cfg.webBase}/settings?connected=dropbox`);
  } catch {
    res.redirect(`${cfg.webBase}/settings?error=auth_failed&service=dropbox`);
  }
});

export default router;
