"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { ReasoningPanel } from "@/components/ReasoningPanel";
import { schedulesApi } from "@/lib/api";
import type { Schedule, ScheduleCreate, AIAnalysis } from "@/types";
import toast from "react-hot-toast";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft:                "bg-gray-100 text-gray-600",
  pending_confirmation: "bg-yellow-100 text-yellow-700",
  scheduled:            "bg-blue-100 text-blue-700",
  cancelled:            "bg-red-100 text-red-600",
  completed:            "bg-green-100 text-green-700",
};

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [pendingPayload, setPendingPayload] = useState<ScheduleCreate | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", start_time: "", end_time: "", location: "", attendees: "",
  });

  const load = () => schedulesApi.list().then(setSchedules).catch(() => {});
  useEffect(() => { load(); }, []);

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: ScheduleCreate = {
        title: form.title,
        description: form.description,
        start_time: form.start_time,
        end_time: form.end_time,
        location: form.location,
        attendees: form.attendees ? form.attendees.split(",").map((s) => s.trim()) : undefined,
        confirmed: false,
      };
      const result = await schedulesApi.create(payload);
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
      await schedulesApi.create({ ...pendingPayload, confirmed: true });
      toast.success("Event scheduled!");
      setAnalysis(null);
      setPendingPayload(null);
      setShowForm(false);
      setForm({ title: "", description: "", start_time: "", end_time: "", location: "", attendees: "" });
      load();
    } catch {
      toast.error("Failed to schedule event");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
            <p className="text-gray-500 text-sm mt-1">AI conflict-checked calendar events</p>
          </div>
          <button onClick={() => { setShowForm((v) => !v); setAnalysis(null); }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            + New Event
          </button>
        </div>

        {showForm && (
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">New Calendar Event</h2>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input required value={form.title} onChange={set("title")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Team sync" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start *</label>
                  <input required type="datetime-local" value={form.start_time} onChange={set("start_time")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End *</label>
                  <input required type="datetime-local" value={form.end_time} onChange={set("end_time")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input value={form.location} onChange={set("location")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Conference Room A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attendees (comma-separated)</label>
                  <input value={form.attendees} onChange={set("attendees")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="jane@co.com, bob@co.com" />
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

        <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          {schedules.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <div className="text-4xl mb-3">📅</div>
              <p>No events scheduled yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Event", "Start", "End", "Location", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{s.title}</div>
                      {s.attendees && s.attendees.length > 0 && (
                        <div className="text-xs text-gray-400 mt-0.5">{s.attendees.length} attendee{s.attendees.length !== 1 ? "s" : ""}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{format(new Date(s.start_time), "MMM d, h:mm a")}</td>
                    <td className="px-4 py-3 text-gray-600">{format(new Date(s.end_time), "h:mm a")}</td>
                    <td className="px-4 py-3 text-gray-500">{s.location || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s.status]}`}>
                        {s.status}
                      </span>
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
