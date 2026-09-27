"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT, errorText } from "@/lib/i18n";
import ScoreBadge from "../ScoreBadge";

// Free-tier Gemini quotas are per-minute, so don't fire every file at once.
const CONCURRENCY = 2;

export default function CandidatesPage() {
  const { t } = useT();
  const router = useRouter();
  const [candidates, setCandidates] = useState(null);
  const [hasVacancy, setHasVacancy] = useState(true);
  const [uploads, setUploads] = useState([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    const data = await fetch("/api/candidates").then((r) => r.json());
    setCandidates(data.candidates);
    setHasVacancy(data.hasVacancy);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setUpload = (key, patch) =>
    setUploads((list) => list.map((u) => (u.key === key ? { ...u, ...patch } : u)));

  async function handleFiles(fileList) {
    const files = [...fileList].filter((f) => f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf");
    if (!files.length) return;
    const batch = files.map((file, i) => ({ key: `${Date.now()}-${i}`, file, name: file.name, status: "queued" }));
    setUploads((list) => [...batch, ...list]);

    const queue = [...batch];
    const worker = async () => {
      while (queue.length) {
        const job = queue.shift();
        setUpload(job.key, { status: "processing" });
        try {
          const form = new FormData();
          form.append("file", job.file);
          const res = await fetch("/api/candidates", { method: "POST", body: form });
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t.candTitle}</h1>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="font-semibold">{t.candUploadTitle}</h2>
        <p className="mt-1 text-sm text-gray-600">{t.candUploadHint}</p>

        {!hasVacancy ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
            {t.candNoVacancy}
            <Link href="/" className="font-medium underline">
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
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t.candChoose}
            </button>
            <span className="text-sm text-gray-500">{t.candDrop}</span>
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
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
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
                <th className="w-10 px-4 py-3">#</th>
                <th className="px-4 py-3">{t.colName}</th>
                <th className="px-4 py-3">{t.colScore}</th>
                <th className="hidden px-4 py-3 md:table-cell">{t.colSummary}</th>
                <th className="hidden px-4 py-3 sm:table-cell">{t.colInterview}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {candidates.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/candidates/${c.id}`)}
                  className="cursor-pointer align-top hover:bg-indigo-50/50"
                >
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/candidates/${c.id}`} className="font-medium text-gray-900 hover:text-indigo-700">
                      {c.extractedName}
                    </Link>
                    <div className="truncate text-xs text-gray-400">{c.fileName}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-gray-600 md:hidden">{firstLine(c.summary)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={c.cvScore} />
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                    <span className="line-clamp-2">{firstLine(c.summary)}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-700 sm:table-cell">
                    {c.interviewScore != null ? `${c.interviewScore.toFixed(1)} / 5` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="text-xs text-gray-500">{t.disclaimer}</p>
    </div>
  );
}

function firstLine(text = "") {
  const sentence = text.split(/(?<=[.!?])\s|\n/)[0];
  return sentence || text;
}

function StatusIcon({ status }) {
  if (status === "processing")
    return <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />;
  if (status === "done") return <span className="grid h-4 w-4 place-items-center rounded-full bg-green-600 text-[10px] text-white">✓</span>;
  if (status === "error") return <span className="grid h-4 w-4 place-items-center rounded-full bg-red-600 text-[10px] text-white">!</span>;
  return <span className="h-4 w-4 rounded-full border-2 border-gray-300" />;
}
