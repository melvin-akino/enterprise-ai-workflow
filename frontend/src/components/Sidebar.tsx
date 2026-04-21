"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth";

const nav = [
  { href: "/dashboard", label: "Overview",   icon: "⊞" },
  { href: "/tasks",     label: "Tasks",       icon: "✦" },
  { href: "/emails",    label: "Email",       icon: "✉" },
  { href: "/schedules", label: "Scheduling",  icon: "◷" },
  { href: "/knowledge", label: "Knowledge",   icon: "◈" },
  { href: "/audit",     label: "Audit Log",   icon: "☰" },
];

const connections = [
  { label: "Gmail",    connected: true  },
  { label: "Calendar", connected: true  },
  { label: "Slack",    connected: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  return (
    <aside
      className="flex h-screen w-64 flex-col fixed left-0 top-0 z-30"
      style={{
        background: "var(--sidebar)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            ⚡
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              AI Workflow
            </p>
            <p className="text-xs" style={{ color: "var(--text3)" }}>
              Enterprise Agent
            </p>
          </div>
        </div>

        {/* Agent status pill */}
        <div
          className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ background: "rgba(62,207,142,0.1)", color: "var(--green)" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: "var(--green)", animation: "pulseDot 1.4s ease-in-out infinite" }}
          />
          Agent Active
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              style={{
                background: active ? "var(--bg3)" : "transparent",
                color: active ? "var(--text)" : "var(--text2)",
                borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              <span className="w-5 text-center text-base opacity-80">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Connection status */}
      <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text3)" }}>
          Connections
        </p>
        <div className="space-y-1.5">
          {connections.map(({ label, connected }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--text2)" }}>{label}</span>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={
                  connected
                    ? { background: "rgba(62,207,142,0.1)", color: "var(--green)" }
                    : { background: "rgba(239,68,68,0.1)", color: "var(--red)" }
                }
              >
                {connected ? "● on" : "○ off"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* User info + logout */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {(user?.full_name || user?.username || "?")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
              {user?.full_name || user?.username}
            </p>
            <p className="text-xs capitalize" style={{ color: "var(--text3)" }}>
              {user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={clearAuth}
          className="w-full rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border2)" }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
