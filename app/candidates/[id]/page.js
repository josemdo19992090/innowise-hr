"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useT, errorText } from "@/lib/i18n";
import { useApiFetch } from "@/lib/session";
import ScoreBadge from "../../ScoreBadge";
import ConfirmDialog from "../../ConfirmDialog";
import RatingScale from "../../RatingScale";

let keySeq = 0;
const nextKey = () => `item-${++keySeq}`;

const toItems = (checklist) =>
  checklist.map((c) => ({ key: nextKey(), name: c.name, reason: c.reason, score: null, notes: "" }));

export default function CandidatePage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, lang } = useT();
  const apiFetch = useApiFetch();
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    apiFetch(`/api/candidates/${id}`).then(async (r) => {
      if (!r.ok) return setNotFound(true);
      const d = await r.json();
      setData(d);
      setItems(toItems(d.candidate.suggestedChecklist));
    });
  }, [id, apiFetch]);

  if (notFound)
    return (
      <div className="space-y-4">
        <BackLink t={t} />
        <p className="text-gray-600">{t.notFound}</p>
      </div>
    );

  if (!data)
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="h-48 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-72 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );

  const { candidate, interviews } = data;
  const update = (key, patch) => {
    setMessage(null);
    setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  };
  const remove = (key) => setItems((list) => list.filter((i) => i.key !== key));
  const add = () => setItems((list) => [...list, { key: nextKey(), name: "", reason: "", score: null, notes: "" }]);

  const named = items.filter((i) => i.name.trim());
  const scored = named.filter((i) => i.score);
  const avg = scored.length ? scored.reduce((s, i) => s + i.score, 0) / scored.length : null;
  const interviewScorePreview = avg != null ? Math.round(avg * 10) : null;

  async function save() {
    if (!named.length) return setMessage({ type: "error", text: t.errNoItems });
    if (scored.length !== named.length) return setMessage({ type: "error", text: t.errUnscored });
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candidate.id,
          items: named.map(({ name, score, notes }) => ({ name, score, notes })),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw body;
      setData((d) => ({ ...d, interviews: [body.interview, ...d.interviews] }));
      // Keep the competencies for a possible second round (panel interview,
      // follow-up) and only clear the scoring — retyping the whole checklist
      // from scratch was the main friction here, especially for manually
      // added candidates, whose list starts empty.
      setItems((list) => list.map((i) => ({ ...i, score: null, notes: "" })));
      setMessage({ type: "ok", text: `${t.interviewSaved} — ${body.interview.interviewScore} / 100` });
    } catch (err) {
      setMessage({ type: "error", text: errorText(t, err?.error ? err : { error: "network" }) });
    } finally {
      setSaving(false);
    }
  }

  const locale = lang === "ru" ? "ru-RU" : "en-GB";

  async function confirmDeleteCandidate() {
    setDeleting(true);
    try {
      await apiFetch(`/api/candidates/${id}`, { method: "DELETE" });
      router.push("/candidates");
    } finally {
      setDeleting(false);
    }
  }

  function handlePrint() {
    // A nicer default filename in the "Save as PDF" dialog than the app's
    // generic page title — restored right after so the tab title stays
    // normal once the print dialog closes.
    const previousTitle = document.title;
    document.title = candidate.extractedName;
    window.print();
    document.title = previousTitle;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <BackLink t={t} />
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            {t.printButton}
          </button>
          <button
            onClick={() => setConfirmingDelete(true)}
            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            {t.deleteOne}
          </button>
        </div>
      </div>

      {/* CV evaluation */}
      <section className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm shadow-gray-200/60 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{candidate.extractedName}</h1>
              {candidate.source === "manual" && (
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  {t.manualBadge}
                </span>
              )}
            </div>
            {candidate.fileName && (
              <p className="mt-1 truncate text-xs text-gray-500">
                {t.detailFile}: {candidate.fileName}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="mb-1 text-xs uppercase tracking-wide text-gray-500">{t.detailScore}</div>
            <ScoreBadge score={candidate.cvScore} large />
          </div>
        </div>

        {candidate.summary && <p className="mt-4 whitespace-pre-line leading-relaxed text-gray-700">{candidate.summary}</p>}

        {candidate.manualCriteria?.length > 0 && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-700">
              {t.manualCriteriaBreakdown}
              <span className="ml-1 font-normal text-gray-500">
                ({t.manualScoreFormula((candidate.manualCriteria.reduce((s, c) => s + c.score, 0) / candidate.manualCriteria.length).toFixed(1))})
              </span>
            </h3>
            <ul className="mt-2 space-y-2">
              {candidate.manualCriteria.map((c, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate text-gray-700">{c.name}</span>
                  <div className="h-1.5 w-24 shrink-0 rounded-full bg-gray-200">
                    <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${(c.score / 10) * 100}%` }} />
                  </div>
                  <span className="w-10 shrink-0 text-right font-semibold tabular-nums text-gray-900">{c.score}/10</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <EvidenceList title={t.detailStrengths} items={candidate.strengths} tone="green" />
          <EvidenceList title={t.detailWeaknesses} items={candidate.weaknesses} tone="amber" />
        </div>
        <p className="mt-4 text-xs text-gray-500">{candidate.source === "manual" ? t.manualNote : t.disclaimer}</p>
      </section>

      {/* Interview checklist — a working draft for the next round, not a
          record, so it's left out of print; the saved interviews below are
          the actual results. */}
      <section className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm shadow-gray-200/60 print:hidden sm:p-6">
        <h2 className="text-lg font-semibold">{t.checklistTitle}</h2>
        <p className="mt-1 text-sm text-gray-600">
          {candidate.source === "manual" && candidate.suggestedChecklist.length === 0 ? t.checklistHintManual : t.checklistHint}
        </p>

        <ol className="mt-5 space-y-3">
          {items.map((item, idx) => (
            <li key={item.key} className="rounded-lg border border-gray-200 p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <span className="mt-2 w-5 shrink-0 text-sm text-gray-400">{idx + 1}.</span>
                <div className="min-w-0 flex-1">
                  <input
                    value={item.name}
                    onChange={(e) => update(item.key, { name: e.target.value })}
                    placeholder={t.itemNamePlaceholder}
                    className="w-full overflow-hidden text-ellipsis rounded-md border border-transparent px-2 py-1.5 text-base font-medium hover:border-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:text-sm"
                  />
                  {item.reason && <p className="px-2 text-xs text-gray-500">{item.reason}</p>}
                </div>
                <button
                  onClick={() => remove(item.key)}
                  title={t.removeItem}
                  aria-label={t.removeItem}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3 flex flex-col gap-3 pl-7 lg:flex-row lg:items-start">
                <RatingScale value={item.score} onChange={(n) => update(item.key, { score: n })} max={10} anchors={t.cvScoreAnchors} />
                <textarea
                  value={item.notes}
                  onChange={(e) => update(item.key, { notes: e.target.value })}
                  placeholder={t.notesPlaceholder}
                  rows={1}
                  className="min-h-12 w-full flex-1 resize-y rounded-md border border-gray-200 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:text-sm"
                />
              </div>
            </li>
          ))}
        </ol>

        <button
          onClick={add}
          className="mt-3 w-full rounded-lg border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-700"
        >
          {t.addItem}
        </button>

        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-5">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-medium text-white shadow-md shadow-indigo-600/20 transition hover:shadow-lg hover:shadow-indigo-600/30 disabled:opacity-50"
          >
            {saving ? t.saving : t.saveInterview}
          </button>
          <span className="text-sm text-gray-600">
            {t.currentAverage}: <strong className="tabular-nums">{interviewScorePreview ?? "—"}</strong> / 100
            {avg != null && <span className="ml-1 text-xs text-gray-500">({t.manualScoreFormula(avg.toFixed(1))})</span>}
            <span className="ml-1 text-gray-400">
              ({scored.length}/{named.length})
            </span>
          </span>
          {message && (
            <span className={`text-sm ${message.type === "ok" ? "text-green-700" : "text-red-600"}`}>{message.text}</span>
          )}
        </div>
      </section>

      {/* Past interviews (read-only) */}
      {interviews.length > 0 && (
        <section className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm shadow-gray-200/60 sm:p-6">
          <h2 className="text-lg font-semibold">{t.pastInterviews}</h2>
          <div className="mt-4 space-y-4">
            {interviews.map((iv) => (
              <details key={iv.id} open className="group rounded-lg border border-gray-200">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm text-gray-600">{new Date(iv.createdAt).toLocaleString(locale)}</span>
                  <span className="flex items-center gap-1.5 text-sm">
                    {t.interviewScore}: <ScoreBadge score={iv.interviewScore} />
                  </span>
                </summary>
                <ul className="divide-y divide-gray-100 border-t border-gray-100 text-sm">
                  {iv.items.map((it, i) => (
                    <li key={i} className="flex gap-3 px-4 py-2">
                      <span className="w-10 shrink-0 font-semibold tabular-nums text-indigo-700">{it.score}/10</span>
                      <span className="min-w-0">
                        <span className="font-medium">{it.name}</span>
                        {it.notes && <span className="block text-gray-500">{it.notes}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </section>
      )}

      {confirmingDelete && (
        <ConfirmDialog
          message={t.deleteConfirmOne(candidate.extractedName)}
          confirmLabel={t.deleteConfirmButton}
          cancelLabel={t.deleteCancelButton}
          busyLabel={t.deleting}
          busy={deleting}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={confirmDeleteCandidate}
        />
      )}
    </div>
  );
}

function BackLink({ t }) {
  return (
    <Link href="/candidates" className="text-sm text-indigo-600 hover:underline">
      {t.back}
    </Link>
  );
}

function EvidenceList({ title, items, tone }) {
  const styles = tone === "green" ? "bg-green-50 text-green-900" : "bg-amber-50 text-amber-900";
  const dot = tone === "green" ? "bg-green-500" : "bg-amber-500";
  return (
    <div className={`rounded-lg p-4 ${styles}`}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((s, i) => (
          <li key={i} className="flex gap-2">
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            <span>{s}</span>
          </li>
        ))}
        {items.length === 0 && <li className="opacity-60">—</li>}
      </ul>
    </div>
  );
}
