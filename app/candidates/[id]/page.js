"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useT, errorText } from "@/lib/i18n";
import { useApiFetch } from "@/lib/session";
import ScoreBadge from "../../ScoreBadge";
import ConfirmDialog from "../../ConfirmDialog";

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
  const average = scored.length ? scored.reduce((s, i) => s + i.score, 0) / scored.length : null;

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
      setItems(toItems(candidate.suggestedChecklist));
      setMessage({ type: "ok", text: `${t.interviewSaved} — ${body.interview.interviewScore.toFixed(1)} / 5` });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <BackLink t={t} />
        <button
          onClick={() => setConfirmingDelete(true)}
          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
        >
          {t.deleteOne}
        </button>
      </div>

      {/* CV evaluation */}
      <section className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm shadow-gray-200/60 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold">{candidate.extractedName}</h1>
            <p className="mt-1 truncate text-xs text-gray-500">
              {t.detailFile}: {candidate.fileName}
            </p>
          </div>
          <div className="text-right">
            <div className="mb-1 text-xs uppercase tracking-wide text-gray-500">{t.detailScore}</div>
            <ScoreBadge score={candidate.cvScore} large />
          </div>
        </div>

        <p className="mt-4 whitespace-pre-line leading-relaxed text-gray-700">{candidate.summary}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <EvidenceList title={t.detailStrengths} items={candidate.strengths} tone="green" />
          <EvidenceList title={t.detailWeaknesses} items={candidate.weaknesses} tone="amber" />
        </div>
        <p className="mt-4 text-xs text-gray-500">{t.disclaimer}</p>
      </section>

      {/* Interview checklist */}
      <section className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm shadow-gray-200/60 sm:p-6">
        <h2 className="text-lg font-semibold">{t.checklistTitle}</h2>
        <p className="mt-1 text-sm text-gray-600">{t.checklistHint}</p>

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
                <div className="flex shrink-0 gap-1" role="radiogroup">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      role="radio"
                      aria-checked={item.score === n}
                      title={t.scoreLabels[n - 1]}
                      onClick={() => update(item.key, { score: n })}
                      className={`flex h-12 w-12 flex-col items-center justify-center rounded-md border text-sm font-semibold transition sm:w-16 ${
                        item.score === n
                          ? "border-transparent bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20"
                          : "border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                    >
                      {n}
                      <span className={`hidden text-[10px] font-normal sm:block ${item.score === n ? "text-indigo-100" : "text-gray-400"}`}>
                        {t.scoreLabels[n - 1]}
                      </span>
                    </button>
                  ))}
                </div>
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
            {t.currentAverage}:{" "}
            <strong className="tabular-nums">{average != null ? average.toFixed(1) : "—"}</strong> / 5
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
              <details key={iv.id} className="group rounded-lg border border-gray-200">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm text-gray-600">{new Date(iv.createdAt).toLocaleString(locale)}</span>
                  <span className="text-sm">
                    {t.interviewScore}: <strong className="tabular-nums">{iv.interviewScore.toFixed(1)}</strong> / 5
                  </span>
                </summary>
                <ul className="divide-y divide-gray-100 border-t border-gray-100 text-sm">
                  {iv.items.map((it, i) => (
                    <li key={i} className="flex gap-3 px-4 py-2">
                      <span className="w-6 shrink-0 font-semibold tabular-nums text-indigo-700">{it.score}</span>
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
          message={t.deleteConfirmOne}
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
