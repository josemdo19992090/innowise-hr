"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { useApiFetch } from "@/lib/session";
import VacancyBanner from "../VacancyBanner";
import CandidateRanking from "../CandidateRanking";
import SkillGapsList from "../SkillGapsList";

export default function StatsPage() {
  const { t } = useT();
  const apiFetch = useApiFetch();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    apiFetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, [apiFetch]);

  const fmt = (n, digits) => (n == null ? "—" : n.toFixed(digits));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t.statsTitle}</h1>

      <VacancyBanner t={t} vacancy={stats?.vacancy} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label={t.statsInterviews} value={stats?.totalInterviews} />
        <Tile label={t.statsCandidates} value={stats?.totalCandidates} />
        <Tile label={t.statsAvgCv} value={stats && fmt(stats.avgCvScore, 0)} suffix="/100" />
        <Tile label={t.statsAvgInterview} value={stats && fmt(stats.avgInterviewScore, 0)} suffix="/100" />
      </div>

      {stats && <CandidateRanking t={t} candidates={stats.interviewRanking} />}

      <SkillGapsList t={t} competencies={stats?.weakestCompetencies} />
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
