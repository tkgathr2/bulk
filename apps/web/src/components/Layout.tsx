import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { logout } from "../api/client";

const navItems = [
  { to: "/search", label: "検索" },
  { to: "/settings", label: "設定" },
];

export default function Layout() {
  const navigate = useNavigate();

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
          padding: "12px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}
          onClick={() => navigate("/search")}
        >
          <span style={{ fontSize: 24, fontWeight: 600, color: "var(--primary)" }}>
            一括検索君
          </span>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                padding: "8px 16px",
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 500,
                background: isActive ? "var(--primary)" : "transparent",
                color: isActive ? "#fff" : "var(--text-secondary)",
                border: "none",
                textDecoration: "none",
              })}
            >
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 500,
              background: "transparent",
              color: "var(--text-secondary)",
              border: "none",
              cursor: "pointer",
              marginLeft: 8,
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
