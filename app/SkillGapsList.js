// Average score per competency across every saved interview — a signal
// about the whole candidate pool ("what does everyone seem to be missing"),
// not about any one person. Kept as its own component so /stats can order
// it deliberately below the per-candidate ranking.
export default function SkillGapsList({ t, competencies }) {
  return (
    <section className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm shadow-gray-200/60 sm:p-6">
      <h2 className="text-lg font-semibold">{t.statsWeakest}</h2>
      <p className="mt-1 text-sm text-gray-600">{t.statsWeakestHint}</p>

      {!competencies ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      ) : competencies.length === 0 ? (
        <p className="mt-6 text-center text-sm text-gray-500">{t.statsNoData}</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {competencies.map((c) => (
            <li key={c.name}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium" title={c.name}>
                  {c.name}
                </span>
                <span className="shrink-0 tabular-nums text-gray-600">
                  <strong className="text-gray-900">{c.average.toFixed(1)}</strong> / 10
                  <span className="ml-2 text-xs text-gray-400">
                    ({t.statsTimes}: {c.count})
                  </span>
                </span>
              </div>
              {c.variants?.length > 1 && (
                <p className="mt-0.5 truncate text-xs text-gray-400" title={c.variants.join(" · ")}>
                  {t.statsVariants(c.variants.length)}: {c.variants.join(" · ")}
                </p>
              )}
              <div className="mt-1.5 h-2 rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full ${c.average < 5 ? "bg-red-500" : c.average < 7 ? "bg-amber-500" : "bg-green-500"}`}
                  style={{ width: `${(c.average / 10) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
