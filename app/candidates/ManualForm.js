"use client";

import { useState } from "react";
import { errorText } from "@/lib/i18n";
import RatingScale from "../RatingScale";

let keySeq = 0;
const nextKey = () => `criterion-${++keySeq}`;

// Same record shape as an AI-evaluated candidate, filled by hand — including
// the score, which is never typed in directly. The recruiter rates a set of
// criteria 1–5, same mechanism as the interview checklist, and the 0–100 CV
// score is computed from that average, so it's backed by something instead
// of being one subjective number.
export default function ManualForm({
  t,
  apiFetch,
  initialName = "",
  initialCriteriaNames,
  fileName = null,
  hint,
  onCancel,
  onCreated,
  onError,
}) {
  const [name, setName] = useState(initialName);
  const [criteria, setCriteria] = useState(() =>
    (initialCriteriaNames?.length ? initialCriteriaNames : t.manualDefaultCriteria).map((name) => ({
      key: nextKey(),
      name,
      score: null,
    }))
  );
  const [summary, setSummary] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const named = criteria.filter((c) => c.name.trim());
  const scored = named.filter((c) => c.score);
  const avg = scored.length ? scored.reduce((sum, c) => sum + c.score, 0) / scored.length : null;
  const cvScore = avg != null ? Math.round(avg * 10) : null;

  const update = (key, patch) => {
    setError(null);
    setCriteria((list) => list.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  };
  const remove = (key) => setCriteria((list) => list.filter((c) => c.key !== key));
  const add = () => setCriteria((list) => [...list, { key: nextKey(), name: "", score: null }]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError(errorText(t, { error: "manual_missing_name" }));
    if (!named.length) return setError(t.errNoCriteria);
    if (scored.length !== named.length) return setError(t.errUnscoredCriteria);

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/candidates/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          criteria: named.map(({ name, score }) => ({ name, score })),
          summary,
          strengths,
          weaknesses,
          fileName,
        }),
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
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
      >
        <h3 className="text-lg font-semibold">{t.manualFormTitle}</h3>
        <p className="mt-1 text-sm text-gray-600">{hint || t.manualFormHint}</p>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-gray-600">{t.manualName}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.manualNamePlaceholder}
            autoFocus
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:text-sm"
          />
        </div>

        <div className="mt-5 border-t border-gray-100 pt-4">
          <h4 className="text-sm font-semibold text-gray-800">{t.manualCriteriaTitle}</h4>
          <p className="mt-1 text-xs text-gray-500">{t.manualCriteriaHint}</p>

          <ol className="mt-3 space-y-2">
            {criteria.map((c) => (
              <li key={c.key} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={c.name}
                    onChange={(e) => update(c.key, { name: e.target.value })}
                    placeholder={t.manualCriterionPlaceholder}
                    className="w-full overflow-hidden text-ellipsis rounded-md border border-transparent px-2 py-1.5 text-base font-medium hover:border-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => remove(c.key)}
                    title={t.manualRemoveCriterion}
                    aria-label={t.manualRemoveCriterion}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2">
                  <RatingScale value={c.score} onChange={(n) => update(c.key, { score: n })} max={10} anchors={t.cvScoreAnchors} />
                </div>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={add}
            className="mt-2 w-full rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-700"
          >
            {t.manualAddCriterion}
          </button>

          <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {t.manualCurrentScore}: <strong className="tabular-nums">{cvScore ?? "—"}</strong> / 100
            {avg != null && <span className="ml-1 text-xs text-gray-500">({t.manualScoreFormula(avg.toFixed(1))})</span>}
            <span className="ml-1 text-xs text-gray-400">
              ({scored.length}/{named.length})
            </span>
          </div>
        </div>

        <div className="mt-5 space-y-4 border-t border-gray-100 pt-4">
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
