"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

export default function StatsPage() {
  const { t } = useT();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  const fmt = (n, digits) => (n == null ? "—" : n.toFixed(digits));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t.statsTitle}</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label={t.statsInterviews} value={stats?.totalInterviews} />
        <Tile label={t.statsCandidates} value={stats?.totalCandidates} />
        <Tile label={t.statsAvgCv} value={stats && fmt(stats.avgCvScore, 0)} suffix="/100" />
        <Tile label={t.statsAvgInterview} value={stats && fmt(stats.avgInterviewScore, 1)} suffix="/5" />
      </div>

      <section className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm shadow-gray-200/60 sm:p-6">
        <h2 className="text-lg font-semibold">{t.statsWeakest}</h2>
        <p className="mt-1 text-sm text-gray-600">{t.statsWeakestHint}</p>

        {!stats ? (
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : stats.weakestCompetencies.length === 0 ? (
          <p className="mt-6 text-center text-sm text-gray-500">{t.statsNoData}</p>
        ) : (
          <ul className="mt-5 space-y-4">
            {stats.weakestCompetencies.map((c) => (
              <li key={c.name}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium" title={c.name}>{c.name}</span>
                  <span className="shrink-0 tabular-nums text-gray-600">
                    <strong className="text-gray-900">{c.average.toFixed(1)}</strong> / 5
                    <span className="ml-2 text-xs text-gray-400">
                      ({t.statsTimes}: {c.count})
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full ${c.average < 2.5 ? "bg-red-500" : c.average < 3.5 ? "bg-amber-500" : "bg-green-500"}`}
                    style={{ width: `${(c.average / 5) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Tile({ label, value, suffix }) {
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm shadow-gray-200/60">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">
        {value ?? <span className="inline-block h-7 w-12 animate-pulse rounded bg-gray-100 align-middle" />}
        {value != null && value !== "—" && suffix && <span className="ml-1 text-sm font-normal text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
}
