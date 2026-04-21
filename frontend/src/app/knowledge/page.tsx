"use client";

import { useState } from "react";
import { Layout } from "@/components/Layout";
import { knowledgeApi } from "@/lib/api";
import type { KnowledgeResponse } from "@/types";
import toast from "react-hot-toast";

const SUGGESTED = [
  "What are my highest priority tasks this week?",
  "Do I have any upcoming scheduling conflicts?",
  "Summarize my recent email drafts",
  "What tasks are overdue or near their due date?",
];

export default function KnowledgePage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<KnowledgeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ q: string; r: KnowledgeResponse }[]>([]);

  async function handleQuery(q = query) {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await knowledgeApi.query(q);
      setResult(res);
      setHistory((h) => [{ q, r: res }, ...h].slice(0, 10));
    } catch {
      toast.error("Query failed");
    } finally {
      setLoading(false);
    }
  }

  const confidence = result ? Math.round(result.confidence * 100) : 0;
  const confidenceColor = confidence >= 80 ? "text-green-600" : confidence >= 60 ? "text-yellow-600" : "text-red-600";

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Query</h1>
          <p className="text-gray-500 text-sm mt-1">Ask anything about your tasks, emails, and schedule</p>
        </div>

        {/* Query input */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
          <div className="flex gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuery()}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ask a question about your workflow…"
            />
            <button
              onClick={() => handleQuery()}
              disabled={loading || !query.trim()}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Thinking…" : "🧠 Ask"}
            </button>
          </div>

          {/* Suggested queries */}
          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <button key={s} onClick={() => { setQuery(s); handleQuery(s); }}
                className="text-xs rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-gray-600 hover:bg-gray-100">
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="rounded-xl bg-white border border-blue-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-blue-900 flex items-center gap-2">
                <span>🤖</span> AI Answer
              </h2>
              <span className={`text-sm font-medium ${confidenceColor}`}>
                {confidence}% confidence
              </span>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{result.answer}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Reasoning</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{result.reasoning}</p>
            </div>

            {result.sources.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">⚠ Limitations</p>
                <ul className="list-disc list-inside space-y-1">
                  {result.sources.map((s, i) => (
                    <li key={i} className="text-sm text-gray-600">{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.follow_up_queries.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Suggested Follow-ups</p>
                <div className="flex flex-wrap gap-2">
                  {result.follow_up_queries.map((q, i) => (
                    <button key={i} onClick={() => { setQuery(q); handleQuery(q); }}
                      className="text-xs rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700 hover:bg-blue-100">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Query History</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {history.slice(1).map(({ q, r }, i) => (
                <button key={i} onClick={() => { setQuery(q); setResult(r); }}
                  className="w-full text-left px-5 py-3 hover:bg-gray-50 transition-colors">
                  <p className="text-sm font-medium text-gray-800">{q}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{r.answer.slice(0, 80)}…</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
