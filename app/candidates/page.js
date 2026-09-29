"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT, errorText } from "@/lib/i18n";
import { useApiFetch } from "@/lib/session";
import ScoreBadge from "../ScoreBadge";
import ConfirmDialog from "../ConfirmDialog";
import VacancyBanner from "../VacancyBanner";
import ManualForm from "./ManualForm";

// Free-tier Gemini quotas are per-minute, so don't fire every file at once.
const CONCURRENCY = 2;

// Date.now() alone can collide if two drops land in the same millisecond
// (e.g. dragging two batches in fast succession), which would make two
// upload rows share a key and update together. A module-level counter
// can't collide.
let uploadKeySeq = 0;
const nextUploadKey = () => `upload-${++uploadKeySeq}`;

export default function CandidatesPage() {
  const { t } = useT();
  const router = useRouter();
  const apiFetch = useApiFetch();
  const [candidates, setCandidates] = useState(null);
  const [hasVacancy, setHasVacancy] = useState(true);
  const [vacancy, setVacancy] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [confirmTarget, setConfirmTarget] = useState(null); // { ids, message }
  const [deleting, setDeleting] = useState(false);
  const [manualForm, setManualForm] = useState(null); // { initialName, fileName, hint, rescueKey }
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    const data = await apiFetch("/api/candidates").then((r) => r.json());
    setCandidates(data.candidates);
    setHasVacancy(data.hasVacancy);
    setVacancy(data.vacancy);
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const setUpload = (key, patch) =>
    setUploads((list) => list.map((u) => (u.key === key ? { ...u, ...patch } : u)));

  async function handleFiles(fileList) {
    const files = [...fileList].filter((f) => f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf");
    if (!files.length) return;
    const batch = files.map((file) => ({ key: nextUploadKey(), file, name: file.name, status: "queued" }));
    setUploads((list) => [...batch, ...list]);

    const queue = [...batch];
    const worker = async () => {
      while (queue.length) {
        const job = queue.shift();
        setUpload(job.key, { status: "processing" });
        try {
          const form = new FormData();
          form.append("file", job.file);
          const res = await apiFetch("/api/candidates", { method: "POST", body: form });
          const data = await res.json().catch(() => ({ error: "generic" }));
          if (!res.ok) throw data;
          setUpload(job.key, { status: "done", candidateName: data.candidate.extractedName });
          load();
        } catch (err) {
          setUpload(job.key, { status: "error", error: err?.error ? err : { error: "network" } });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batch.length) }, worker));
  }

  const busy = uploads.some((u) => u.status === "queued" || u.status === "processing");

  function toggleOne(id, e) {
    e.stopPropagation();
    setSelected((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((set) => (set.size === candidates.length ? new Set() : new Set(candidates.map((c) => c.id))));
  }

  function askDeleteOne(candidate, e) {
    e.stopPropagation();
    setConfirmTarget({ ids: [candidate.id], message: t.deleteConfirmOne(candidate.extractedName) });
  }

  function askDeleteSelected() {
    setConfirmTarget({ ids: [...selected], message: t.deleteConfirmSelected(selected.size) });
  }

  function askDeleteAll() {
    setConfirmTarget({
      ids: candidates.map((c) => c.id),
      all: true,
      message: t.deleteConfirmAll(candidates.length),
    });
  }

  // Reuse the most recently added manual candidate's criteria for this
  // vacancy instead of always resetting to the generic defaults, so manual
  // candidates stay comparable to each other on the same rubric.
  function latestManualCriteriaNames() {
    const withCriteria = (candidates || []).filter((c) => c.source === "manual" && c.criteriaNames?.length);
    if (!withCriteria.length) return null;
    return withCriteria.reduce((latest, c) => (c.createdAt > latest.createdAt ? c : latest)).criteriaNames;
  }

  function openManualForm(opts = {}) {
    setManualForm({
      initialName: "",
      fileName: null,
      hint: undefined,
      rescueKey: null,
      initialCriteriaNames: latestManualCriteriaNames() || t.manualDefaultCriteria,
      ...opts,
    });
  }

  function onManualCreated(candidate) {
    setCandidates((list) => [...list, candidate].sort((a, b) => b.cvScore - a.cvScore));
    if (manualForm?.rescueKey) {
      setUpload(manualForm.rescueKey, { status: "done", candidateName: candidate.extractedName });
    }
    setManualForm(null);
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await apiFetch("/api/candidates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(confirmTarget.all ? { all: true } : { ids: confirmTarget.ids }),
      });
      const removed = new Set(confirmTarget.ids);
      setCandidates((list) => list.filter((c) => !removed.has(c.id)));
      setSelected((set) => {
        const next = new Set(set);
        removed.forEach((id) => next.delete(id));
        return next;
      });
      setConfirmTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t.candTitle}</h1>

      <VacancyBanner t={t} vacancy={vacancy} />

      <section className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm shadow-gray-200/60 sm:p-6">
        <h2 className="font-semibold">{t.candUploadTitle}</h2>
        <p className="mt-1 text-sm text-gray-600">{t.candUploadHint}</p>

        {!hasVacancy ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
            {t.candNoVacancy}
            <Link href="/vacancy" className="font-medium underline">
              {t.candGoVacancy}
            </Link>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition sm:flex-row ${
              dragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-600/20 transition hover:shadow-lg hover:shadow-indigo-600/30"
            >
              {t.candChoose}
            </button>
            <span className="text-sm text-gray-500">{t.candDrop}</span>
          </div>
        )}

        {hasVacancy && (
          <div className="mt-3 text-center sm:text-left">
            <button onClick={() => openManualForm()} className="text-sm font-medium text-indigo-600 hover:underline">
              {t.candOr} {t.candAddManual.toLowerCase()}
            </button>
          </div>
        )}

        {uploads.length > 0 && (
          <ul className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-100 text-sm">
            {uploads.map((u) => (
              <li key={u.key} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                <StatusIcon status={u.status} />
                <span className="min-w-0 flex-1 truncate font-medium text-gray-800">{u.name}</span>
                <span
                  className={`text-xs ${
                    u.status === "error" ? "w-full text-red-600 sm:w-auto" : u.status === "done" ? "text-green-700" : "text-gray-500"
                  }`}
                >
                  {u.status === "queued" && t.candQueued}
                  {u.status === "processing" && t.candProcessing}
                  {u.status === "done" && `${t.candDone} — ${u.candidateName}`}
                  {u.status === "error" && errorText(t, u.error)}
                </span>
                {u.status === "error" && (
                  <button
                    onClick={() =>
                      openManualForm({
                        initialName: guessNameFromFile(u.name),
                        fileName: u.name,
                        hint: t.manualRescueHint,
                        rescueKey: u.key,
                      })
                    }
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    {t.candAddManual}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {candidates && candidates.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200/70 bg-white px-4 py-2.5 text-sm shadow-sm shadow-gray-200/60">
          <label className="flex items-center gap-2 text-gray-600">
            <input
              type="checkbox"
              checked={selected.size === candidates.length}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            {t.selectAll}
          </label>
          {selected.size > 0 && (
            <span className="text-gray-400">
              {t.selectedCount}: {selected.size}
            </span>
          )}
          <div className="ml-auto flex gap-2">
            <button
              onClick={askDeleteSelected}
              disabled={selected.size === 0}
              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t.deleteSelected} {selected.size > 0 && `(${selected.size})`}
            </button>
            <button
              onClick={askDeleteAll}
              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              {t.deleteAll}
            </button>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-sm shadow-gray-200/60">
        {candidates === null ? (
          <div className="space-y-3 p-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : candidates.length === 0 && !busy ? (
          <p className="p-6 text-center text-sm text-gray-500">{t.candEmpty}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3">{t.colName}</th>
                <th className="px-4 py-3">{t.colScore}</th>
                <th className="hidden px-4 py-3 md:table-cell">{t.colSummary}</th>
                <th className="hidden px-4 py-3 sm:table-cell">{t.colInterview}</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {candidates.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/candidates/${c.id}`)}
                  className="cursor-pointer align-top hover:bg-indigo-50/50"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={(e) => toggleOne(c.id, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/candidates/${c.id}`} className="font-medium text-gray-900 hover:text-indigo-700">
                        {c.extractedName}
                      </Link>
                      {c.source === "manual" && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          {t.manualBadge}
                        </span>
                      )}
                      {c.injectionSuspected && (
                        <span
                          title={t.injectionWarning}
                          className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600 ring-1 ring-inset ring-red-200"
                        >
                          {t.injectionBadge}
                        </span>
                      )}
                    </div>
                    {c.fileName && <div className="truncate text-xs text-gray-400">{c.fileName}</div>}
                    <div className="mt-1 line-clamp-2 text-xs text-gray-600 md:hidden">{firstLine(c.summary)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={c.cvScore} />
                    {c.interviewScore != null && (
                      <div className="mt-1 sm:hidden">
                        <ScoreBadge score={c.interviewScore} />
                      </div>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                    <span className="line-clamp-2">{firstLine(c.summary)}</span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {c.interviewScore != null ? <ScoreBadge score={c.interviewScore} /> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => askDeleteOne(c, e)}
                      title={t.deleteOne}
                      aria-label={t.deleteOne}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="text-xs text-gray-500">{t.disclaimer}</p>

      {confirmTarget && (
        <ConfirmDialog
          message={confirmTarget.message}
          confirmLabel={t.deleteConfirmButton}
          cancelLabel={t.deleteCancelButton}
          busyLabel={t.deleting}
          busy={deleting}
          onCancel={() => setConfirmTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {manualForm && (
        <ManualForm
          t={t}
          apiFetch={apiFetch}
          initialName={manualForm.initialName}
          initialCriteriaNames={manualForm.initialCriteriaNames}
          fileName={manualForm.fileName}
          hint={manualForm.hint}
          onCancel={() => setManualForm(null)}
          onCreated={onManualCreated}
        />
      )}
    </div>
  );
}

function firstLine(text = "") {
  const sentence = text.split(/(?<=[.!?])\s|\n/)[0];
  return sentence || text;
}

function guessNameFromFile(fileName) {
  return fileName.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ").trim();
}

function StatusIcon({ status }) {
  if (status === "processing")
    return <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />;
  if (status === "done") return <span className="grid h-4 w-4 place-items-center rounded-full bg-green-600 text-[10px] text-white">✓</span>;
  if (status === "error") return <span className="grid h-4 w-4 place-items-center rounded-full bg-red-600 text-[10px] text-white">!</span>;
  return <span className="h-4 w-4 rounded-full border-2 border-gray-300" />;
}
