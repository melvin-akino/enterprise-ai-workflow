"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { auditApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { AuditLog } from "@/types";
import { format } from "date-fns";

const actionColor: Record<string, { bg: string; fg: string }> = {
  login:           { bg: "rgba(79,156,249,0.12)",   fg: "var(--accent)" },
  register:        { bg: "rgba(167,139,250,0.12)",  fg: "#a78bfa" },
  create_task:     { bg: "rgba(62,207,142,0.12)",   fg: "var(--green)" },
  update_task:     { bg: "rgba(245,166,35,0.12)",   fg: "var(--amber)" },
  delete_task:     { bg: "rgba(239,68,68,0.12)",    fg: "var(--red)" },
  create_email:    { bg: "rgba(62,207,142,0.12)",   fg: "var(--green)" },
  update_email:    { bg: "rgba(245,166,35,0.12)",   fg: "var(--amber)" },
  send_email:      { bg: "rgba(79,156,249,0.12)",   fg: "var(--accent)" },
  create_schedule: { bg: "rgba(62,207,142,0.12)",   fg: "var(--green)" },
  update_schedule: { bg: "rgba(245,166,35,0.12)",   fg: "var(--amber)" },
  delete_schedule: { bg: "rgba(239,68,68,0.12)",    fg: "var(--red)" },
  knowledge_query: { bg: "rgba(99,102,241,0.12)",   fg: "#818cf8" },
};

export default function AuditPage() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState({ resource_type: "", action: "" });
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = {
        ...(filter.resource_type ? { resource_type: filter.resource_type } : {}),
        ...(filter.action ? { action: filter.action } : {}),
        limit: 100,
      };
      const data = await auditApi.list(params);
      setLogs(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  const setF = (k: string) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setFilter((f) => ({ ...f, [k]: e.target.value }));

  const selectStyle = {
    background: "var(--bg2)",
    border: "1px solid var(--border2)",
    color: "var(--text)",
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Audit Log</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>
            Complete action history with user IDs and timestamps
            {user?.role === "user" && " (showing your activity only)"}
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <select value={filter.resource_type} onChange={setF("resource_type")}
            className="rounded-lg px-3 py-2 text-sm outline-none" style={selectStyle}>
            <option value="">All Resources</option>
            {["user", "task", "email", "schedule", "knowledge"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select value={filter.action} onChange={setF("action")}
            className="rounded-lg px-3 py-2 text-sm outline-none" style={selectStyle}>
            <option value="">All Actions</option>
            {["login", "register", "create_task", "update_task", "delete_task",
              "create_email", "update_email", "send_email",
              "create_schedule", "update_schedule", "delete_schedule", "knowledge_query"].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button
            onClick={load}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ background: "var(--bg2)", color: "var(--text2)", border: "1px solid var(--border2)" }}
          >
            Refresh
          </button>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
          {loading ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--text3)" }}>Loading…</div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-3xl mb-3 opacity-30">☰</div>
              <p className="text-sm" style={{ color: "var(--text3)" }}>No audit logs found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead style={{ borderBottom: "1px solid var(--border)" }}>
                <tr>
                  {["Action", "Resource", "Details", "User ID", "IP", "Time"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text3)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const colors = actionColor[log.action] || { bg: "rgba(139,149,168,0.12)", fg: "var(--text2)" };
                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium font-mono"
                          style={{ background: colors.bg, color: colors.fg }}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text2)" }}>
                        {log.resource_type}
                      </td>
                      <td className="px-4 py-3 text-xs max-w-xs" style={{ color: "var(--text3)" }}>
                        {log.details ? (
                          <span className="font-mono truncate block">
                            {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(", ")}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text3)" }}>
                        {log.user_id ? log.user_id.slice(0, 8) + "…" : "system"}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text3)" }}>
                        {log.ip_address || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono whitespace-nowrap" style={{ color: "var(--text3)" }}>
                        {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
