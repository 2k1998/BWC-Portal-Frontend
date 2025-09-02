// src/layouts/AppShell.jsx
import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import SidebarNavigation from "../components/SidebarNavigation";
import useAuth from "../context/useAuth";

export default function AppShell() {
  const auth = useAuth();                 // don't destructure directly
  const isAuthed = !!auth?.accessToken;

  if (!isAuthed) return <Navigate to="/login" replace />;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
      <SidebarNavigation />
      <main style={{ minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}


