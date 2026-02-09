import { useState } from "react";
import { useNavigate } from "react-router-dom";

const serviceOptions = [
  { id: "slack", label: "Slack", color: "#4A154B" },
  { id: "gmail", label: "Gmail", color: "#EA4335" },
  { id: "dropbox", label: "Dropbox", color: "#0061FF" },
  { id: "drive", label: "Google Drive", color: "#0F9D58" },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [services, setServices] = useState<string[]>(
    serviceOptions.map((s) => s.id)
  );

  const toggleService = (id: string) => {
    setServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    navigate(`/results?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 60px)",
        padding: 24,
      }}
    >
      <h2
        style={{
          fontSize: 32,
          fontWeight: 400,
          color: "var(--text)",
          marginBottom: 32,
        }}
      >
        何を探しますか？
      </h2>

      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: 680,
          border: "1px solid var(--border)",
          borderRadius: 28,
          padding: "8px 16px",
          boxShadow: "0 1px 6px rgba(32,33,36,0.1)",
        }}
      >
        <input
          type="text"
          placeholder="キーワードを入力..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          maxLength={200}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: 16,
            padding: "8px 12px",
            background: "transparent",
          }}
        />
        <button
          onClick={handleSearch}
          disabled={!query.trim()}
          style={{
            padding: "8px 24px",
            border: "none",
            borderRadius: 20,
            background: query.trim() ? "var(--primary)" : "var(--border)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          検索
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 20,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {serviceOptions.map((svc) => (
          <button
            key={svc.id}
            onClick={() => toggleService(svc.id)}
            style={{
              padding: "6px 16px",
              borderRadius: 16,
              border: `1px solid ${services.includes(svc.id) ? svc.color : "var(--border)"}`,
              background: services.includes(svc.id) ? `${svc.color}10` : "transparent",
              color: services.includes(svc.id) ? svc.color : "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {svc.label}
          </button>
        ))}
      </div>
    </div>
  );
}
