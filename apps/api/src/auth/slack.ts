import { Router } from "express";
import { setToken } from "../store/tokens.js";

const router = Router();

const SLACK_AUTH_URL = "https://slack.com/oauth/v2/authorize";
const SLACK_TOKEN_URL = "https://slack.com/api/oauth.v2.access";

function getConfig() {
  return {
    clientId: process.env.SLACK_CLIENT_ID ?? "",
    clientSecret: process.env.SLACK_CLIENT_SECRET ?? "",
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

router.get("/authorize", (req, res) => {
  if (!isConfigured()) {
    res.status(503).json({ error: "Slack OAuth is not configured. Set SLACK_CLIENT_ID and SLACK_CLIENT_SECRET in .env" });
    return;
  }
  const cfg = getConfig();
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: `${cfg.apiBase}/auth/slack/callback`,
    scope: "",
    user_scope: "search:read",
  });
  res.redirect(`${SLACK_AUTH_URL}?${params}`);
});

router.get("/callback", async (req, res) => {
  const code = req.query.code as string | undefined;
  const cfg = getConfig();

  if (!code) {
    res.redirect(`${cfg.webBase}/settings?error=no_code&service=slack`);
    return;
  }

  try {
    const tokenRes = await fetch(SLACK_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        redirect_uri: `${cfg.apiBase}/auth/slack/callback`,
      }),
    });
    const tokenData = await tokenRes.json() as Record<string, unknown>;

    if (!tokenRes.ok || !tokenData.ok) {
      res.redirect(`${cfg.webBase}/settings?error=token_exchange_failed&service=slack`);
      return;
    }

    const authedUser = tokenData.authed_user as Record<string, unknown> | undefined;
    const accessToken = authedUser?.access_token as string | undefined;

    if (!accessToken) {
      res.redirect(`${cfg.webBase}/settings?error=no_user_token&service=slack`);
      return;
    }

    setToken(req, "slack", {
      access_token: accessToken,
      token_type: "Bearer",
    });

    req.session.save((err) => {
      if (err) console.error("[auth] session save error (slack):", err);
      res.redirect(`${cfg.webBase}/settings?connected=slack`);
    });
  } catch (err) {
    console.error("[auth] slack callback error:", err);
    res.redirect(`${cfg.webBase}/settings?error=auth_failed&service=slack`);
  }
});

export default router;
