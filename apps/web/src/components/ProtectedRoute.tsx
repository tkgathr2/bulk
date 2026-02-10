import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getAuthMe } from "../api/client";

export default function ProtectedRoute() {
  const [status, setStatus] = useState<"checking" | "authenticated" | "unauthenticated">("checking");

  useEffect(() => {
    getAuthMe()
      .then((data) => {
        setStatus(data.authenticated ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        setStatus("unauthenticated");
      });
  }, []);

  if (status === "checking") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <p style={{ color: "var(--text-secondary)" }}>認証確認中...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
