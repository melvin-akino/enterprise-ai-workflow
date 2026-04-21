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
  const confColor  =
    confidence >= 80 ? "var(--green)" :
    confidence >= 60 ? "var(--amber)"  : "var(--red)";

  const inputStyle = {
    background: "var(--bg3)",
    border: "1px solid var(--border2)",
    color: "var(--text)",
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Knowledge Query</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>
            Ask anything about your tasks, emails, and schedule
          </p>
        </div>

        {/* Query input */}
        <div className="rounded-xl p-6" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
          <div className="flex gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuery()}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none"
              style={inputStyle}
              placeholder="Ask a question about your workflow…"
            />
            <button
              onClick={() => handleQuery()}
              disabled={loading || !query.trim()}
              className="rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {loading ? "Thinking…" : "◈ Ask"}
            </button>
          </div>

          {/* Suggested queries */}
          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => { setQuery(s); handleQuery(s); }}
                className="text-xs rounded-full px-3 py-1.5 transition-colors"
                style={{
                  background: "var(--bg3)",
                  color: "var(--text2)",
                  border: "1px solid var(--border2)",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div
            className="rounded-xl p-6 space-y-4"
            style={{ background: "var(--bg2)", border: "1px solid rgba(79,156,249,0.25)" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text)" }}>
                <span style={{ color: "var(--accent)" }}>◈</span> AI Answer
              </h2>
              <span className="text-sm font-medium font-mono" style={{ color: confColor }}>
                {confidence}% confidence
              </span>
            </div>

            <div
              className="rounded-lg p-4"
              style={{ background: "rgba(79,156,249,0.06)", border: "1px solid rgba(79,156,249,0.15)" }}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text)" }}>
                {result.answer}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text3)" }}>
                Reasoning
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text2)" }}>
                {result.reasoning}
              </p>
            </div>

            {result.sources.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--amber)" }}>
                  ⚠ Limitations
                </p>
                <ul className="space-y-1">
                  {result.sources.map((s, i) => (
                    <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--text2)" }}>
                      <span className="opacity-50 mt-0.5">·</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.follow_up_queries.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text3)" }}>
                  Suggested Follow-ups
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.follow_up_queries.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuery(q); handleQuery(q); }}
                      className="text-xs rounded-full px-3 py-1.5 transition-colors"
                      style={{
                        background: "rgba(79,156,249,0.1)",
                        color: "var(--accent)",
                        border: "1px solid rgba(79,156,249,0.2)",
                      }}
                    >
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
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Query History</h2>
            </div>
            <div>
              {history.slice(1).map(({ q, r }, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(q); setResult(r); }}
                  className="w-full text-left px-5 py-3 transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{q}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text3)" }}>
                    {r.answer.slice(0, 80)}…
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
