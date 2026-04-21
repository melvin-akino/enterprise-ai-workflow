"use client";

import type { AIAnalysis } from "@/types";

interface Props {
  analysis: AIAnalysis;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const WORKFLOW_STEPS = [
  { icon: "◎", label: "Context gathered" },
  { icon: "⊛", label: "Conflicts checked" },
  { icon: "◈", label: "Reasoning complete" },
  { icon: "◉", label: "Awaiting confirmation" },
];

export function ReasoningPanel({ analysis, onConfirm, onCancel, loading }: Props) {
  const confidence = Math.round(analysis.confidence * 100);
  const confColor =
    confidence >= 80 ? "var(--green)" :
    confidence >= 60 ? "var(--amber)"  : "var(--red)";

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: "var(--bg3)", border: "1px solid var(--border2)" }}
    >
      {/* Animated workflow steps */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {WORKFLOW_STEPS.map((step, i) => (
          <div
            key={i}
            className="workflow-step flex items-center gap-1.5 text-xs"
            style={{ animationDelay: `${i * 150}ms`, color: "var(--text2)" }}
          >
            <span style={{ color: "var(--accent)" }}>{step.icon}</span>
            {step.label}
            {i < WORKFLOW_STEPS.length - 1 && (
              <span className="opacity-30 ml-1">›</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid var(--border)" }} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text)" }}>
          <span style={{ color: "var(--accent)" }}>◈</span> AI Reasoning
        </h3>
        <span className="text-sm font-medium font-mono" style={{ color: confColor }}>
          {confidence}% confidence
        </span>
      </div>

      {/* Reasoning */}
      <div
        className="rounded-lg p-4"
        style={{ background: "rgba(79,156,249,0.06)", border: "1px solid rgba(79,156,249,0.15)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--accent)" }}>
          Analysis
        </p>
        <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text2)" }}>
          {analysis.reasoning}
        </p>
      </div>

      {/* Recommendation */}
      <div className="rounded-lg p-3" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text3)" }}>
          Recommendation
        </p>
        <p className="text-sm" style={{ color: "var(--text)" }}>{analysis.recommendation}</p>
      </div>

      {/* Risks */}
      {analysis.risks.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--amber)" }}>
            ⚠ Risks
          </p>
          <ul className="space-y-1.5">
            {analysis.risks.map((r, i) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--text2)" }}>
                <span className="mt-0.5 opacity-50">·</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conflicts */}
      {analysis.conflicts.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--red)" }}>
            ⛔ Conflicts
          </p>
          <ul className="space-y-1.5">
            {analysis.conflicts.map((c, i) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--text2)" }}>
                <span className="mt-0.5 opacity-50">·</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confirmation message */}
      {analysis.confirmation_required && (
        <div
          className="rounded-lg p-3"
          style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.25)" }}
        >
          <p className="text-sm font-medium" style={{ color: "var(--amber)" }}>
            {analysis.confirmation_message}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {loading ? "Processing…" : "✓ Approve & Execute"}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          style={{ background: "var(--bg2)", color: "var(--text2)", border: "1px solid var(--border2)" }}
        >
          Deny
        </button>
      </div>
    </div>
  );
}
