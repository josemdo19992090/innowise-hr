import Link from "next/link";

// Only one vacancy is active at a time, and a recruiter coming back days
// later shouldn't have to open the vacancy page to remember which role
// these scores were given against.
export default function VacancyBanner({ t, vacancy }) {
  if (!vacancy?.summary) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-2.5 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-indigo-700">{t.activeVacancy}</span>
      <span className="min-w-0 flex-1 truncate text-gray-700" title={vacancy.summary}>
        {vacancy.summary}
      </span>
      <Link href="/vacancy" className="text-xs font-medium text-indigo-600 hover:underline">
        {t.activeVacancyChange}
      </Link>
    </div>
  );
}
