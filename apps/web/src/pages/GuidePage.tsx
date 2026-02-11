import { useNavigate } from "react-router-dom";

const steps = [
  {
    number: 1,
    title: "サービスを接続する",
    description:
      "画面右上の「設定」をクリックし、検索したいサービス（Slack・Gmail・Dropbox・Google Drive）の「接続」ボタンを押してください。各サービスの OAuth 認証画面が表示されるので「許可」してください。",
    icon: "🔗",
  },
  {
    number: 2,
    title: "キーワードで横断検索",
    description:
      "「検索」画面でキーワードを入力すると、接続済みのサービスをまとめて検索します。サービスごとにタブで結果を切り替えられます。",
    icon: "🔍",
  },
  {
    number: 3,
    title: "結果を確認する",
    description:
      "検索結果から気になるアイテムをクリックすると、詳細画面でプレビューを確認できます。元のサービスへのリンクからファイルを直接開くこともできます。",
    icon: "📄",
  },
];

const serviceInfo = [
  { name: "Slack", desc: "パブリックチャンネルのメッセージを検索", color: "#4A154B" },
  { name: "Gmail", desc: "メールの件名・本文を検索", color: "#EA4335" },
  { name: "Dropbox", desc: "ファイル名・フォルダ名を検索", color: "#0061FF" },
  { name: "Google Drive", desc: "ドキュメント・スプレッドシート等を検索", color: "#0F9D58" },
];

export default function GuidePage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 32 }}>
      <h2 style={{ fontSize: 24, fontWeight: 500, marginBottom: 8, color: "var(--primary)" }}>
        一括検索君の使い方
      </h2>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 32 }}>
        Slack・Gmail・Dropbox・Google Drive を横断検索できるツールです
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
        {steps.map((step) => (
          <div
            key={step.number}
            style={{
              display: "flex",
              gap: 16,
              padding: 24,
              border: "1px solid var(--border)",
              borderRadius: 12,
              background: "var(--bg)",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--primary)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {step.number}
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>対応サービス</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 40 }}>
        {serviceInfo.map((svc) => (
          <div
            key={svc.name}
            style={{
              padding: "16px 20px",
              border: "1px solid var(--border)",
              borderRadius: 10,
              borderLeft: `4px solid ${svc.color}`,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{svc.name}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{svc.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button
          onClick={() => navigate("/settings")}
          style={{
            padding: "12px 32px",
            borderRadius: 8,
            border: "none",
            background: "var(--primary)",
            color: "#fff",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          設定画面でサービスを接続する
        </button>
        <button
          onClick={() => navigate("/search")}
          style={{
            padding: "12px 32px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text)",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          検索画面へ
        </button>
      </div>
    </div>
  );
}
