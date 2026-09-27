"use client";

import { useState } from "react";
import { errorText } from "@/lib/i18n";

// Same record shape as an AI-evaluated candidate, filled by hand. Used both
// as a standalone "add a candidate" path and to rescue a PDF whose AI
// evaluation failed (fileName is prefilled in that case).
export default function ManualForm({ t, apiFetch, initialName = "", fileName = null, hint, onCancel, onCreated, onError }) {
  const [name, setName] = useState(initialName);
  const [cvScore, setCvScore] = useState("");
  const [summary, setSummary] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError(errorText(t, { error: "manual_missing_name" }));
    const score = Number(cvScore);
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      return setError(errorText(t, { error: "manual_bad_score" }));
    }
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/candidates/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, cvScore: score, summary, strengths, weaknesses, fileName }),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      onCreated(data.candidate);
    } catch (err) {
      const msg = errorText(t, err?.error ? err : { error: "network" });
      setError(msg);
      onError?.(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
      >
        <h3 className="text-lg font-semibold">{t.manualFormTitle}</h3>
        <p className="mt-1 text-sm text-gray-600">{hint || t.manualFormHint}</p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">{t.manualName}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.manualNamePlaceholder}
              autoFocus
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">{t.manualScore}</label>
            <input
              type="number"
              min={0}
              max={100}
              value={cvScore}
              onChange={(e) => setCvScore(e.target.value)}
              className="w-28 rounded-md border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-400">{t.manualScoreHint}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">{t.manualSummary}</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={t.manualSummaryPlaceholder}
              rows={2}
              className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">{t.manualStrengths}</label>
            <textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder={t.manualListHint}
              rows={2}
              className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">{t.manualWeaknesses}</label>
            <textarea
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              placeholder={t.manualListHint}
              rows={2}
              className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:text-sm"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            {t.manualCancel}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {submitting ? t.manualSubmitting : t.manualSubmit}
          </button>
        </div>
      </form>
    </div>
  );
}
