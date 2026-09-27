import Link from "next/link";
import ScoreBadge from "./ScoreBadge";

// The final list a recruiter actually needs after interviews start coming
// in: every interviewed candidate, ranked by CV score + interview score
// averaged together — not a chart to read, just numbers in order.
export default function CandidateRanking({ t, candidates }) {
  return (
    <section className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm shadow-gray-200/60 sm:p-6">
      <h2 className="text-lg font-semibold">{t.statsRankingTitle}</h2>
      <p className="mt-1 text-sm text-gray-600">{t.statsRankingHint}</p>

      {!candidates ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <p className="mt-6 text-center text-sm text-gray-500">{t.statsRankingEmpty}</p>
      ) : (
        <ol className="mt-4 space-y-2">
          {candidates.map((c, i) => (
            <li key={c.id}>
              <Link
                href={`/candidates/${c.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-gray-100 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/40 sm:flex-nowrap"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-1.5 basis-full sm:basis-auto">
                  <span className="truncate font-medium text-gray-900">{c.name}</span>
                  {c.source === "manual" && (
                    <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      {t.manualBadge}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-4 text-center">
                  <ScoreStat label={t.statsRankingCv} score={c.cvScore} />
                  <ScoreStat label={t.statsRankingInterview} score={c.interviewScore} />
                  <ScoreStat label={t.statsRankingOverall} score={c.overallScore} emphasis />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function ScoreStat({ label, score, emphasis = false }) {
  return (
    <span className="flex w-14 flex-col items-center gap-1">
      <span className={`text-[10px] uppercase tracking-wide ${emphasis ? "font-semibold text-gray-600" : "text-gray-400"}`}>
        {label}
      </span>
      <ScoreBadge score={score} />
    </span>
  );
}
