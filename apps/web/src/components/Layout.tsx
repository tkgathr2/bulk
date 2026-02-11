import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { logout } from "../api/client";
import { useIsMobile } from "../hooks/useIsMobile";

const navItems = [
  { to: "/search", label: "検索", icon: null },
  { to: "/settings", label: null, icon: "gear" },
  { to: "/guide", label: "使い方", icon: null },
];

function GearIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "8px 12px" : "12px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
          gap: 8,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }}
          onClick={() => navigate("/search")}
        >
          <span style={{ fontSize: isMobile ? 16 : 24, fontWeight: 600, color: "var(--primary)" }}>
            一括検索君 <span style={{ fontSize: isMobile ? 10 : 12, fontWeight: 400, color: "var(--text-secondary)", marginLeft: 4 }}>Ver2.0</span>
          </span>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: isMobile ? 2 : 8, flexWrap: "nowrap", overflow: "auto" }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.icon === "gear" ? "設定" : undefined}
              style={({ isActive }) => ({
                padding: item.icon === "gear" ? (isMobile ? "6px 8px" : "8px 10px") : (isMobile ? "6px 10px" : "8px 16px"),
                borderRadius: 20,
                fontSize: isMobile ? 12 : 14,
                fontWeight: 500,
                background: isActive ? "var(--primary)" : "transparent",
                color: isActive ? "#fff" : "var(--text-secondary)",
                border: "none",
                textDecoration: "none",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 4,
              })}
            >
              {item.icon === "gear" ? <GearIcon size={isMobile ? 14 : 18} /> : item.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            style={{
              padding: isMobile ? "6px 10px" : "8px 16px",
              borderRadius: 20,
              fontSize: isMobile ? 12 : 14,
              fontWeight: 500,
              background: "transparent",
              color: "var(--text-secondary)",
              border: "none",
              cursor: "pointer",
              marginLeft: isMobile ? 2 : 8,
              whiteSpace: "nowrap",
            }}
          >
            ログアウト
          </button>
        </nav>
      </header>
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
