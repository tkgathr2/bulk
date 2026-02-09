import express from "express";
import cors from "cors";
import searchRouter from "./routes/search.js";
import servicesRouter from "./routes/services.js";

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/search", searchRouter);
app.use("/services", servicesRouter);

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
