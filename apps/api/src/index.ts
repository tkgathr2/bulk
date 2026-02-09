import express from "express";
import cors from "cors";

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/search", (req, res) => {
  const { query } = req.body as { query?: string };

  res.json({
    job_id: "job_" + Date.now(),
    requested_at: new Date().toISOString(),
    query: query ?? "",
    filters: {
      services: ["slack", "gmail", "dropbox", "drive"],
      date_from: null,
      date_to: null,
      file_type: null,
    },
    services: {
      slack: {
        status: "success",
        total: 2,
        items: [
          {
            id: "slack-001",
            service: "slack",
            title: "#general",
            snippet: `${query ?? ""} に関する議論がありました`,
            updated_at: "2026-01-15T10:30:00Z",
            author: "田中太郎",
            url: "https://slack.com/archives/C01EXAMPLE/p1700000001",
            kind: "message",
            channel_name: "general",
          },
          {
            id: "slack-002",
            service: "slack",
            title: "#project-alpha",
            snippet: `${query ?? ""} の資料を共有します`,
            updated_at: "2026-01-10T14:00:00Z",
            author: "佐藤花子",
            url: "https://slack.com/archives/C02EXAMPLE/p1700000002",
            kind: "message",
            channel_name: "project-alpha",
          },
        ],
        error_code: null,
        error_message: null,
      },
      gmail: {
        status: "success",
        total: 1,
        items: [
          {
            id: "gmail-001",
            service: "gmail",
            title: `Re: ${query ?? ""} について`,
            snippet: "添付の資料をご確認ください。",
            updated_at: "2026-01-12T09:00:00Z",
            author: "suzuki@example.com",
            url: "https://mail.google.com/mail/u/0/#inbox/example001",
            kind: "email",
            from: "suzuki@example.com",
            to: "team@example.com",
            subject: `Re: ${query ?? ""} について`,
          },
        ],
        error_code: null,
        error_message: null,
      },
      dropbox: {
        status: "success",
        total: 1,
        items: [
          {
            id: "dbx-001",
            service: "dropbox",
            title: `${query ?? ""}_報告書.pdf`,
            snippet: null,
            updated_at: "2026-01-08T16:00:00Z",
            author: null,
            url: "https://www.dropbox.com/s/example/report.pdf",
            kind: "file",
            path: "/共有フォルダ/報告書/",
            mime_type: "application/pdf",
            file_size: 1024000,
          },
        ],
        error_code: null,
        error_message: null,
      },
      drive: {
        status: "success",
        total: 1,
        items: [
          {
            id: "drive-001",
            service: "drive",
            title: `${query ?? ""} まとめ`,
            snippet: "第3四半期の結果をまとめました。",
            updated_at: "2026-01-20T11:00:00Z",
            author: "yamada@example.com",
            url: "https://docs.google.com/document/d/example001/edit",
            kind: "file",
            path: "/マイドライブ/プロジェクト/",
            mime_type: "application/vnd.google-apps.document",
            file_size: null,
          },
        ],
        error_code: null,
        error_message: null,
      },
    },
  });
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
