import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import FileStoreFactory from "session-file-store";
import searchRouter from "./routes/search.js";
import servicesRouter from "./routes/services.js";
import authRouter from "./auth/index.js";
import { tokenBackupMiddleware } from "./store/token-backup.js";

const FileStore = FileStoreFactory(session);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 8080;
const IS_PROD = process.env.NODE_ENV === "production";

const WEB_BASE = process.env.WEB_BASE_URL ?? "http://localhost:5173";

if (IS_PROD) {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: IS_PROD ? true : WEB_BASE,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const SESSION_DIR = process.env.SESSION_STORE_PATH ?? path.resolve(__dirname, "../../.sessions");
fs.mkdirSync(SESSION_DIR, { recursive: true });

app.use(
  session({
    store: new FileStore({
      path: SESSION_DIR,
      ttl: 30 * 24 * 60 * 60,
      retries: 1,
      logFn: () => {},
    }),
    secret: process.env.SESSION_SECRET ?? "dev-session-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: IS_PROD,
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

app.use(tokenBackupMiddleware);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/search", searchRouter);
app.use("/services", servicesRouter);

if (IS_PROD) {
  const staticDir = path.resolve(__dirname, "../../web/dist");
  app.use(express.static(staticDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
