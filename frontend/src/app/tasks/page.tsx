"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { ReasoningPanel } from "@/components/ReasoningPanel";
import { tasksApi } from "@/lib/api";
import type { Task, TaskCreate, AIAnalysis } from "@/types";
import toast from "react-hot-toast";
import { format } from "date-fns";

const priorityColors: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high:   "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low:    "bg-green-100 text-green-700 border-green-200",
};

const statusColors: Record<string, string> = {
  pending:     "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed:   "bg-green-100 text-green-700",
  cancelled:   "bg-red-100 text-red-600",
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
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-500 text-sm mt-1">AI-analyzed task management</p>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setAnalysis(null); }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Task
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">New Task</h2>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input required value={form.title} onChange={set("title")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Prepare Q2 report" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={set("description")} rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Details about this task…" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={form.priority} onChange={set("priority")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {["low", "medium", "high", "urgent"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="datetime-local" value={form.due_date} onChange={set("due_date")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {loading ? "Analyzing…" : "🤖 Analyze with AI"}
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

        {/* Task list */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          {tasks.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <div className="text-4xl mb-3">✅</div>
              <p>No tasks yet. Create your first one above.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Title", "Priority", "Status", "Due Date", "Created"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{t.title}</div>
                      {t.description && (
                        <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{t.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${priorityColors[t.priority]}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.status]}`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {t.due_date ? format(new Date(t.due_date), "MMM d, yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
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
