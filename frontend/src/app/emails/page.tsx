"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { ReasoningPanel } from "@/components/ReasoningPanel";
import { emailsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { EmailMessage, EmailCreate, AIAnalysis } from "@/types";
import toast from "react-hot-toast";
import { format } from "date-fns";

const statusBg: Record<string, string> = {
  draft:                "rgba(139,149,168,0.12)",
  pending_confirmation: "rgba(245,166,35,0.12)",
  sent:                 "rgba(62,207,142,0.12)",
  failed:               "rgba(239,68,68,0.12)",
};
const statusFg: Record<string, string> = {
  draft:                "var(--text2)",
  pending_confirmation: "var(--amber)",
  sent:                 "var(--green)",
  failed:               "var(--red)",
};

const inputStyle = {
  background: "var(--bg3)",
  border: "1px solid var(--border2)",
  color: "var(--text)",
};

export default function EmailsPage() {
  const { user } = useAuthStore();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [pendingPayload, setPendingPayload] = useState<EmailCreate | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: "", body: "", to_email: "", cc_emails: "" });

  const load = () => emailsApi.list().then(setEmails).catch(() => {});
  useEffect(() => { load(); }, []);

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: EmailCreate = {
        subject: form.subject,
        body: form.body,
        from_email: user!.email,
        to_email: form.to_email,
        cc_emails: form.cc_emails ? form.cc_emails.split(",").map((s) => s.trim()) : undefined,
        confirmed: false,
      };
      const result = await emailsApi.create(payload);
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
      await emailsApi.create({ ...pendingPayload, confirmed: true });
      toast.success("Email draft saved!");
      setAnalysis(null);
      setPendingPayload(null);
      setShowForm(false);
      setForm({ subject: "", body: "", to_email: "", cc_emails: "" });
      load();
    } catch {
      toast.error("Failed to save email");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(id: string) {
    try {
      await emailsApi.send(id);
      toast.success("Email marked as sent!");
      load();
    } catch {
      toast.error("Failed to send email");
    }
  }

  const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm outline-none";

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Email</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>AI-reviewed email drafts</p>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setAnalysis(null); }}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            + Compose
          </button>
        </div>

        {showForm && (
          <div className="rounded-xl p-6 space-y-4" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Compose Email</h2>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text2)" }}>To *</label>
                  <input required type="email" value={form.to_email} onChange={set("to_email")}
                    className={inputCls} style={inputStyle} placeholder="recipient@company.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text2)" }}>CC (comma-separated)</label>
                  <input value={form.cc_emails} onChange={set("cc_emails")}
                    className={inputCls} style={inputStyle} placeholder="cc@company.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text2)" }}>Subject *</label>
                <input required value={form.subject} onChange={set("subject")}
                  className={inputCls} style={inputStyle} placeholder="Meeting follow-up" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text2)" }}>Body *</label>
                <textarea required value={form.body} onChange={set("body")} rows={6}
                  className={`${inputCls} resize-none`} style={inputStyle} placeholder="Email body…" />
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
          {emails.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-3xl mb-3 opacity-30">✉</div>
              <p className="text-sm" style={{ color: "var(--text3)" }}>No emails yet. Compose your first one above.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead style={{ borderBottom: "1px solid var(--border)" }}>
                <tr>
                  {["Subject", "To", "Status", "Created", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text3)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {emails.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--text)" }}>{e.subject}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text2)" }}>{e.to_email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: statusBg[e.status], color: statusFg[e.status] }}>
                        {e.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text3)" }}>
                      {format(new Date(e.created_at), "MMM d, h:mm a")}
                    </td>
                    <td className="px-4 py-3">
                      {e.status === "pending_confirmation" && (
                        <button onClick={() => handleSend(e.id)}
                          className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                          Send →
                        </button>
                      )}
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
