import { Router } from "express";
import type { ServiceId } from "../types/index.js";
import { setToken, removeToken } from "../store/tokens.js";

const router = Router();

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

const SCOPES: Record<string, string[]> = {
  login: ["openid", "email", "profile"],
  gmail: ["https://www.googleapis.com/auth/gmail.readonly"],
  drive: ["https://www.googleapis.com/auth/drive.readonly"],
};

function getConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    apiBase: process.env.API_BASE_URL ?? "http://localhost:8080",
    webBase: process.env.WEB_BASE_URL ?? "http://localhost:5173",
  };
}

function isConfigured(): boolean {
  const cfg = getConfig();
  return (
    cfg.clientId !== "" &&
    cfg.clientId !== "REPLACE_WITH_SECRET" &&
    cfg.clientSecret !== "" &&
    cfg.clientSecret !== "REPLACE_WITH_SECRET"
  );
}

router.get("/login", (req, res) => {
  if (!isConfigured()) {
    res.status(503).json({ error: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env" });
    return;
  }
  const cfg = getConfig();
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: `${cfg.apiBase}/auth/google/login/callback`,
    response_type: "code",
    scope: SCOPES.login.join(" "),
    access_type: "offline",
    prompt: "consent",
  });
  res.redirect(`${GOOGLE_AUTH_URL}?${params}`);
});

router.get("/login/callback", async (req, res) => {
  const code = req.query.code as string | undefined;
  const cfg = getConfig();

  if (!code) {
    res.redirect(`${cfg.webBase}/?error=no_code`);
    return;
  }

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        redirect_uri: `${cfg.apiBase}/auth/google/login/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json() as Record<string, unknown>;

    if (!tokenRes.ok || !tokenData.access_token) {
      res.redirect(`${cfg.webBase}/?error=token_exchange_failed`);
      return;
    }

    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json() as Record<string, unknown>;

    req.session.user = {
      email: (userData.email as string) ?? "",
      name: (userData.name as string) ?? "",
    };

    res.redirect(`${cfg.webBase}/settings`);
  } catch {
    res.redirect(`${cfg.webBase}/?error=login_failed`);
  }
});

function makeServiceAuthHandler(serviceId: ServiceId, scopes: string[]) {
  router.get(`/${serviceId}/authorize`, (req, res) => {
    if (!isConfigured()) {
      res.status(503).json({ error: `Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env` });
      return;
    }
    const cfg = getConfig();
    const params = new URLSearchParams({
      client_id: cfg.clientId,
      redirect_uri: `${cfg.apiBase}/auth/google/${serviceId}/callback`,
      response_type: "code",
      scope: [...SCOPES.login, ...scopes].join(" "),
      access_type: "offline",
      prompt: "consent",
    });
    res.redirect(`${GOOGLE_AUTH_URL}?${params}`);
  });

  router.get(`/${serviceId}/callback`, async (req, res) => {
    const code = req.query.code as string | undefined;
    const cfg = getConfig();

    if (!code) {
      res.redirect(`${cfg.webBase}/settings?error=no_code&service=${serviceId}`);
      return;
    }

    try {
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: cfg.clientId,
          client_secret: cfg.clientSecret,
          redirect_uri: `${cfg.apiBase}/auth/google/${serviceId}/callback`,
          grant_type: "authorization_code",
        }),
      });
      const tokenData = await tokenRes.json() as Record<string, unknown>;

      if (!tokenRes.ok || !tokenData.access_token) {
        res.redirect(`${cfg.webBase}/settings?error=token_exchange_failed&service=${serviceId}`);
        return;
      }

      setToken(req, serviceId, {
        access_token: tokenData.access_token as string,
        refresh_token: tokenData.refresh_token as string | undefined,
        expires_at: tokenData.expires_in
          ? Date.now() + (tokenData.expires_in as number) * 1000
          : undefined,
        token_type: (tokenData.token_type as string) ?? "Bearer",
      });

      res.redirect(`${cfg.webBase}/settings?connected=${serviceId}`);
    } catch {
      res.redirect(`${cfg.webBase}/settings?error=auth_failed&service=${serviceId}`);
    }
  });
}

makeServiceAuthHandler("gmail", SCOPES.gmail);
makeServiceAuthHandler("drive", SCOPES.drive);

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/me", (req, res) => {
  if (req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false, user: null });
  }
});

router.post("/:serviceId/disconnect", (req, res) => {
  const serviceId = req.params.serviceId as ServiceId;
  removeToken(req, serviceId);
  res.json({ ok: true, service: serviceId, status: "disconnected" });
});

export default router;
