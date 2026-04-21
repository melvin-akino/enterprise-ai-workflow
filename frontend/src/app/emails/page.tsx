"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { ReasoningPanel } from "@/components/ReasoningPanel";
import { emailsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { EmailMessage, EmailCreate, AIAnalysis } from "@/types";
import toast from "react-hot-toast";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft:                "bg-gray-100 text-gray-600",
  pending_confirmation: "bg-yellow-100 text-yellow-700",
  sent:                 "bg-green-100 text-green-700",
  failed:               "bg-red-100 text-red-600",
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email</h1>
            <p className="text-gray-500 text-sm mt-1">AI-reviewed email drafts</p>
          </div>
          <button onClick={() => { setShowForm((v) => !v); setAnalysis(null); }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            + Compose
          </button>
        </div>

        {showForm && (
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Compose Email</h2>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To *</label>
                  <input required type="email" value={form.to_email} onChange={set("to_email")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="recipient@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CC (comma-separated)</label>
                  <input value={form.cc_emails} onChange={set("cc_emails")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="cc@company.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input required value={form.subject} onChange={set("subject")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Meeting follow-up" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body *</label>
                <textarea required value={form.body} onChange={set("body")} rows={6}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Email body…" />
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
          {emails.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <div className="text-4xl mb-3">📧</div>
              <p>No emails yet. Compose your first one above.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Subject", "To", "Status", "Created", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {emails.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{e.subject}</td>
                    <td className="px-4 py-3 text-gray-500">{e.to_email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[e.status]}`}>
                        {e.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(e.created_at), "MMM d, h:mm a")}</td>
                    <td className="px-4 py-3">
                      {e.status === "pending_confirmation" && (
                        <button onClick={() => handleSend(e.id)}
                          className="text-xs text-blue-600 hover:underline">Send</button>
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
