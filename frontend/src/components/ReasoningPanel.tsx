"use client";

import type { AIAnalysis } from "@/types";

interface Props {
  analysis: AIAnalysis;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ReasoningPanel({ analysis, onConfirm, onCancel, loading }: Props) {
  const confidence = Math.round(analysis.confidence * 100);
  const confidenceColor =
    confidence >= 80 ? "text-green-600" :
    confidence >= 60 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-blue-900 flex items-center gap-2">
          <span className="text-lg">🤖</span> AI Reasoning
        </h3>
        <span className={`text-sm font-medium ${confidenceColor}`}>
          {confidence}% confidence
        </span>
      </div>

      {/* Reasoning */}
      <div>
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Analysis</p>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{analysis.reasoning}</p>
      </div>

      {/* Recommendation */}
      <div className="rounded-lg bg-white border border-blue-100 p-3">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Recommendation</p>
        <p className="text-sm text-gray-800">{analysis.recommendation}</p>
      </div>

      {/* Risks */}
      {analysis.risks.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">⚠ Risks</p>
          <ul className="list-disc list-inside space-y-1">
            {analysis.risks.map((r, i) => (
              <li key={i} className="text-sm text-orange-700">{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Conflicts */}
      {analysis.conflicts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">⛔ Conflicts</p>
          <ul className="list-disc list-inside space-y-1">
            {analysis.conflicts.map((c, i) => (
              <li key={i} className="text-sm text-red-700">{c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Confirmation */}
      {analysis.confirmation_required && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
          <p className="text-sm font-medium text-yellow-800">{analysis.confirmation_message}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Processing…" : "✓ Confirm & Execute"}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700
                     hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
