"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/lib/auth";
import { tasksApi, emailsApi, schedulesApi, auditApi } from "@/lib/api";
import type { Task, EmailMessage, Schedule, AuditLog } from "@/types";
import { format } from "date-fns";

const priorityBg: Record<string, string> = {
  urgent: "rgba(239,68,68,0.12)",
  high:   "rgba(249,115,22,0.12)",
  medium: "rgba(234,179,8,0.12)",
  low:    "rgba(62,207,142,0.12)",
};
const priorityFg: Record<string, string> = {
  urgent: "var(--red)",
  high:   "#f97316",
  medium: "var(--amber)",
  low:    "var(--green)",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function StatCard({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
      <div className="text-xl mb-3 opacity-70">{icon}</div>
      <div className="text-3xl font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-xs mt-1.5" style={{ color: "var(--text2)" }}>{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    tasksApi.list().then(setTasks).catch(() => {});
    emailsApi.list().then(setEmails).catch(() => {});
    schedulesApi.list().then(setSchedules).catch(() => {});
    auditApi.me(8).then(setLogs).catch(() => {});
  }, []);

  const activeTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const sentEmails  = emails.filter((e) => e.status === "sent").length;
  const upcoming    = schedules.filter((s) => new Date(s.start_time) > new Date());

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
              Good {getGreeting()}, {user?.full_name || user?.username}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>
              Your AI-powered workflow overview
            </p>
          </div>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-mono capitalize"
            style={{ background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border2)" }}
          >
            {user?.role}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="✦" value={activeTasks.length} label="Active Tasks"    color="var(--accent)" />
          <StatCard icon="✉" value={emails.length}      label="Email Drafts"    color="#a78bfa" />
          <StatCard icon="◎" value={sentEmails}         label="Emails Sent"     color="var(--green)" />
          <StatCard icon="◷" value={upcoming.length}    label="Upcoming Events" color="var(--amber)" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active Tasks */}
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Active Tasks</h2>
              <a href="/tasks" className="text-xs" style={{ color: "var(--accent)" }}>View all →</a>
            </div>
            <div>
              {activeTasks.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{t.title}</p>
                    {t.due_date && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
                        Due {format(new Date(t.due_date), "MMM d")}
                      </p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: priorityBg[t.priority], color: priorityFg[t.priority] }}>
                    {t.priority}
                  </span>
                </div>
              ))}
              {activeTasks.length === 0 && (
                <p className="px-5 py-8 text-sm text-center" style={{ color: "var(--text3)" }}>No active tasks</p>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Upcoming Events</h2>
              <a href="/schedules" className="text-xs" style={{ color: "var(--accent)" }}>View all →</a>
            </div>
            <div>
              {upcoming.slice(0, 5).map((s) => (
                <div key={s.id} className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{s.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
                    {format(new Date(s.start_time), "MMM d, h:mm a")}
                    {s.location && ` · ${s.location}`}
                  </p>
                </div>
              ))}
              {upcoming.length === 0 && (
                <p className="px-5 py-8 text-sm text-center" style={{ color: "var(--text3)" }}>No upcoming events</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Recent Activity</h2>
            <a href="/audit" className="text-xs" style={{ color: "var(--accent)" }}>View all →</a>
          </div>
          <div>
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{ background: "var(--bg3)", color: "var(--accent)", border: "1px solid var(--border2)" }}>
                    {log.action}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text3)" }}>{log.resource_type}</span>
                </div>
                <span className="text-xs font-mono" style={{ color: "var(--text3)" }}>
                  {format(new Date(log.created_at), "MMM d, h:mm a")}
                </span>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="px-5 py-8 text-sm text-center" style={{ color: "var(--text3)" }}>No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
