"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { ReasoningPanel } from "@/components/ReasoningPanel";
import { schedulesApi } from "@/lib/api";
import type { Schedule, ScheduleCreate, AIAnalysis } from "@/types";
import toast from "react-hot-toast";
import { format } from "date-fns";

const statusBg: Record<string, string> = {
  draft:                "rgba(139,149,168,0.12)",
  pending_confirmation: "rgba(245,166,35,0.12)",
  scheduled:            "rgba(79,156,249,0.12)",
  cancelled:            "rgba(239,68,68,0.12)",
  completed:            "rgba(62,207,142,0.12)",
};
const statusFg: Record<string, string> = {
  draft:                "var(--text2)",
  pending_confirmation: "var(--amber)",
  scheduled:            "var(--accent)",
  cancelled:            "var(--red)",
  completed:            "var(--green)",
};

const inputStyle = {
  background: "var(--bg3)",
  border: "1px solid var(--border2)",
  color: "var(--text)",
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

  const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm outline-none";

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Schedule</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>AI conflict-checked calendar events</p>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setAnalysis(null); }}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            + New Event
          </button>
        </div>

        {showForm && (
          <div className="rounded-xl p-6 space-y-4" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>New Calendar Event</h2>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text2)" }}>Title *</label>
                <input required value={form.title} onChange={set("title")}
                  className={inputCls} style={inputStyle} placeholder="Team sync" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text2)" }}>Start *</label>
                  <input required type="datetime-local" value={form.start_time} onChange={set("start_time")}
                    className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text2)" }}>End *</label>
                  <input required type="datetime-local" value={form.end_time} onChange={set("end_time")}
                    className={inputCls} style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text2)" }}>Location</label>
                  <input value={form.location} onChange={set("location")}
                    className={inputCls} style={inputStyle} placeholder="Conference Room A" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text2)" }}>Attendees (comma-separated)</label>
                  <input value={form.attendees} onChange={set("attendees")}
                    className={inputCls} style={inputStyle} placeholder="jane@co.com, bob@co.com" />
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
          {schedules.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-3xl mb-3 opacity-30">◷</div>
              <p className="text-sm" style={{ color: "var(--text3)" }}>No events scheduled yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead style={{ borderBottom: "1px solid var(--border)" }}>
                <tr>
                  {["Event", "Start", "End", "Location", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text3)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-3">
                      <div className="font-medium" style={{ color: "var(--text)" }}>{s.title}</div>
                      {s.attendees && s.attendees.length > 0 && (
                        <div className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
                          {s.attendees.length} attendee{s.attendees.length !== 1 ? "s" : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text2)" }}>
                      {format(new Date(s.start_time), "MMM d, h:mm a")}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text2)" }}>
                      {format(new Date(s.end_time), "h:mm a")}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text2)" }}>
                      {s.location || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: statusBg[s.status], color: statusFg[s.status] }}>
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
