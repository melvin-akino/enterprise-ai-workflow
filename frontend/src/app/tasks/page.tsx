"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { ReasoningPanel } from "@/components/ReasoningPanel";
import { tasksApi } from "@/lib/api";
import type { Task, TaskCreate, AIAnalysis } from "@/types";
import toast from "react-hot-toast";
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
const statusBg: Record<string, string> = {
  pending:     "rgba(139,149,168,0.12)",
  in_progress: "rgba(79,156,249,0.12)",
  completed:   "rgba(62,207,142,0.12)",
  cancelled:   "rgba(239,68,68,0.12)",
};
const statusFg: Record<string, string> = {
  pending:     "var(--text2)",
  in_progress: "var(--accent)",
  completed:   "var(--green)",
  cancelled:   "var(--red)",
};

const inputStyle = {
  background: "var(--bg3)",
  border: "1px solid var(--border2)",
  color: "var(--text)",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [pendingPayload, setPendingPayload] = useState<TaskCreate | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<TaskCreate, "confirmed">>({
    title: "", description: "", priority: "medium", due_date: "",
  });

  const load = () => tasksApi.list().then(setTasks).catch(() => {});
  useEffect(() => { load(); }, []);

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: TaskCreate = { ...form, confirmed: false };
      const result = await tasksApi.create(payload);
      setAnalysis(result);
      setPendingPayload(payload);
    } catch {
      toast.error("Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!pendingPayload) return;
    setLoading(true);
    try {
      await tasksApi.create({ ...pendingPayload, confirmed: true });
      toast.success("Task created!");
      setAnalysis(null);
      setPendingPayload(null);
      setShowForm(false);
      setForm({ title: "", description: "", priority: "medium", due_date: "" });
      load();
    } catch {
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Tasks</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>AI-analyzed task management</p>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setAnalysis(null); }}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            + New Task
          </button>
        </div>

        {showForm && (
          <div className="rounded-xl p-6 space-y-4" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>New Task</h2>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text2)" }}>Title *</label>
                <input required value={form.title} onChange={set("title")}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={inputStyle} placeholder="e.g. Prepare Q2 report" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text2)" }}>Description</label>
                <textarea value={form.description} onChange={set("description")} rows={3}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                  style={inputStyle} placeholder="Details about this task…" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text2)" }}>Priority</label>
                  <select value={form.priority} onChange={set("priority")}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                    style={inputStyle}>
                    {["low", "medium", "high", "urgent"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text2)" }}>Due Date</label>
                  <input type="datetime-local" value={form.due_date} onChange={set("due_date")}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                    style={inputStyle} />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-50"
                style={{ background: "var(--accent)", color: "#fff" }}>
                {loading ? "Analyzing…" : "◈ Analyze with AI"}
              </button>
            </form>

            {analysis && (
              <ReasoningPanel
                analysis={analysis}
                onConfirm={handleConfirm}
                onCancel={() => setAnalysis(null)}
                loading={loading}
              />
            )}
          </div>
        )}

        <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
          {tasks.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-3xl mb-3 opacity-30">✦</div>
              <p className="text-sm" style={{ color: "var(--text3)" }}>No tasks yet. Create your first one above.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead style={{ borderBottom: "1px solid var(--border)" }}>
                <tr>
                  {["Title", "Priority", "Status", "Due Date", "Created"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text3)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className="transition-colors"
                    style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-3">
                      <div className="font-medium" style={{ color: "var(--text)" }}>{t.title}</div>
                      {t.description && (
                        <div className="text-xs mt-0.5 truncate max-w-xs" style={{ color: "var(--text3)" }}>
                          {t.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: priorityBg[t.priority], color: priorityFg[t.priority] }}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: statusBg[t.status], color: statusFg[t.status] }}>
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text2)" }}>
                      {t.due_date ? format(new Date(t.due_date), "MMM d, yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text3)" }}>
                      {format(new Date(t.created_at), "MMM d")}
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
