"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { auditApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { AuditLog } from "@/types";
import { format } from "date-fns";

const actionColors: Record<string, string> = {
  login:           "bg-blue-100 text-blue-700",
  register:        "bg-purple-100 text-purple-700",
  create_task:     "bg-green-100 text-green-700",
  update_task:     "bg-yellow-100 text-yellow-700",
  delete_task:     "bg-red-100 text-red-700",
  create_email:    "bg-green-100 text-green-700",
  update_email:    "bg-yellow-100 text-yellow-700",
  send_email:      "bg-blue-100 text-blue-700",
  create_schedule: "bg-green-100 text-green-700",
  update_schedule: "bg-yellow-100 text-yellow-700",
  delete_schedule: "bg-red-100 text-red-700",
  knowledge_query: "bg-indigo-100 text-indigo-700",
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

  const set = (k: string) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setFilter((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-500 text-sm mt-1">
            Complete action history with user IDs and timestamps
            {user?.role === "user" && " (showing your activity only)"}
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <select value={filter.resource_type} onChange={set("resource_type")}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All Resources</option>
            {["user", "task", "email", "schedule", "knowledge"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select value={filter.action} onChange={set("action")}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All Actions</option>
            {["login", "register", "create_task", "update_task", "delete_task",
              "create_email", "update_email", "send_email",
              "create_schedule", "update_schedule", "delete_schedule", "knowledge_query"].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button onClick={load}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Refresh
          </button>
        </div>

        <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400">Loading…</div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <p>No audit logs found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Action", "Resource", "Details", "User ID", "IP", "Time"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionColors[log.action] || "bg-gray-100 text-gray-600"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{log.resource_type}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs">
                      {log.details ? (
                        <span className="font-mono truncate block">
                          {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(", ")}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                      {log.user_id ? log.user_id.slice(0, 8) + "…" : "system"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{log.ip_address || "—"}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
