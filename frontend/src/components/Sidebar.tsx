"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth";

const nav = [
  { href: "/dashboard",  label: "Dashboard",  icon: "🏠" },
  { href: "/tasks",      label: "Tasks",       icon: "✅" },
  { href: "/emails",     label: "Email",       icon: "📧" },
  { href: "/schedules",  label: "Schedule",    icon: "📅" },
  { href: "/knowledge",  label: "Knowledge",   icon: "🧠" },
  { href: "/audit",      label: "Audit Log",   icon: "📋" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  return (
    <aside className="flex h-screen w-60 flex-col bg-brand-900 text-white fixed left-0 top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <h1 className="text-lg font-bold">⚡ AI Workflow</h1>
        <p className="text-xs text-blue-200 mt-0.5">Enterprise Agent</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${active ? "bg-white/15 text-white" : "text-blue-100 hover:bg-white/10 hover:text-white"}`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="mb-3">
          <p className="text-sm font-medium text-white truncate">{user?.full_name || user?.username}</p>
          <p className="text-xs text-blue-300 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={clearAuth}
          className="w-full rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-blue-100
                     hover:bg-white/20 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
