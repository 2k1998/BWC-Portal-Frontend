// src/components/SidebarNavigation.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import useAuth from "../context/useAuth";

const NavItem = ({ to, label, icon }) => {
  const location = useLocation();
  const active = location.pathname === to || location.pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      className={`sidebar-item ${active ? "active" : ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 8,
        textDecoration: "none",
        color: active ? "#000" : "#333",
        background: active ? "rgba(184,134,11,0.12)" : "transparent",
        fontWeight: active ? 700 : 500,
      }}
    >
      {icon ?? "•"} {label}
    </Link>
  );
};

export default function SidebarNavigation() {
  const { currentUser } = useAuth();

  return (
    <aside
      style={{
        width: 240,
        padding: 16,
        borderRight: "1px solid #eee",
        minHeight: "100vh",
        background: "#fff",
      }}
    >
      {/* Brand */}
      <div style={{ marginBottom: 16, fontWeight: 800, fontSize: 18 }}>BWC Portal</div>

      {/* User block (safe even if currentUser is null) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 12,
          border: "1px solid #eee",
          borderRadius: 10,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#D4AF37", // gold-ish
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            color: "#333",
          }}
        >
          {(currentUser?.first_name?.[0] || "U").toUpperCase()}
        </div>
        <div className="user-info">
          <div className="user-name">
            {(currentUser?.first_name || "") + " " + (currentUser?.surname || "") || currentUser?.email || "User"}
          </div>
          <div className="user-role">{currentUser?.role || "Member"}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ display: "grid", gap: 6 }}>
        <NavItem to="/dashboard" label="Πίνακας Ελέγχου" />
        <NavItem to="/tasks" label="Εργασίες" />
        <NavItem to="/projects" label="Projects" />
        <NavItem to="/companies" label="Εταιρείες" />
        <NavItem to="/contacts" label="Επαφές" />
        <NavItem to="/groups" label="Ομάδες" />
        <NavItem to="/events" label="Εκδηλώσεις" />
        <NavItem to="/documents" label="Έγγραφα" />
        <NavItem to="/profile" label="Προφίλ" />
        <NavItem to="/logout" label="Αποσύνδεση" />
      </nav>
    </aside>
  );
}

