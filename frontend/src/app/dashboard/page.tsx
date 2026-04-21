"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/lib/auth";
import { tasksApi, emailsApi, schedulesApi, auditApi } from "@/lib/api";
import type { Task, EmailMessage, Schedule, AuditLog } from "@/types";
import { format } from "date-fns";

const priorityColors: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high:   "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low:    "bg-green-100 text-green-700",
};

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
    auditApi.me(5).then(setLogs).catch(() => {});
  }, []);

  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const sentEmails = emails.filter((e) => e.status === "sent").length;
  const upcomingEvents = schedules.filter((s) => new Date(s.start_time) > new Date());

  return (
    <Layout>
      <div className="space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {getGreeting()}, {user?.full_name || user?.username} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's your AI-powered workflow overview.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Tasks",     value: pendingTasks.length,     icon: "✅", color: "blue" },
            { label: "Emails",           value: emails.length,           icon: "📧", color: "purple" },
            { label: "Emails Sent",      value: sentEmails,              icon: "📤", color: "green" },
            { label: "Upcoming Events",  value: upcomingEvents.length,   icon: "📅", color: "orange" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
              <div className="text-2xl mb-2">{icon}</div>
              <div className={`text-3xl font-bold text-${color}-600`}>{value}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Tasks */}
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Active Tasks</h2>
              <a href="/tasks" className="text-xs text-blue-600 hover:underline">View all →</a>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingTasks.slice(0, 5).map((t) => (
                <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.title}</p>
                    {t.due_date && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Due {format(new Date(t.due_date), "MMM d")}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[t.priority]}`}>
                    {t.priority}
                  </span>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">No active tasks 🎉</p>
              )}
            </div>
          </div>

          {/* Upcoming Schedule */}
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Upcoming Events</h2>
              <a href="/schedules" className="text-xs text-blue-600 hover:underline">View all →</a>
            </div>
            <div className="divide-y divide-gray-50">
              {upcomingEvents.slice(0, 5).map((s) => (
                <div key={s.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-800">{s.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(s.start_time), "MMM d, h:mm a")}
                    {s.location && ` · ${s.location}`}
                  </p>
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">No upcoming events</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Audit Activity */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
            <a href="/audit" className="text-xs text-blue-600 hover:underline">View all →</a>
          </div>
          <div className="divide-y divide-gray-50">
            {logs.map((log) => (
              <div key={log.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {log.action}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">{log.resource_type}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {format(new Date(log.created_at), "MMM d, h:mm a")}
                </span>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
