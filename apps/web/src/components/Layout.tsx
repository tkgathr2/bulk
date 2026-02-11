import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { logout } from "../api/client";
import { useIsMobile } from "../hooks/useIsMobile";

const navItems = [
  { to: "/search", label: "検索" },
  { to: "/settings", label: "設定" },
  { to: "/guide", label: "使い方" },
];

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
            一括検索君 Ver1.0
          </span>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: isMobile ? 2 : 8, flexWrap: "nowrap", overflow: "auto" }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                padding: isMobile ? "6px 10px" : "8px 16px",
                borderRadius: 20,
                fontSize: isMobile ? 12 : 14,
                fontWeight: 500,
                background: isActive ? "var(--primary)" : "transparent",
                color: isActive ? "#fff" : "var(--text-secondary)",
                border: "none",
                textDecoration: "none",
                whiteSpace: "nowrap",
              })}
            >
              {item.label}
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
