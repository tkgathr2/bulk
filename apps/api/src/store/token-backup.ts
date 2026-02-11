import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

const COOKIE_NAME = "tkn_backup";
const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.SESSION_SECRET ?? "dev-session-secret-change-me";
  return crypto.scryptSync(secret, "bulk-salt", 32);
}

function encrypt(data: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), encrypted.toString("base64"), tag.toString("base64")].join(".");
}

function decrypt(payload: string): string | null {
  try {
    const [ivB64, encB64, tagB64] = payload.split(".");
    if (!ivB64 || !encB64 || !tagB64) return null;
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encB64, "base64")), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export function tokenBackupMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.tokens && req.cookies?.[COOKIE_NAME]) {
    const plain = decrypt(req.cookies[COOKIE_NAME]);
    if (plain) {
      try {
        const restored = JSON.parse(plain) as Record<string, unknown>;
        if (restored && typeof restored === "object") {
          req.session.tokens = restored as unknown as typeof req.session.tokens;
        }
      } catch {
        // ignore
      }
    }
  }

  if (!req.session.user && req.cookies?.user_backup) {
    try {
      const plain = decrypt(req.cookies.user_backup);
      if (plain) {
        const restored = JSON.parse(plain) as { email: string; name: string };
        if (restored?.email) {
          req.session.user = restored;
        }
      }
    } catch {
      // ignore
    }
  }

  const origEnd = res.end.bind(res);
  res.end = function patchedEnd(...args: Parameters<typeof origEnd>) {
    if (res.headersSent) {
      return origEnd(...args);
    }
    try {
      if (req.session.tokens && Object.keys(req.session.tokens).length > 0) {
        const encrypted = encrypt(JSON.stringify(req.session.tokens));
        res.cookie(COOKIE_NAME, encrypted, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 365 * 24 * 60 * 60 * 1000,
          sameSite: "lax",
        });
      }
      if (req.session.user) {
        const encrypted = encrypt(JSON.stringify(req.session.user));
        res.cookie("user_backup", encrypted, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 365 * 24 * 60 * 60 * 1000,
          sameSite: "lax",
        });
      }
    } catch {
      console.warn(`token-backup cookie skipped: ${req.path}`);
    }
    return origEnd(...args);
  } as typeof origEnd;

  next();
}

export function clearTokenBackup(res: Response): void {
  res.clearCookie(COOKIE_NAME);
  res.clearCookie("user_backup");
}
