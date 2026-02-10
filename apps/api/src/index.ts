import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import searchRouter from "./routes/search.js";
import servicesRouter from "./routes/services.js";
import authRouter from "./auth/index.js";

const app = express();
const PORT = 8080;

const WEB_BASE = process.env.WEB_BASE_URL ?? "http://localhost:5173";

app.use(
  cors({
    origin: WEB_BASE,
    credentials: true,
  })
);
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "dev-session-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/search", searchRouter);
app.use("/services", servicesRouter);

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
