import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: { email: string; name: string };
    tokens?: Record<
      string,
      {
        access_token: string;
        refresh_token?: string;
        expires_at?: number;
        token_type: string;
      }
    >;
  }
}
